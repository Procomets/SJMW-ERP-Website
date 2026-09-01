import { collection, getDocs, query, where, setDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import type { SalaryRecord } from '../types/salarySheet';

const SALARY_COLLECTION = 'salarySheets';

export const getSalaryRecordsForMonth = async (monthYear: string): Promise<SalaryRecord[]> => {
  const q = query(
    collection(db, SALARY_COLLECTION),
    where('monthYear', '==', monthYear)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SalaryRecord[];
};

export const saveSalaryRecord = async (record: Omit<SalaryRecord, 'id' | 'updatedAt'>, email: string): Promise<void> => {
  const periodStr = record.period && record.period !== 'monthly' ? `_${record.period}` : '';
  const docId = `${record.employeeId}_${record.monthYear}${periodStr}`;
  const docRef = doc(db, SALARY_COLLECTION, docId);
  
  await setDoc(docRef, {
    ...record,
    updatedAt: serverTimestamp(),
    updatedBy: email
  }, { merge: true });
};

export const saveSalaryRecordsBatch = async (records: Omit<SalaryRecord, 'id' | 'updatedAt'>[], email: string): Promise<void> => {
  const batch = writeBatch(db);
  records.forEach(record => {
    const periodStr = record.period && record.period !== 'monthly' ? `_${record.period}` : '';
    const docId = `${record.employeeId}_${record.monthYear}${periodStr}`;
    const docRef = doc(db, SALARY_COLLECTION, docId);
    batch.set(docRef, {
      ...record,
      updatedAt: serverTimestamp(),
      updatedBy: email
    }, { merge: true });
  });
  await batch.commit();
};
