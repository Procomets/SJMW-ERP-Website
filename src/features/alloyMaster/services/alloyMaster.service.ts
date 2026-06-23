import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import type { AlloyMaster, AlloyMasterFormData } from '../types/alloyMaster.types';

const COL = 'alloyMaster';

// Subscribe to real-time alloy updates
export const subscribeAlloys = (
  callback: (alloys: AlloyMaster[]) => void
): Unsubscribe => {
  const q = query(collection(db, COL), orderBy('alloyCode', 'asc'));
  return onSnapshot(q, (snap) => {
    const alloys = snap.docs.map((d) => {
      const data = d.data() as Omit<AlloyMaster, 'id'>;
      // Backward-compat: if doc still has old flat displayColor/secondaryColor
      if (!data.displayColors) {
        data.displayColors = {
          primaryColor: (data as any).displayColor ?? '#1565C0',
          secondaryColor: (data as any).secondaryColor ?? '',
        };
      }
      return { id: d.id, ...data } as AlloyMaster;
    });
    callback(alloys);
  });
};

// Subscribe to active alloys only (for use in other modules)
export const subscribeActiveAlloys = (
  callback: (alloys: AlloyMaster[]) => void
): Unsubscribe => {
  const q = query(collection(db, COL), orderBy('alloyCode', 'asc'));
  return onSnapshot(q, (snap) => {
    const alloys = snap.docs
      .map((d) => {
        const data = d.data() as Omit<AlloyMaster, 'id'>;
        if (!data.displayColors) {
          data.displayColors = {
            primaryColor: (data as any).displayColor ?? '#1565C0',
            secondaryColor: (data as any).secondaryColor ?? '',
          };
        }
        return { id: d.id, ...data } as AlloyMaster;
      })
      .filter((a) => a.status === 'Active');
    callback(alloys);
  });
};

// Add a new alloy
export const addAlloy = async (
  form: AlloyMasterFormData,
  createdBy: string
): Promise<string> => {
  const now = serverTimestamp() as Timestamp;

  const payload: Omit<AlloyMaster, 'id'> = {
    alloyCode: form.alloyCode.trim().toUpperCase(),
    alloyName: form.alloyName.trim(),
    alloyCategory: form.alloyCategory,
    description: form.description.trim(),
    defaultSellingMarginPercentage: Number(form.defaultSellingMarginPercentage),
    displayColors: form.displayColors,
    chemicalComposition: form.chemicalComposition,
    keyProperties: form.keyProperties.trim(),
    bisCompliant: form.bisCompliant,
    isoCompliant: form.isoCompliant,
    status: form.status,
    createdBy,
    createdAt: now,
    updatedBy: createdBy,
    updatedAt: now,
  };

  const ref = await addDoc(collection(db, COL), payload);
  return ref.id;
};

// Update an existing alloy
export const updateAlloy = async (
  id: string,
  form: AlloyMasterFormData,
  updatedBy: string
): Promise<void> => {
  await updateDoc(doc(db, COL, id), {
    alloyCode: form.alloyCode.trim().toUpperCase(),
    alloyName: form.alloyName.trim(),
    alloyCategory: form.alloyCategory,
    description: form.description.trim(),
    defaultSellingMarginPercentage: Number(form.defaultSellingMarginPercentage),
    displayColors: form.displayColors,
    chemicalComposition: form.chemicalComposition,
    keyProperties: form.keyProperties.trim(),
    bisCompliant: form.bisCompliant,
    isoCompliant: form.isoCompliant,
    status: form.status,
    updatedBy,
    updatedAt: serverTimestamp(),
  });
};

// Toggle alloy status
export const updateAlloyStatus = async (
  id: string,
  newStatus: 'Active' | 'Inactive',
  updatedBy: string
): Promise<void> => {
  await updateDoc(doc(db, COL, id), {
    status: newStatus,
    updatedBy,
    updatedAt: serverTimestamp(),
  });
};

// Delete alloy (hard delete — only if no transactions reference it)
export const deleteAlloy = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COL, id));
};
