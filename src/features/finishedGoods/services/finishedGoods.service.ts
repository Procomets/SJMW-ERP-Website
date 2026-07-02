import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  limit,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import type { FinishedGoodEntry, FinishedGoodEditFormData, FinishedGoodStatus, DrassEntry, DrassFormData } from '../types/finishedGoods.types';
import type { ProductionLedgerEntry } from '../../productionLedger/types/productionLedger.types';
import type { CostLedgerEntry } from '../../costLedger/types/costLedger.types';

const COL = 'finishedGoods';
const PRODUCTION_COL = 'productionLedger';
const COST_COL = 'costLedger';
const DRASS_COL = 'drassLedger';

// ─── Fetch all finished goods ─────────────────────────────────────────────────
export const fetchFinishedGoods = async (): Promise<FinishedGoodEntry[]> => {
  const q = query(collection(db, COL), orderBy('productionDate', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  } as FinishedGoodEntry));
};

// ─── Sync from Production: create/update finished goods from production records ─
export const syncFinishedGoodsFromProduction = async (): Promise<{
  created: number;
  updated: number;
  skipped: number;
}> => {
  // Fetch all production entries
  const prodQ = query(collection(db, PRODUCTION_COL), orderBy('serialNo', 'desc'));
  const prodSnap = await getDocs(prodQ);
  const productionEntries = prodSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  } as ProductionLedgerEntry));

  // Fetch all cost entries
  const costSnap = await getDocs(collection(db, COST_COL));
  const costEntries = costSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  } as CostLedgerEntry));

  // Fetch existing finished goods (keyed by heatNo)
  const fgSnap = await getDocs(collection(db, COL));
  const existingByHeat = new Map<string, { id: string; data: FinishedGoodEntry }>();
  fgSnap.docs.forEach((d) => {
    const data = d.data() as FinishedGoodEntry;
    if (data.heatNo) {
      existingByHeat.set(data.heatNo, { id: d.id, data: { ...data, id: d.id } });
    }
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const prod of productionEntries) {
    if (!prod.heatNo) { skipped++; continue; }

    // Find matching cost entry by heatNo
    const costEntry = costEntries.find((c) => c.heatNo === prod.heatNo);
    const productionCostPerKg = costEntry?.totalProductionCostPerKg ?? 0;
    const estimatedSellingPrice = costEntry?.sellingPricePerKg ?? 0;

    const goodOutputKg = prod.goodIngots ?? 0;
    const numberOfPieces = prod.noOfPieces ?? prod.totalPieces ?? 0;
    const existing = existingByHeat.get(prod.heatNo);

    if (existing) {
      // Guard: Only sync docs that have been explicitly approved by an admin.
      if (existing.data.manuallyApproved !== true) {
        skipped++;
        continue;
      }

      // Update production-derived fields only; preserve dispatch tracking
      const dispatchedKg = existing.data.dispatchedWeightKg ?? 0;
      const remainingKg = Math.max(0, goodOutputKg - dispatchedKg);

      const dispatchedPcs = existing.data.dispatchedPieces ?? 0;
      const remainingPcs = Math.max(0, numberOfPieces - dispatchedPcs);

      let status: FinishedGoodStatus = existing.data.status ?? 'Available';
      if (dispatchedKg === 0 && dispatchedPcs === 0) status = 'Available';
      else if (dispatchedKg >= goodOutputKg || dispatchedPcs >= numberOfPieces) status = 'Fully Dispatched';
      else status = 'Partially Dispatched';

      await updateDoc(doc(db, COL, existing.id), {
        heatNo: prod.heatNo,
        productionDate: prod.date,
        alloyType: prod.alloyType ?? '',
        grossWeightKg: prod.totalInput ?? 0,
        goodOutputKg,
        numberOfPieces,
        productionCostPerKg,
        estimatedSellingPrice,
        efficiencyPercentage: prod.efficiencyPercentage ?? 0,
        availableWeightKg: goodOutputKg,
        remainingWeightKg: remainingKg,
        remainingPieces: remainingPcs,
        status,
        productionLedgerId: prod.id,
        costLedgerId: costEntry?.id ?? null,
        updatedAt: serverTimestamp(),
      });
      updated++;
    } else {
      skipped++;
    }
  }

  return { created, updated, skipped };
};

// ─── Approve a Heat: Upsert Finished Goods document in Backend ───────────────
// Finds any existing finishedGoods doc for this heatNo and UPDATES it (stamping
// manuallyApproved: true).  If none exists yet, creates a fresh document.
// This prevents duplicate docs when old auto-synced records exist.
export const approveFinishedGood = async (
  prod: ProductionLedgerEntry,
  costEntry: CostLedgerEntry | null,
): Promise<void> => {
  // Guard: cost ledger must exist before a heat can be approved
  if (!costEntry) {
    throw new Error(`Cannot approve heat ${prod.heatNo}: Cost Ledger entry is missing.`);
  }

  const productionCostPerKg = costEntry.totalProductionCostPerKg ?? 0;
  const estimatedSellingPrice = costEntry.sellingPricePerKg ?? 0;

  const goodOutputKg = prod.goodIngots ?? 0;
  const numberOfPieces = prod.noOfPieces ?? prod.totalPieces ?? 0;

  // Check if a finishedGoods doc already exists for this heatNo
  const existingQ = query(collection(db, COL), where('heatNo', '==', prod.heatNo), limit(1));
  const existingSnap = await getDocs(existingQ);
  const existingDoc = existingSnap.docs[0];

  if (existingDoc) {
    // Update the existing doc, preserving dispatch history but stamping manuallyApproved
    const existingData = existingDoc.data() as FinishedGoodEntry;
    const dispatchedKg = existingData.dispatchedWeightKg ?? 0;
    const remainingKg = Math.max(0, goodOutputKg - dispatchedKg);
    const dispatchedPcs = existingData.dispatchedPieces ?? 0;
    const remainingPcs = Math.max(0, numberOfPieces - dispatchedPcs);

    let status: FinishedGoodStatus = existingData.status ?? 'Available';
    if (dispatchedKg === 0 && dispatchedPcs === 0) status = 'Available';
    else if (dispatchedKg >= goodOutputKg || dispatchedPcs >= numberOfPieces) status = 'Fully Dispatched';
    else status = 'Partially Dispatched';

    await updateDoc(doc(db, COL, existingDoc.id), {
      heatNo: prod.heatNo,
      productionDate: prod.date,
      alloyType: prod.alloyType ?? '',
      grossWeightKg: prod.totalInput ?? 0,
      goodOutputKg,
      numberOfPieces,
      productionCostPerKg,
      estimatedSellingPrice,
      efficiencyPercentage: prod.efficiencyPercentage ?? 0,
      availableWeightKg: goodOutputKg,
      remainingWeightKg: remainingKg,
      remainingPieces: remainingPcs,
      status,
      productionLedgerId: prod.id,
      costLedgerId: costEntry.id,
      manuallyApproved: true,
      updatedAt: serverTimestamp(),
    });
  } else {
    // No existing doc — create a fresh one
    const now = serverTimestamp() as Timestamp;
    await addDoc(collection(db, COL), {
      heatNo: prod.heatNo,
      productionDate: prod.date,
      alloyType: prod.alloyType ?? '',
      grossWeightKg: prod.totalInput ?? 0,
      goodOutputKg,
      numberOfPieces,
      productionCostPerKg,
      estimatedSellingPrice,
      efficiencyPercentage: prod.efficiencyPercentage ?? 0,
      availableWeightKg: goodOutputKg,
      dispatchedWeightKg: 0,
      remainingWeightKg: goodOutputKg,
      dispatchedPieces: 0,
      remainingPieces: numberOfPieces,
      status: 'Available' as FinishedGoodStatus,
      productionLedgerId: prod.id,
      costLedgerId: costEntry.id,
      manuallyApproved: true,
      createdAt: now,
      updatedAt: now,
    });
  }
};

// ─── Update a finished good (Admin edit) ──────────────────────────────────────
export const updateFinishedGood = async (
  id: string,
  form: FinishedGoodEditFormData,
  goodOutputKg: number,
  numberOfPieces: number,
): Promise<void> => {
  const dispatchedKg = Number(form.dispatchedWeightKg) || 0;
  const remainingKg = Math.max(0, goodOutputKg - dispatchedKg);

  const dispatchedPcs = Number(form.dispatchedPieces) || 0;
  const remainingPcs = Math.max(0, numberOfPieces - dispatchedPcs);

  let status: FinishedGoodStatus = form.status;
  if (dispatchedKg === 0 && dispatchedPcs === 0) status = 'Available';
  else if (dispatchedKg >= goodOutputKg || dispatchedPcs >= numberOfPieces) status = 'Fully Dispatched';
  else status = 'Partially Dispatched';

  await updateDoc(doc(db, COL, id), {
    estimatedSellingPrice: Number(form.estimatedSellingPrice) || 0,
    dispatchedWeightKg: dispatchedKg,
    remainingWeightKg: remainingKg,
    dispatchedPieces: dispatchedPcs,
    remainingPieces: remainingPcs,
    status,
    updatedAt: serverTimestamp(),
  });
};

// ─── Sync single finished good (auto backend trigger) ──────────────────────────
export const syncFinishedGoodsForHeat = async (
  heatNo: string,
  oldHeatNo?: string,
): Promise<void> => {
  const heatsToSync = new Set<string>();
  if (heatNo) heatsToSync.add(heatNo.trim());
  if (oldHeatNo) heatsToSync.add(oldHeatNo.trim());

  for (const h of heatsToSync) {
    if (!h) continue;

    // 1. Fetch production entry for this heatNo
    const prodQ = query(
      collection(db, PRODUCTION_COL),
      where('heatNo', '==', h),
      limit(1),
    );
    const prodSnap = await getDocs(prodQ);
    const prodDoc = prodSnap.docs[0];

    // 2. Fetch finished goods entry for this heatNo
    const fgQ = query(
      collection(db, COL),
      where('heatNo', '==', h),
      limit(1),
    );
    const fgSnap = await getDocs(fgQ);
    const fgDoc = fgSnap.docs[0];

    if (!prodDoc) {
      // If no production entry exists, delete the finished good if it exists
      if (fgDoc) {
        await deleteDoc(doc(db, COL, fgDoc.id));
      }
      continue;
    }

    const prod = { id: prodDoc.id, ...prodDoc.data() } as ProductionLedgerEntry;

    // 3. Fetch cost entry for this heatNo
    const costQ = query(
      collection(db, COST_COL),
      where('heatNo', '==', h),
      limit(1),
    );
    const costSnap = await getDocs(costQ);
    const costDoc = costSnap.docs[0];
    const costEntry = costDoc ? ({ id: costDoc.id, ...costDoc.data() } as CostLedgerEntry) : null;

    const productionCostPerKg = costEntry?.totalProductionCostPerKg ?? 0;
    const estimatedSellingPrice = costEntry?.sellingPricePerKg ?? 0;

    const goodOutputKg = prod.goodIngots ?? 0;
    const numberOfPieces = prod.noOfPieces ?? prod.totalPieces ?? 0;

    if (fgDoc) {
      const existingData = fgDoc.data() as FinishedGoodEntry;

      // Guard: Only update finished goods docs that have been explicitly approved by an admin.
      // If manuallyApproved is not true, skip the update — this heat must go through the
      // Approval Queue before its data is stored in Finished Goods.
      if (existingData.manuallyApproved !== true) {
        continue;
      }

      const dispatchedKg = existingData.dispatchedWeightKg ?? 0;
      const remainingKg = Math.max(0, goodOutputKg - dispatchedKg);

      const dispatchedPcs = existingData.dispatchedPieces ?? 0;
      const remainingPcs = Math.max(0, numberOfPieces - dispatchedPcs);

      let status: FinishedGoodStatus = existingData.status ?? 'Available';
      if (dispatchedKg === 0 && dispatchedPcs === 0) status = 'Available';
      else if (dispatchedKg >= goodOutputKg || dispatchedPcs >= numberOfPieces) status = 'Fully Dispatched';
      else status = 'Partially Dispatched';

      await updateDoc(doc(db, COL, fgDoc.id), {
        heatNo: prod.heatNo,
        productionDate: prod.date,
        alloyType: prod.alloyType ?? '',
        grossWeightKg: prod.totalInput ?? 0,
        goodOutputKg,
        numberOfPieces,
        productionCostPerKg,
        estimatedSellingPrice,
        efficiencyPercentage: prod.efficiencyPercentage ?? 0,
        availableWeightKg: goodOutputKg,
        remainingWeightKg: remainingKg,
        remainingPieces: remainingPcs,
        status,
        productionLedgerId: prod.id,
        costLedgerId: costEntry?.id ?? null,
        updatedAt: serverTimestamp(),
      });
    } else {
      // If it doesn't exist, we DO NOT auto-create it (must be approved first via Approval Queue)
    }
  }
};

// ─── Fetch all dross entries ──────────────────────────────────────────────────
export const fetchDrassEntries = async (): Promise<DrassEntry[]> => {
  const q = query(collection(db, DRASS_COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  } as DrassEntry));
};

// ─── Add a dross entry ────────────────────────────────────────────────────────
export const addDrassEntry = async (form: DrassFormData): Promise<string> => {
  const now = serverTimestamp() as Timestamp;
  const startTs = Timestamp.fromDate(new Date(form.startDate));
  const endTs = Timestamp.fromDate(new Date(form.endDate));
  const storageDays = Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (1000 * 60 * 60 * 24));

  const payload = {
    drassCode: form.drassCode.trim().toUpperCase(),
    heatIds: form.heatIds,
    heatNumbers: form.heatNumbers,
    grossWeightKg: Number(form.grossWeightKg) || 0,
    remainingWeightKg: Number(form.remainingWeightKg) || 0,
    startDate: startTs,
    endDate: endTs,
    storageDays: isNaN(storageDays) ? 0 : storageDays,
    status: form.status,
    approved: form.approved ?? (form.status === 'Available' || form.status === 'Dispatched'),
    remarks: form.remarks?.trim() ?? '',
    createdBy: form.createdBy?.trim() || 'Akshay',
    createdAt: now,
    updatedAt: now,
  };

  const ref = await addDoc(collection(db, DRASS_COL), payload);
  await updateDoc(doc(db, DRASS_COL, ref.id), {
    drassId: ref.id,
  });
  return ref.id;
};

// ─── Update a dross entry ─────────────────────────────────────────────────────
export const updateDrassEntry = async (id: string, form: DrassFormData): Promise<void> => {
  const startTs = Timestamp.fromDate(new Date(form.startDate));
  const endTs = Timestamp.fromDate(new Date(form.endDate));
  const storageDays = Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (1000 * 60 * 60 * 24));

  await updateDoc(doc(db, DRASS_COL, id), {
    drassCode: form.drassCode.trim().toUpperCase(),
    heatIds: form.heatIds,
    heatNumbers: form.heatNumbers,
    grossWeightKg: Number(form.grossWeightKg) || 0,
    remainingWeightKg: Number(form.remainingWeightKg) || 0,
    startDate: startTs,
    endDate: endTs,
    storageDays: isNaN(storageDays) ? 0 : storageDays,
    status: form.status,
    approved: form.approved ?? (form.status === 'Available' || form.status === 'Dispatched'),
    remarks: form.remarks?.trim() ?? '',
    createdBy: form.createdBy?.trim() || 'Akshay',
    updatedAt: serverTimestamp(),
  });
};

// ─── Delete a dross entry ─────────────────────────────────────────────────────
export const deleteDrassEntry = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, DRASS_COL, id));
};

// ─── Approve a dross entry ─────────────────────────────────────────────────────
export const approveDrassEntry = async (id: string): Promise<void> => {
  await updateDoc(doc(db, DRASS_COL, id), {
    status: 'Available',
    approved: true,
    updatedAt: serverTimestamp(),
  });
};

