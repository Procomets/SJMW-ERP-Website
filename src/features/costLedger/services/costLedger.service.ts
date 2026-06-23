import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import type {
  CostLedgerEntry,
  CostLedgerFormData,
} from '../types/costLedger.types';
import { calculateTotals } from '../types/costLedger.types';
import type { ProductionLedgerEntry } from '../../productionLedger/types/productionLedger.types';
import { syncFinishedGoodsForHeat } from '../../finishedGoods/services/finishedGoods.service';

const COL = 'costLedger';

// ─── Fetch all entries ────────────────────────────────────────────────────────
export const fetchCostLedger = async (): Promise<CostLedgerEntry[]> => {
  const q = query(collection(db, COL), orderBy('serialNo', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const rawMaterials = Array.isArray(data.materials) ? data.materials : [];
    
    // Map materials to standard CostMaterialEntry
    const materials = rawMaterials.map((m: any) => {
      const qty = Number(m.weightKg) || 0;
      const rateVal = Number(m.ratePerKg) || Number(m.costPerKg) || Number(m.rate) || 0;
      const amtVal = Number(m.amount) || Number(m.totalCost) || (qty * rateVal);
      return {
        materialId: m.materialId ?? '',
        materialCode: m.materialCode ?? '',
        materialName: m.materialName ?? '',
        weightKg: qty,
        ratePerKg: rateVal,
        amount: amtVal,
      };
    });

    const goodIngotsKg = Number(data.goodIngotsKg) || 0;
    const totalMaterialCost = Number(data.totalMaterialCost) || 0;
    const totalInputKg = Number(data.totalInputKg) || 0;
    
    const laborCostPerKg = Number(data.laborCostPerKg) || 0;
    const materialCostPerKg = Number(data.materialCostPerKg) || Number(data.totalMaterialCostPerKg) || (goodIngotsKg > 0 ? parseFloat((totalMaterialCost / goodIngotsKg).toFixed(4)) : 0);
    const totalProductionCost = Number(data.totalProductionCost) || (totalMaterialCost + (totalInputKg * laborCostPerKg));
    const totalProductionCostPerKg = Number(data.totalProductionCostPerKg) || (goodIngotsKg > 0 ? parseFloat((totalProductionCost / goodIngotsKg).toFixed(4)) : 0);
    const marginPercentage = Number(data.marginPercentage) || Number(data.sellingMarginPercentage) || 6;
    const sellingPricePerKg = Number(data.sellingPricePerKg) || 0;

    const totalRevenue = Number(data.totalRevenue) || goodIngotsKg * sellingPricePerKg;
    const totalProfit = Number(data.totalProfit) || (totalRevenue - totalProductionCost);
    const profitMarginPercentage = Number(data.profitMarginPercentage) || (totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0);

    return {
      id: d.id,
      ...data,
      materials,
      materialCostPerKg,
      laborCostPerKg,
      productionCostPerKg: Number(data.productionCostPerKg) || 0,
      totalProductionCost,
      totalProductionCostPerKg,
      marginPercentage,
      sellingPricePerKg,
      totalRevenue,
      totalProfit,
      profitMarginPercentage,
      // legacy support:
      totalMaterialCostPerKg: materialCostPerKg,
      sellingMarginPercentage: marginPercentage,
    } as CostLedgerEntry;
  });
};

// ─── Add entry ────────────────────────────────────────────────────────────────
export const addCostEntry = async (
  form: CostLedgerFormData,
  nextSerial: number,
): Promise<string> => {
  const totals = calculateTotals(form);
  const now = serverTimestamp() as Timestamp;
  const dateTs = Timestamp.fromDate(new Date(form.date));

  // Compute totalCost per material before saving (saving all key variants for maximum compatibility)
  const materialsToPersist = form.materials.map((m) => {
    const qty = Number(m.weightKg) || 0;
    const rateVal = Number(m.ratePerKg) || Number((m as any).costPerKg) || 0;
    const amtVal = qty * rateVal;
    return {
      materialId: m.materialId,
      materialCode: m.materialCode,
      materialName: m.materialName,
      weightKg: qty,
      ratePerKg: rateVal,
      costPerKg: rateVal, // legacy support
      rate: rateVal,      // legacy support
      amount: amtVal,
      totalCost: amtVal,  // legacy support
    };
  });

  const payload = {
    serialNo: nextSerial,
    heatNo: form.heatNo.trim(),
    date: dateTs,
    alloyType: form.alloyType.trim(),
    employeeName: form.employeeName.trim(),
    role: form.role.trim(),
    notified: form.notified,
    materials: materialsToPersist,

    // Calculated totals
    goodIngotsKg: Number(form.goodIngotsKg),
    totalInputKg: totals.totalInputKg,
    efficiencyPercentage: totals.efficiencyPercentage,
    totalMaterialCost: totals.totalMaterialCost,
    materialCostPerKg: totals.materialCostPerKg,
    laborCostPerKg: totals.laborCostPerKg,
    productionCostPerKg: 0,
    totalProductionCost: totals.totalProductionCost,
    totalProductionCostPerKg: totals.totalProductionCostPerKg,
    marginPercentage: totals.marginPercentage,
    sellingPricePerKg: totals.sellingPricePerKg,
    totalRevenue: totals.totalRevenue,
    totalProfit: totals.totalProfit,
    profitMarginPercentage: totals.profitMarginPercentage,
    // legacy support:
    totalMaterialCostPerKg: totals.materialCostPerKg,
    sellingMarginPercentage: totals.marginPercentage,

    createdAt: now,
    updatedAt: now,
  };

  const ref = await addDoc(collection(db, COL), payload);

  // Trigger auto sync
  try {
    await syncFinishedGoodsForHeat(form.heatNo.trim());
  } catch (err) {
    console.error("Failed to auto-sync finished goods on cost add:", err);
  }

  return ref.id;
};

// ─── Update entry ─────────────────────────────────────────────────────────────
export const updateCostEntry = async (
  id: string,
  form: CostLedgerFormData,
): Promise<void> => {
  const totals = calculateTotals(form);
  const dateTs = Timestamp.fromDate(new Date(form.date));

  const materialsToPersist = form.materials.map((m) => {
    const qty = Number(m.weightKg) || 0;
    const rateVal = Number(m.ratePerKg) || Number((m as any).costPerKg) || 0;
    const amtVal = qty * rateVal;
    return {
      materialId: m.materialId,
      materialCode: m.materialCode,
      materialName: m.materialName,
      weightKg: qty,
      ratePerKg: rateVal,
      costPerKg: rateVal, // legacy support
      rate: rateVal,      // legacy support
      amount: amtVal,
      totalCost: amtVal,  // legacy support
    };
  });

  // Fetch old heatNo to support heat name changes
  let oldHeatNo: string | undefined;
  try {
    const docRef = doc(db, COL, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      oldHeatNo = snap.data().heatNo;
    }
  } catch (err) {
    console.error("Failed to fetch old cost entry for sync:", err);
  }

  await updateDoc(doc(db, COL, id), {
    heatNo: form.heatNo.trim(),
    date: dateTs,
    alloyType: form.alloyType.trim(),
    employeeName: form.employeeName.trim(),
    role: form.role.trim(),
    notified: form.notified,
    materials: materialsToPersist,

    goodIngotsKg: Number(form.goodIngotsKg),
    totalInputKg: totals.totalInputKg,
    efficiencyPercentage: totals.efficiencyPercentage,
    totalMaterialCost: totals.totalMaterialCost,
    materialCostPerKg: totals.materialCostPerKg,
    laborCostPerKg: totals.laborCostPerKg,
    productionCostPerKg: 0,
    totalProductionCost: totals.totalProductionCost,
    totalProductionCostPerKg: totals.totalProductionCostPerKg,
    marginPercentage: totals.marginPercentage,
    sellingPricePerKg: totals.sellingPricePerKg,
    totalRevenue: totals.totalRevenue,
    totalProfit: totals.totalProfit,
    profitMarginPercentage: totals.profitMarginPercentage,
    // legacy support:
    totalMaterialCostPerKg: totals.materialCostPerKg,
    sellingMarginPercentage: totals.marginPercentage,

    updatedAt: serverTimestamp(),
  });

  // Trigger auto sync for new and old heat
  try {
    await syncFinishedGoodsForHeat(form.heatNo.trim(), oldHeatNo);
  } catch (err) {
    console.error("Failed to auto-sync finished goods on cost update:", err);
  }
};

// ─── Delete entry ─────────────────────────────────────────────────────────────
export const deleteCostEntry = async (id: string): Promise<void> => {
  // Fetch old heatNo to delete finished good or update it
  let oldHeatNo: string | undefined;
  try {
    const docRef = doc(db, COL, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      oldHeatNo = snap.data().heatNo;
    }
  } catch (err) {
    console.error("Failed to fetch cost entry before delete for sync:", err);
  }

  await deleteDoc(doc(db, COL, id));

  if (oldHeatNo) {
    try {
      await syncFinishedGoodsForHeat('', oldHeatNo);
    } catch (err) {
      console.error("Failed to auto-sync finished goods on cost delete:", err);
    }
  }
};

// ─── Fetch heats from production ledger for cost heat selection ───────────────
export const fetchProductionHeats = async (): Promise<ProductionLedgerEntry[]> => {
  const q = query(collection(db, 'productionLedger'), orderBy('serialNo', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      materials: Array.isArray(data.materials) ? data.materials : [],
    } as ProductionLedgerEntry;
  });
};

// ─── Auto-Sync Cost Ledger from Production Ledger Changes ─────────────────────
export const syncCostLedgerFromProduction = async (
  prod: ProductionLedgerEntry | null,
  oldHeatNo?: string,
): Promise<void> => {
  const normalizedOld = oldHeatNo?.trim();
  const normalizedNew = prod?.heatNo?.trim();

  if (!prod) {
    // Case 1: Production entry deleted - delete matching cost entry
    if (normalizedOld) {
      const q = query(collection(db, COL), where('heatNo', '==', normalizedOld), limit(1));
      const snap = await getDocs(q);
      if (snap.docs[0]) {
        await deleteDoc(doc(db, COL, snap.docs[0].id));
      }
    }
    return;
  }

  // Case 2: Production entry added or updated
  // Find if there is an existing Cost Ledger entry for either the new heatNo or the old heatNo (handling rename)
  let costDoc: any = null;
  if (normalizedNew) {
    const q = query(collection(db, COL), where('heatNo', '==', normalizedNew), limit(1));
    const snap = await getDocs(q);
    costDoc = snap.docs[0];
  }
  if (!costDoc && normalizedOld && normalizedOld !== normalizedNew) {
    const q = query(collection(db, COL), where('heatNo', '==', normalizedOld), limit(1));
    const snap = await getDocs(q);
    costDoc = snap.docs[0];
  }

  if (!costDoc) {
    // If no Cost Ledger entry exists, we don't auto-create it (it will be created by the user when entering costs)
    return;
  }

  const costEntry = { id: costDoc.id, ...costDoc.data() } as CostLedgerEntry;

  // Merge materials: update weights from production, preserve rates from cost entry
  const updatedMaterials = prod.materials.map((pm) => {
    const existingMat = costEntry.materials?.find(
      (cm) => cm.materialId === pm.materialId || cm.materialCode === pm.materialCode,
    );
    const rate = existingMat ? (existingMat.ratePerKg ?? (existingMat as any).costPerKg ?? (existingMat as any).rate ?? 0) : 0;
    const qty = pm.weightKg ?? 0;
    return {
      materialId: pm.materialId,
      materialCode: pm.materialCode,
      materialName: pm.materialName,
      weightKg: qty,
      ratePerKg: rate,
      amount: qty * rate,
    };
  });

  // Construct form data to calculate new totals
  const dateStr = prod.date instanceof Timestamp
    ? prod.date.toDate().toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const formData: CostLedgerFormData = {
    heatNo: normalizedNew || '',
    date: dateStr,
    alloyType: prod.alloyType,
    employeeName: costEntry.employeeName || '',
    role: costEntry.role || '',
    notified: costEntry.notified || false,
    goodIngotsKg: prod.goodIngots,
    laborCostPerKg: costEntry.laborCostPerKg || 0,
    marginPercentage: costEntry.marginPercentage || costEntry.sellingMarginPercentage || 6,
    materials: updatedMaterials,
  };

  const totals = calculateTotals(formData);

  await updateDoc(doc(db, COL, costEntry.id), {
    heatNo: normalizedNew,
    date: prod.date,
    alloyType: prod.alloyType,
    materials: updatedMaterials,

    goodIngotsKg: Number(formData.goodIngotsKg),
    totalInputKg: totals.totalInputKg,
    efficiencyPercentage: totals.efficiencyPercentage,
    totalMaterialCost: totals.totalMaterialCost,
    materialCostPerKg: totals.materialCostPerKg,
    laborCostPerKg: totals.laborCostPerKg,
    productionCostPerKg: 0,
    totalProductionCost: totals.totalProductionCost,
    totalProductionCostPerKg: totals.totalProductionCostPerKg,
    marginPercentage: totals.marginPercentage,
    sellingPricePerKg: totals.sellingPricePerKg,
    totalRevenue: totals.totalRevenue,
    totalProfit: totals.totalProfit,
    profitMarginPercentage: totals.profitMarginPercentage,
    // legacy support:
    totalMaterialCostPerKg: totals.materialCostPerKg,
    sellingMarginPercentage: totals.marginPercentage,

    updatedAt: serverTimestamp(),
  });
};
