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
    notified: true,
  };

  const ref = await addDoc(collection(db, COL), payload);

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

  // Fetch old heatNo to support heat name changes
  let oldHeatNo: string | undefined;
  let oldSerialNo = 0;
  try {
    const docRef = doc(db, COL, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      oldHeatNo = snap.data().heatNo;
      oldSerialNo = snap.data().serialNo || 0;
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
    notified: true,
  });

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
    notified: true,
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
  // Fetch old heatNo to delete finished good
  let oldHeatNo: string | undefined;
  try {
    const docRef = doc(db, COL, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      oldHeatNo = snap.data().heatNo;
    }
  } catch (err) {
    console.error("Failed to fetch production entry before delete for sync:", err);
  }

  await deleteDoc(doc(db, COL, id));

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
