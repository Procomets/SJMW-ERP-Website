import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import type { InventoryItem, MaterialReceipt } from '../types/warehouse.types';

const INVENTORY_COL = 'inventory';
const RECEIPTS_COL = 'materialReceipts';
const MATERIAL_MASTER_COL = 'materialMaster';

// ─── Fetch all inventory items ────────────────────────────────────────────────
export const fetchInventory = async (): Promise<InventoryItem[]> => {
  // 1. Fetch active materials that should be shown in the warehouse
  const matQuery = query(collection(db, MATERIAL_MASTER_COL), orderBy('materialId', 'asc'));
  const matSnap = await getDocs(matQuery);
  const activeMaterials = matSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as any))
    .filter(m => m.status === 'Active' && m.showInWarehouse === true);

  // 2. Fetch current inventory records
  const q = query(collection(db, INVENTORY_COL), orderBy('materialCode', 'asc'));
  const snap = await getDocs(q);
  const inventoryDocs = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as InventoryItem[];

  // 3. Merge active materials into inventory
  const mergedInventory: InventoryItem[] = activeMaterials.map((m) => {
    const matchedInv = inventoryDocs.find(
      (inv) =>
        inv.materialId === m.id ||
        inv.materialId === m.materialId ||
        inv.materialCode?.toUpperCase() === m.materialCode?.toUpperCase()
    );

    if (matchedInv) {
      return {
        ...matchedInv,
        materialCode: m.materialCode,
        materialName: m.materialName,
        minimumStockKg: m.minimumStockKg,
        efficiencyPercentage: m.efficiencyPercentage ?? matchedInv.efficiencyPercentage,
      } as InventoryItem;
    } else {
      // Synthesize a new inventory item with 0 stock
      const now = Timestamp.now();
      return {
        id: m.id, // Use the material master's Firebase document ID
        materialId: m.materialId || m.id,
        materialCode: m.materialCode,
        materialName: m.materialName,
        currentStockKg: 0,
        minimumStockKg: m.minimumStockKg,
        averageCost: 0,
        efficiencyPercentage: m.efficiencyPercentage,
        status: 'Out Of Stock',
        lastReceiptDate: null,
        createdAt: m.createdAt || now,
        updatedAt: m.updatedAt || now,
      } as InventoryItem;
    }
  });

  // 4. Sort the merged list alphabetically by materialCode
  mergedInventory.sort((a, b) => (a.materialCode || '').localeCompare(b.materialCode || ''));

  return mergedInventory;
};

// ─── Fetch all material receipts ──────────────────────────────────────────────
export const fetchMaterialReceipts = async (): Promise<MaterialReceipt[]> => {
  const q = query(collection(db, RECEIPTS_COL), orderBy('dateReceived', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      materials: Array.isArray(data.materials) ? data.materials : [],
      totalReceivedWeightKg: data.totalReceivedKg ?? data.totalReceivedWeightKg ?? 0,
      totalReturnedWeightKg: data.totalReturnedKg ?? data.totalReturnedWeightKg ?? 0,
      totalNetIntakeWeightKg: data.netIntakeKg ?? data.totalNetIntakeWeightKg ?? 0,
    } as MaterialReceipt;
  });
};

// ─── Update inventory item (admin override) ───────────────────────────────────
export const updateInventoryItem = async (
  id: string,
  updates: Partial<Pick<InventoryItem, 'minimumStockKg' | 'currentStockKg' | 'averageCost'>>
): Promise<void> => {
  await updateDoc(doc(db, INVENTORY_COL, id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// ─── Delete a material receipt ────────────────────────────────────────────────
export const deleteMaterialReceipt = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, RECEIPTS_COL, id));
};

// ─── Adjust inventory stock for a given material code ──────────────────────────
export const adjustInventoryStock = async (
  materialCode: string,
  changeKg: number
): Promise<void> => {
  if (!materialCode || changeKg === 0) return;

  const q = query(
    collection(db, INVENTORY_COL),
    where('materialCode', '==', materialCode.toUpperCase())
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    const docRef = snap.docs[0].ref;
    const currentStock = Number(snap.docs[0].data().currentStockKg) || 0;
    const newStock = Math.max(0, currentStock + changeKg);
    await updateDoc(docRef, {
      currentStockKg: newStock,
      updatedAt: serverTimestamp(),
    });
  } else {
    // If inventory item does not exist, look up material in masterController to create it
    const mmQuery = query(
      collection(db, MATERIAL_MASTER_COL),
      where('materialCode', '==', materialCode.toUpperCase())
    );
    const mmSnap = await getDocs(mmQuery);

    if (!mmSnap.empty) {
      const mmDoc = mmSnap.docs[0];
      const mmData = mmDoc.data();
      const mmId = mmDoc.id;

      const newInventoryItem = {
        materialId: mmData.materialId || mmId,
        materialCode: mmData.materialCode,
        materialName: mmData.materialName,
        currentStockKg: Math.max(0, changeKg),
        minimumStockKg: Number(mmData.minimumStockKg) || 0,
        averageCost: 0,
        efficiencyPercentage: Number(mmData.efficiencyPercentage) || 0,
        status: 'Healthy',
        lastReceiptDate: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, INVENTORY_COL, mmId), newInventoryItem);
    }
  }
};

