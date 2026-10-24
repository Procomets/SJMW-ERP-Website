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
import type { PurchaseOrder, PurchaseOrderFormData } from '../types/purchaseOrder.types';

const COLLECTION_NAME = 'purchaseOrders';

/**
 * Calculates current Indian Financial Year (e.g. 26-27 for Oct 2026)
 */
export const getFinancialYear = (d = new Date()): string => {
  const month = d.getMonth() + 1; // 1-12
  const fullYear = d.getFullYear();
  let startYear = fullYear;
  let endYear = fullYear + 1;

  if (month < 4) {
    startYear = fullYear - 1;
    endYear = fullYear;
  }

  const y1 = String(startYear).slice(-2);
  const y2 = String(endYear).slice(-2);
  return `${y1}-${y2}`;
};

/**
 * Generates the next PO Number in sequence (e.g., SJMW/024/26-27)
 */
export const generateNextPoNumber = (existingList: PurchaseOrder[], date = new Date()): string => {
  const fy = getFinancialYear(date);
  const prefix = `SJMW/`;
  const suffix = `/${fy}`;

  let maxNum = 0;
  for (const po of existingList) {
    if (po.poNumber && po.poNumber.startsWith(prefix) && po.poNumber.endsWith(suffix)) {
      const middle = po.poNumber.slice(prefix.length, po.poNumber.length - suffix.length);
      const parsed = parseInt(middle, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  // Default starting sequence if none exists: 23 or 1
  const nextNum = maxNum > 0 ? maxNum + 1 : 24;
  return `SJMW/${String(nextNum).padStart(3, '0')}/${fy}`;
};

/**
 * Subscribe to real-time PO collection updates
 */
export const subscribePurchaseOrders = (
  callback: (orders: PurchaseOrder[]) => void
): Unsubscribe => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: PurchaseOrder[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
      } as PurchaseOrder;
    });
    callback(list);
  });
};

/**
 * Fetch all purchase orders (one-time fetch)
 */
export const fetchPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as PurchaseOrder[];
};

/**
 * Calculates complete PO amounts: line item amounts, subtotal, GST tax, and grand total
 */
export const calculatePurchaseOrderTotals = (
  items: PurchaseOrderItem[],
  gstTaxStr: string = '18% Extra',
  includeGstInTotal?: boolean
) => {
  const cleanItems = (items || []).map((it, idx) => {
    const qty = Number(it.quantity) || 0;
    const rate = Number(it.rate) || 0;
    const amount = Math.round(qty * rate * 100) / 100;
    return {
      ...it,
      id: it.id || String(idx + 1),
      siNo: idx + 1,
      description: (it.description || '').trim(),
      quantity: qty,
      rate: rate,
      amount,
    };
  });

  const subTotal = cleanItems.reduce((sum, it) => sum + it.amount, 0);

  // Parse tax percent from terms (e.g., "18% Extra", "18%", "5%", "12%", "28%", "Nil")
  const gstMatch = (gstTaxStr || '').match(/(\d+(?:\.\d+)?)\s*%/);
  const taxPercent = gstMatch ? parseFloat(gstMatch[1]) : 0;
  const taxAmount = taxPercent > 0 ? Math.round(((subTotal * taxPercent) / 100) * 100) / 100 : 0;

  // Default to adding tax if taxPercent > 0 unless explicitly opted out
  const shouldAddTax = includeGstInTotal !== undefined 
    ? includeGstInTotal 
    : (taxPercent > 0 && (/extra/i.test(gstTaxStr || '') || taxPercent > 0));

  const totalAmount = shouldAddTax
    ? Math.round((subTotal + taxAmount) * 100) / 100
    : subTotal;

  return {
    items: cleanItems,
    subTotal,
    taxPercent,
    taxAmount,
    totalAmount,
    includeGstInTotal: shouldAddTax,
  };
};

/**
 * Create a new purchase order
 */
export const createPurchaseOrder = async (
  form: PurchaseOrderFormData,
  createdBy: string
): Promise<string> => {
  const calculated = calculatePurchaseOrderTotals(
    form.items,
    form.terms?.gstTax || '',
    form.includeGstInTotal
  );

  const payload = {
    poNumber: form.poNumber.trim(),
    date: form.date.trim(),
    vendorId: form.vendorId || '',
    vendorName: form.vendorName.trim(),
    vendorGst: form.vendorGst.trim(),
    vendorAddress: form.vendorAddress.trim(),
    quotationRef: form.quotationRef.trim(),
    items: calculated.items,
    subTotal: calculated.subTotal,
    taxPercent: calculated.taxPercent,
    taxAmount: calculated.taxAmount,
    includeGstInTotal: calculated.includeGstInTotal,
    totalAmount: calculated.totalAmount,
    terms: {
      paymentTerms: form.terms.paymentTerms.trim(),
      gstTax: form.terms.gstTax.trim(),
      delivery: form.terms.delivery.trim(),
      otherTerms: form.terms.otherTerms || [],
    },
    createdBy: createdBy || 'Admin',
    updatedBy: createdBy || 'Admin',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
  return docRef.id;
};

/**
 * Update an existing purchase order
 */
export const updatePurchaseOrder = async (
  id: string,
  form: PurchaseOrderFormData,
  updatedBy: string
): Promise<void> => {
  const calculated = calculatePurchaseOrderTotals(
    form.items,
    form.terms?.gstTax || '',
    form.includeGstInTotal
  );

  const payload = {
    poNumber: form.poNumber.trim(),
    date: form.date.trim(),
    vendorId: form.vendorId || '',
    vendorName: form.vendorName.trim(),
    vendorGst: form.vendorGst.trim(),
    vendorAddress: form.vendorAddress.trim(),
    quotationRef: form.quotationRef.trim(),
    items: calculated.items,
    subTotal: calculated.subTotal,
    taxPercent: calculated.taxPercent,
    taxAmount: calculated.taxAmount,
    includeGstInTotal: calculated.includeGstInTotal,
    totalAmount: calculated.totalAmount,
    terms: {
      paymentTerms: form.terms.paymentTerms.trim(),
      gstTax: form.terms.gstTax.trim(),
      delivery: form.terms.delivery.trim(),
      otherTerms: form.terms.otherTerms || [],
    },
    updatedBy: updatedBy || 'Admin',
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, COLLECTION_NAME, id), payload);
};

/**
 * Delete a purchase order
 */
export const deletePurchaseOrder = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};
