import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import type {
  ProductionLedgerEntry,
  ProductionLedgerFormData,
} from '../types/productionLedger.types';
import { calcTotalInput, calcEfficiency } from '../types/productionLedger.types';
import { syncFinishedGoodsForHeat } from '../../finishedGoods/services/finishedGoods.service';
import { syncCostLedgerFromProduction } from '../../costLedger/services/costLedger.service';
import { adjustInventoryStock } from '../../warehouse/services/warehouse.service';

const COL = 'productionLedger';

const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// ─── Fetch all entries ────────────────────────────────────────────────────────
export const fetchProductionLedger = async (): Promise<ProductionLedgerEntry[]> => {
  const q = query(collection(db, COL), orderBy('serialNo', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const efficiencyVal = data.efficiencyPercentage !== undefined ? Number(data.efficiencyPercentage) : 0;
    return {
      id: d.id,
      ...data,
      // Normalize: ensure materials is always an array (handles old flat-field documents)
      materials: Array.isArray(data.materials) ? data.materials : [],
      noOfPieces: data.noOfPieces !== undefined ? Number(data.noOfPieces) : (data.totalPieces !== undefined ? Number(data.totalPieces) : 0),
      efficiencyStatus: data.efficiencyStatus ?? '',
      furnaceNo: data.furnaceNo ?? '',
      operatorName: data.operatorName ?? '',
      shiftStartTime: data.shiftStartTime ?? '',
      shiftStartPeriod: data.shiftStartPeriod ?? 'AM',
      shiftEndTime: data.shiftEndTime ?? '',
      shiftEndPeriod: data.shiftEndPeriod ?? 'AM',
      expectedEfficiencyPercentage: data.expectedEfficiencyPercentage !== undefined ? Number(data.expectedEfficiencyPercentage) : 90,
      actualEfficiencyPercentage: data.actualEfficiencyPercentage !== undefined ? Number(data.actualEfficiencyPercentage) : efficiencyVal,
      totalInputKg: data.totalInputKg !== undefined ? Number(data.totalInputKg) : (data.totalInput !== undefined ? Number(data.totalInput) : 0),
      goodIngotsKg: data.goodIngotsKg !== undefined ? Number(data.goodIngotsKg) : (data.goodIngots !== undefined ? Number(data.goodIngots) : 0),
      badIngotsKg: data.badIngotsKg !== undefined ? Number(data.badIngotsKg) : 0,
      notified: data.notified ?? false,
    } as ProductionLedgerEntry;
  });
};

// ─── Add entry ────────────────────────────────────────────────────────────────
export const addProductionEntry = async (
  form: ProductionLedgerFormData,
  nextSerial: number,
): Promise<string> => {
  const now = serverTimestamp() as Timestamp;
  const dateTs = Timestamp.fromDate(new Date(form.date));

  // Only save materials that have a non-zero weight
  const materialsToPersist = form.materials.map((m) => ({
    materialId: m.materialId,
    materialCode: m.materialCode,
    materialName: m.materialName,
    weightKg: Number(m.weightKg) || 0,
    efficiencyPercentage: Number(m.efficiencyPercentage) || 0,
  }));

  const totalInput = calcTotalInput(materialsToPersist);
  const efficiencyPercentage = calcEfficiency(Number(form.goodIngots), totalInput);

  const payload = {
    serialNo: nextSerial,
    heatNo: form.heatNo.trim(),
    date: dateTs,
    alloyType: form.alloyType.trim(),
    supervisorName: form.supervisorName?.trim() ?? '',
    materials: materialsToPersist,
    totalInput,
    goodIngots: Number(form.goodIngots),
    totalPieces: Number(form.noOfPieces) || Number(form.totalPieces) || 0,
    noOfPieces: Number(form.noOfPieces) || 0,
    efficiencyStatus: form.efficiencyStatus?.trim() ?? '',
    efficiencyPercentage,
    remarks: form.remarks?.trim() ?? '',
    createdAt: now,
    updatedAt: now,

    // New schema fields
    furnaceNo: form.furnaceNo?.trim().toUpperCase() ?? '',
    operatorName: toTitleCase(form.operatorName?.trim() ?? ''),
    shiftStartTime: form.shiftStartTime?.trim() ?? '',
    shiftStartPeriod: form.shiftStartPeriod ?? 'AM',
    shiftEndTime: form.shiftEndTime?.trim() ?? '',
    shiftEndPeriod: form.shiftEndPeriod ?? 'AM',
    expectedEfficiencyPercentage: Number(form.expectedEfficiencyPercentage) || 0,
    actualEfficiencyPercentage: efficiencyPercentage,
    totalInputKg: totalInput,
    goodIngotsKg: Number(form.goodIngots),
    badIngotsKg: Number(form.badIngotsKg) || 0,
    notified: true,
  };

  const ref = await addDoc(collection(db, COL), payload);

  // Sync with Warehouse Inventory
  try {
    for (const m of materialsToPersist) {
      if (m.weightKg > 0) {
        await adjustInventoryStock(m.materialCode, -m.weightKg);
      }
    }
    const badIngotsVal = Number(form.badIngotsKg) || 0;
    if (badIngotsVal > 0) {
      await adjustInventoryStock('REJ', badIngotsVal);
    }
  } catch (err) {
    console.error("Failed to sync warehouse stock on production add:", err);
  }

  const createdEntry: ProductionLedgerEntry = {
    id: ref.id,
    ...payload,
  };

  // Trigger auto sync to cost ledger first
  try {
    await syncCostLedgerFromProduction(createdEntry);
  } catch (err) {
    console.error("Failed to auto-sync cost ledger on production add:", err);
  }

  // Trigger auto sync to finished goods
  try {
    await syncFinishedGoodsForHeat(form.heatNo.trim());
  } catch (err) {
    console.error("Failed to auto-sync finished goods on production add:", err);
  }

  return ref.id;
};

// ─── Update entry ─────────────────────────────────────────────────────────────
export const updateProductionEntry = async (
  id: string,
  form: ProductionLedgerFormData,
): Promise<void> => {
  const dateTs = Timestamp.fromDate(new Date(form.date));

  const materialsToPersist = form.materials.map((m) => ({
    materialId: m.materialId,
    materialCode: m.materialCode,
    materialName: m.materialName,
    weightKg: Number(m.weightKg) || 0,
    efficiencyPercentage: Number(m.efficiencyPercentage) || 0,
  }));

  const totalInput = calcTotalInput(materialsToPersist);
  const efficiencyPercentage = calcEfficiency(Number(form.goodIngots), totalInput);

  // Fetch old heatNo and materials/badIngots for stock adjustment
  let oldHeatNo: string | undefined;
  let oldSerialNo = 0;
  let oldMaterials: any[] = [];
  let oldBadIngotsKg = 0;
  try {
    const docRef = doc(db, COL, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const oldData = snap.data();
      oldHeatNo = oldData.heatNo;
      oldSerialNo = oldData.serialNo || 0;
      oldMaterials = Array.isArray(oldData.materials) ? oldData.materials : [];
      oldBadIngotsKg = Number(oldData.badIngotsKg) || 0;
    }
  } catch (err) {
    console.error("Failed to fetch old production entry for sync:", err);
  }

  await updateDoc(doc(db, COL, id), {
    heatNo: form.heatNo.trim(),
    date: dateTs,
    alloyType: form.alloyType.trim(),
    supervisorName: form.supervisorName?.trim() ?? '',
    materials: materialsToPersist,
    totalInput,
    goodIngots: Number(form.goodIngots),
    totalPieces: Number(form.noOfPieces) || Number(form.totalPieces) || 0,
    noOfPieces: Number(form.noOfPieces) || 0,
    efficiencyStatus: form.efficiencyStatus?.trim() ?? '',
    efficiencyPercentage,
    remarks: form.remarks?.trim() ?? '',
    updatedAt: serverTimestamp(),

    // New schema fields
    furnaceNo: form.furnaceNo?.trim().toUpperCase() ?? '',
    operatorName: toTitleCase(form.operatorName?.trim() ?? ''),
    shiftStartTime: form.shiftStartTime?.trim() ?? '',
    shiftStartPeriod: form.shiftStartPeriod ?? 'AM',
    shiftEndTime: form.shiftEndTime?.trim() ?? '',
    shiftEndPeriod: form.shiftEndPeriod ?? 'AM',
    expectedEfficiencyPercentage: Number(form.expectedEfficiencyPercentage) || 0,
    actualEfficiencyPercentage: efficiencyPercentage,
    totalInputKg: totalInput,
    goodIngotsKg: Number(form.goodIngots),
    badIngotsKg: Number(form.badIngotsKg) || 0,
    notified: true,
  });

  // Sync with Warehouse Inventory
  try {
    // 1. Adjust for all materials in the new form
    for (const m of materialsToPersist) {
      const oldMat = oldMaterials.find(
        (om) => om.materialId === m.materialId || om.materialCode === m.materialCode
      );
      const oldWeight = oldMat ? Number(oldMat.weightKg) || 0 : 0;
      const changeKg = oldWeight - m.weightKg;
      if (changeKg !== 0) {
        await adjustInventoryStock(m.materialCode, changeKg);
      }
    }

    // 2. Adjust for materials that were in old entry but not in the new form at all
    for (const om of oldMaterials) {
      const stillExists = materialsToPersist.some(
        (nm) => nm.materialId === om.materialId || nm.materialCode === om.materialCode
      );
      if (!stillExists && om.weightKg > 0) {
        await adjustInventoryStock(om.materialCode, Number(om.weightKg) || 0);
      }
    }

    // 3. Adjust for badIngotsKg in Rejection Scrap (REJ)
    const newBadIngotsKg = Number(form.badIngotsKg) || 0;
    const badIngotsChange = newBadIngotsKg - oldBadIngotsKg;
    if (badIngotsChange !== 0) {
      await adjustInventoryStock('REJ', badIngotsChange);
    }
  } catch (err) {
    console.error("Failed to sync warehouse stock on production update:", err);
  }

  const updatedEntry: ProductionLedgerEntry = {
    id,
    serialNo: oldSerialNo,
    heatNo: form.heatNo.trim(),
    date: dateTs,
    alloyType: form.alloyType.trim(),
    supervisorName: form.supervisorName?.trim() ?? '',
    materials: materialsToPersist,
    totalInput,
    goodIngots: Number(form.goodIngots),
    totalPieces: Number(form.noOfPieces) || Number(form.totalPieces) || 0,
    noOfPieces: Number(form.noOfPieces) || 0,
    efficiencyStatus: form.efficiencyStatus?.trim() ?? '',
    efficiencyPercentage,
    remarks: form.remarks?.trim() ?? '',

    // New schema fields
    furnaceNo: form.furnaceNo?.trim().toUpperCase() ?? '',
    operatorName: toTitleCase(form.operatorName?.trim() ?? ''),
    shiftStartTime: form.shiftStartTime?.trim() ?? '',
    shiftStartPeriod: form.shiftStartPeriod ?? 'AM',
    shiftEndTime: form.shiftEndTime?.trim() ?? '',
    shiftEndPeriod: form.shiftEndPeriod ?? 'AM',
    expectedEfficiencyPercentage: Number(form.expectedEfficiencyPercentage) || 0,
    actualEfficiencyPercentage: efficiencyPercentage,
    totalInputKg: totalInput,
    goodIngotsKg: Number(form.goodIngots),
    badIngotsKg: Number(form.badIngotsKg) || 0,
    notified: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  // Trigger auto sync to cost ledger first
  try {
    await syncCostLedgerFromProduction(updatedEntry, oldHeatNo);
  } catch (err) {
    console.error("Failed to auto-sync cost ledger on production update:", err);
  }

  // Trigger auto sync for finished goods
  try {
    await syncFinishedGoodsForHeat(form.heatNo.trim(), oldHeatNo);
  } catch (err) {
    console.error("Failed to auto-sync finished goods on production update:", err);
  }
};

// ─── Delete entry ─────────────────────────────────────────────────────────────
export const deleteProductionEntry = async (id: string): Promise<void> => {
  // Fetch old heatNo, materials, and badIngots for stock adjustment
  let oldHeatNo: string | undefined;
  let oldMaterials: any[] = [];
  let oldBadIngotsKg = 0;
  try {
    const docRef = doc(db, COL, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      oldHeatNo = data.heatNo;
      oldMaterials = Array.isArray(data.materials) ? data.materials : [];
      oldBadIngotsKg = Number(data.badIngotsKg) || 0;
    }
  } catch (err) {
    console.error("Failed to fetch production entry before delete for sync:", err);
  }

  await deleteDoc(doc(db, COL, id));

  // Sync with Warehouse Inventory
  try {
    for (const m of oldMaterials) {
      if (m.weightKg > 0) {
        await adjustInventoryStock(m.materialCode, m.weightKg);
      }
    }
    if (oldBadIngotsKg > 0) {
      await adjustInventoryStock('REJ', -oldBadIngotsKg);
    }
  } catch (err) {
    console.error("Failed to sync warehouse stock on production delete:", err);
  }

  // Trigger auto sync to cost ledger first
  if (oldHeatNo) {
    try {
      await syncCostLedgerFromProduction(null, oldHeatNo);
    } catch (err) {
      console.error("Failed to auto-sync cost ledger on production delete:", err);
    }
  }

  if (oldHeatNo) {
    try {
      await syncFinishedGoodsForHeat('', oldHeatNo);
    } catch (err) {
      console.error("Failed to auto-sync finished goods on production delete:", err);
    }
  }
};
