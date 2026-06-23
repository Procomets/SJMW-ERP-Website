import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import type { QualityControlEntry } from '../types/qualityControl.types';

const QC_COL = 'qualityControl';

// ─── Fetch all QC entries ─────────────────────────────────────────────────────
export const fetchQualityControlEntries = async (): Promise<QualityControlEntry[]> => {
  const q = query(collection(db, QC_COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  } as QualityControlEntry));
};
