import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import type { MaterialMaster, MaterialMasterFormData } from '../types/materialMaster.types';

const COL = 'materialMaster';

// Generate next material ID
const generateMaterialId = (existingMaterials: MaterialMaster[]): string => {
  const maxNum = existingMaterials.reduce((max, m) => {
    const num = parseInt(m.materialId.replace('MAT', ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return `MAT${String(maxNum + 1).padStart(3, '0')}`;
};

// Fetch all materials (one-time)
export const fetchMaterials = async (): Promise<MaterialMaster[]> => {
  const q = query(collection(db, COL), orderBy('materialId', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MaterialMaster));
};

// Subscribe to real-time material updates
export const subscribeMaterials = (
  callback: (materials: MaterialMaster[]) => void
): Unsubscribe => {
  const q = query(collection(db, COL), orderBy('materialId', 'asc'));
  return onSnapshot(q, (snap) => {
    const materials = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MaterialMaster));
    callback(materials);
  });
};

// Add a new material
export const addMaterial = async (
  form: MaterialMasterFormData,
  existingMaterials: MaterialMaster[]
): Promise<string> => {
  const now = serverTimestamp() as Timestamp;
  const materialId = form.materialId.trim() || generateMaterialId(existingMaterials);

  const payload = {
    materialId,
    materialCode: form.materialCode.trim().toUpperCase(),
    materialName: form.materialName.trim(),
    efficiencyPercentage: Number(form.efficiencyPercentage),
    minimumStockKg: Number(form.minimumStockKg),
    unit: form.unit.trim() || 'Kg',
    status: form.status,
    showInWarehouse: form.showInWarehouse,
    showInProduction: form.showInProduction,
    showInCostLedger: form.showInCostLedger,
    showInReports: form.showInReports,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await addDoc(collection(db, COL), payload);
  return ref.id;
};

// Update an existing material
export const updateMaterial = async (
  id: string,
  form: Partial<MaterialMasterFormData>
): Promise<void> => {
  const payload: any = {
    ...form,
    materialCode: form.materialCode?.trim().toUpperCase(),
    materialName: form.materialName?.trim(),
    updatedAt: serverTimestamp(),
  };

  // Remove undefined values
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

  await updateDoc(doc(db, COL, id), payload);
};

// Toggle material status (Active / Disabled)
export const toggleMaterialStatus = async (
  id: string,
  currentStatus: 'Active' | 'Disabled'
): Promise<void> => {
  const newStatus = currentStatus === 'Active' ? 'Disabled' : 'Active';
  await updateDoc(doc(db, COL, id), {
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
};

// Delete material (hard delete - use carefully)
export const deleteMaterial = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COL, id));
};

// Seed default materials if collection is empty
export const seedDefaultMaterials = async (): Promise<void> => {
  const existing = await fetchMaterials();
  if (existing.length > 0) return;

  const defaults: Omit<MaterialMasterFormData, 'materialId'>[] = [
    { materialCode: 'CC',      materialName: 'Casting Scrap',       efficiencyPercentage: 92, minimumStockKg: 1000, unit: 'Kg', status: 'Active', showInWarehouse: true, showInProduction: true, showInCostLedger: true, showInReports: true },
    { materialCode: 'RTR',     materialName: 'Return Scrap',        efficiencyPercentage: 89, minimumStockKg: 1000, unit: 'Kg', status: 'Active', showInWarehouse: true, showInProduction: true, showInCostLedger: true, showInReports: true },
    { materialCode: 'BB',      materialName: 'Baled/Breaking Scrap',efficiencyPercentage: 89, minimumStockKg: 1000, unit: 'Kg', status: 'Active', showInWarehouse: true, showInProduction: true, showInCostLedger: true, showInReports: true },
    { materialCode: 'SAF',     materialName: 'SAB / Scrap Alloy Feed',efficiencyPercentage: 84, minimumStockKg: 1000, unit: 'Kg', status: 'Active', showInWarehouse: true, showInProduction: true, showInCostLedger: true, showInReports: true },
    { materialCode: 'SI441',   materialName: 'Silicon Metal 441',   efficiencyPercentage: 95, minimumStockKg: 500,  unit: 'Kg', status: 'Active', showInWarehouse: true, showInProduction: true, showInCostLedger: true, showInReports: true },
    { materialCode: 'WHEEL',   materialName: 'Wheel Scrap',         efficiencyPercentage: 94, minimumStockKg: 1000, unit: 'Kg', status: 'Active', showInWarehouse: true, showInProduction: true, showInCostLedger: true, showInReports: true },
    { materialCode: 'GA',      materialName: 'Gama Scrap',          efficiencyPercentage: 88, minimumStockKg: 1000, unit: 'Kg', status: 'Active', showInWarehouse: true, showInProduction: true, showInCostLedger: true, showInReports: true },
    { materialCode: 'CU',      materialName: 'Copper',              efficiencyPercentage: 95, minimumStockKg: 200,  unit: 'Kg', status: 'Active', showInWarehouse: true, showInProduction: true, showInCostLedger: true, showInReports: true },
    { materialCode: 'LITHO',   materialName: 'Litho Scrap',         efficiencyPercentage: 92, minimumStockKg: 1000, unit: 'Kg', status: 'Active', showInWarehouse: true, showInProduction: true, showInCostLedger: true, showInReports: true },
    { materialCode: 'PARADISE', materialName: 'Paradise Scrap',     efficiencyPercentage: 90, minimumStockKg: 1000, unit: 'Kg', status: 'Active', showInWarehouse: true, showInProduction: true, showInCostLedger: true, showInReports: true },
    { materialCode: 'REJ',     materialName: 'Rejection Scrap',     efficiencyPercentage: 90, minimumStockKg: 1000, unit: 'Kg', status: 'Active', showInWarehouse: true, showInProduction: true, showInCostLedger: true, showInReports: true },
  ];

  for (let i = 0; i < defaults.length; i++) {
    const mat = defaults[i];
    const materialId = `MAT${String(i + 1).padStart(3, '0')}`;
    await addMaterial({ ...mat, materialId }, []);
  }
};
