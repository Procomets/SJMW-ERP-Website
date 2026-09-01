import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import type { ExpenseRegisterDoc } from '../types/expenseRegister.types';
import {
  buildDocId,
  buildDefaultExpenseRegister,
  MONTH_NUMBER_MAP,
  recalcAllTotals,
} from '../types/expenseRegister.types';

const COL = 'monthlyExpenseRegister';

// ─── Fetch a register by FY + Month ──────────────────────────────────────────
export const fetchExpenseRegister = async (
  year: string,
  month: string,
): Promise<ExpenseRegisterDoc | null> => {
  const docId = buildDocId(year, month);
  const snap = await getDoc(doc(db, COL, docId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ExpenseRegisterDoc;
};

// ─── Fetch all registers for a given year ────────────────────────────────────
export const fetchExpenseRegistersByYear = async (
  year: string,
): Promise<ExpenseRegisterDoc[]> => {
  const q = query(
    collection(db, COL),
    where('year', '==', year)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ExpenseRegisterDoc));
  
  // Sort locally by monthNumber to avoid needing a Firestore composite index
  return docs.sort((a, b) => (a.monthNumber || 0) - (b.monthNumber || 0));
};

// ─── Create or load a register (auto-creates if absent) ─────────────────────
export const loadOrCreateExpenseRegister = async (
  year: string,
  month: string,
  createdBy: string,
): Promise<ExpenseRegisterDoc> => {
  const existing = await fetchExpenseRegister(year, month);
  if (existing) return existing;

  // Create new
  const docId = buildDocId(year, month);
  const monthNumber = MONTH_NUMBER_MAP[month] || 1;
  const newDoc = buildDefaultExpenseRegister(year, month, monthNumber, createdBy);

  await setDoc(doc(db, COL, docId), {
    ...newDoc,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Fetch back to get server timestamps
  const created = await getDoc(doc(db, COL, docId));
  return { id: created.id, ...created.data() } as ExpenseRegisterDoc;
};

// ─── Save (update) an existing register ──────────────────────────────────────
export const saveExpenseRegister = async (
  year: string,
  month: string,
  data: Partial<ExpenseRegisterDoc>,
): Promise<void> => {
  const docId = buildDocId(year, month);

  // Recalculate totals before saving
  const categories = data.expenseCategories || [];
  const { categories: updatedCats, weeklyTotals, grandTotal } = recalcAllTotals(categories);

  // Strip the 'id' field before writing
  const { id: _id, ...rest } = data;

  await updateDoc(doc(db, COL, docId), {
    ...rest,
    expenseCategories: updatedCats,
    weeklyTotals,
    grandTotal,
    updatedAt: serverTimestamp(),
  });
};

// ─── Lock month (Admin only) ────────────────────────────────────────────────
export const lockExpenseRegister = async (
  year: string,
  month: string,
  lockedBy: string,
): Promise<void> => {
  const docId = buildDocId(year, month);
  await updateDoc(doc(db, COL, docId), {
    status: 'Locked',
    editable: false,
    lockedBy,
    lockedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// ─── Unlock month (Admin only) ──────────────────────────────────────────────
export const unlockExpenseRegister = async (
  year: string,
  month: string,
): Promise<void> => {
  const docId = buildDocId(year, month);
  await updateDoc(doc(db, COL, docId), {
    status: 'Open',
    editable: true,
    lockedBy: '',
    lockedAt: null,
    updatedAt: serverTimestamp(),
  });
};

// ─── Delete register (Admin only) ───────────────────────────────────────────
export const deleteExpenseRegister = async (
  year: string,
  month: string,
): Promise<void> => {
  const docId = buildDocId(year, month);
  await deleteDoc(doc(db, COL, docId));
};
