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
import type {
  ProformaInvoice,
  ProformaInvoiceFormData,
} from '../types/proformaInvoice.types';

const COLLECTION_NAME = 'proformaInvoices';

/**
 * Converts numbers to Indian English Words (Lakh, Crore, Thousand)
 */
export const numberToWordsIndian = (num: number): string => {
  const rounded = Math.round(num);
  if (rounded === 0) return 'Zero Only';

  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  ];
  const teens = [
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
    'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  const convertTwoDigits = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return singleDigits[n];
    if (n < 20) return teens[n - 10];
    const unit = n % 10;
    return `${tens[Math.floor(n / 10)]} ${unit ? singleDigits[unit] : ''}`.trim();
  };

  const convertThreeDigits = (n: number): string => {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += `${singleDigits[hundred]} Hundred `;
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res.trim();
  };

  let remaining = rounded;
  let words = '';

  // Crores (>= 1,00,00,000)
  if (remaining >= 10000000) {
    const crore = Math.floor(remaining / 10000000);
    words += `${numberToWordsIndian(crore)} Crore `;
    remaining %= 10000000;
  }

  // Lakhs (>= 1,00,000)
  if (remaining >= 100000) {
    const lakh = Math.floor(remaining / 100000);
    words += `${convertTwoDigits(lakh)} Lakh `;
    remaining %= 100000;
  }

  // Thousands (>= 1,000)
  if (remaining >= 1000) {
    const thousand = Math.floor(remaining / 1000);
    words += `${convertTwoDigits(thousand)} Thousand `;
    remaining %= 1000;
  }

  // Remaining hundreds and below
  if (remaining > 0) {
    words += convertThreeDigits(remaining);
  }

  return `Indian Rupees ${words.trim()} Only`;
};

/**
 * Calculates financial year e.g. "26-27"
 */
export const getFinancialYear = (d = new Date()): string => {
  const month = d.getMonth() + 1;
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
 * Generates next Proforma Invoice Number sequence (e.g. SJMW/PI/024/26-27)
 */
export const generateNextInvoiceNumber = (
  existingList: ProformaInvoice[],
  date = new Date()
): string => {
  const fy = getFinancialYear(date);
  const prefix = `SJMW/PI/`;
  const suffix = `/${fy}`;

  let maxNum = 0;
  for (const inv of existingList) {
    if (inv.invoiceNo && inv.invoiceNo.startsWith(prefix) && inv.invoiceNo.endsWith(suffix)) {
      const middle = inv.invoiceNo.slice(prefix.length, inv.invoiceNo.length - suffix.length);
      const parsed = parseInt(middle, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  const nextNum = maxNum > 0 ? maxNum + 1 : 1;
  return `SJMW/PI/${String(nextNum).padStart(3, '0')}/${fy}`;
};

/**
 * Computes subtotal, taxes, and grand totals from form
 */
export const computeInvoiceTotals = (form: ProformaInvoiceFormData) => {
  const subTotal = form.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
    0
  );

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  const totalRate = form.taxRatePercent || 18;
  if (form.isInterstate) {
    igstAmount = (subTotal * totalRate) / 100;
  } else {
    const halfRate = totalRate / 2;
    cgstAmount = (subTotal * halfRate) / 100;
    sgstAmount = (subTotal * halfRate) / 100;
  }

  const totalTaxAmount = igstAmount + cgstAmount + sgstAmount;
  const grandTotal = subTotal + totalTaxAmount;

  return {
    subTotal,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTaxAmount,
    grandTotal,
    taxAmountInWords: numberToWordsIndian(totalTaxAmount),
    totalAmountInWords: numberToWordsIndian(grandTotal),
  };
};

/**
 * Real-time subscription to proformaInvoices
 */
export const subscribeProformaInvoices = (
  callback: (invoices: ProformaInvoice[]) => void
): Unsubscribe => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: ProformaInvoice[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as ProformaInvoice));
    callback(list);
  });
};

/**
 * One-time fetch of proformaInvoices
 */
export const fetchProformaInvoices = async (): Promise<ProformaInvoice[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as ProformaInvoice[];
};

/**
 * Creates a new Proforma Invoice in Firestore
 */
export const createProformaInvoice = async (
  form: ProformaInvoiceFormData,
  createdBy: string
): Promise<string> => {
  const totals = computeInvoiceTotals(form);

  const payload = {
    invoiceNo: form.invoiceNo.trim(),
    date: form.date.trim(),
    eWayBillNo: form.eWayBillNo.trim(),
    deliveryNote: form.deliveryNote.trim(),
    modeTermsOfPayment: form.modeTermsOfPayment.trim(),
    referenceNoAndDate: form.referenceNoAndDate.trim(),
    otherReferences: form.otherReferences.trim(),
    buyerOrderNo: form.buyerOrderNo.trim(),
    buyerOrderDate: form.buyerOrderDate.trim(),
    dispatchDocNo: form.dispatchDocNo.trim(),
    deliveryNoteDate: form.deliveryNoteDate.trim(),
    dispatchedThrough: form.dispatchedThrough.trim(),
    destination: form.destination.trim(),
    termsOfDelivery: form.termsOfDelivery.trim(),

    customerId: form.customerId || '',
    consignee: { ...form.consignee },
    buyer: form.sameAsConsignee ? { ...form.consignee } : { ...form.buyer },

    items: form.items.map((it, idx) => ({
      id: it.id || String(idx + 1),
      slNo: idx + 1,
      description: it.description.trim(),
      hsnSac: it.hsnSac.trim() || '76012010',
      quantity: Number(it.quantity) || 0,
      rate: Number(it.rate) || 0,
      per: it.per || 'KGS',
      amount: (Number(it.quantity) || 0) * (Number(it.rate) || 0),
    })),

    isInterstate: form.isInterstate,
    taxRatePercent: form.taxRatePercent || 18,

    ...totals,

    createdBy: createdBy || 'Admin',
    updatedBy: createdBy || 'Admin',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
  return docRef.id;
};

/**
 * Updates an existing Proforma Invoice in Firestore
 */
export const updateProformaInvoice = async (
  id: string,
  form: ProformaInvoiceFormData,
  updatedBy: string
): Promise<void> => {
  const totals = computeInvoiceTotals(form);

  const payload = {
    invoiceNo: form.invoiceNo.trim(),
    date: form.date.trim(),
    eWayBillNo: form.eWayBillNo.trim(),
    deliveryNote: form.deliveryNote.trim(),
    modeTermsOfPayment: form.modeTermsOfPayment.trim(),
    referenceNoAndDate: form.referenceNoAndDate.trim(),
    otherReferences: form.otherReferences.trim(),
    buyerOrderNo: form.buyerOrderNo.trim(),
    buyerOrderDate: form.buyerOrderDate.trim(),
    dispatchDocNo: form.dispatchDocNo.trim(),
    deliveryNoteDate: form.deliveryNoteDate.trim(),
    dispatchedThrough: form.dispatchedThrough.trim(),
    destination: form.destination.trim(),
    termsOfDelivery: form.termsOfDelivery.trim(),

    customerId: form.customerId || '',
    consignee: { ...form.consignee },
    buyer: form.sameAsConsignee ? { ...form.consignee } : { ...form.buyer },

    items: form.items.map((it, idx) => ({
      id: it.id || String(idx + 1),
      slNo: idx + 1,
      description: it.description.trim(),
      hsnSac: it.hsnSac.trim() || '76012010',
      quantity: Number(it.quantity) || 0,
      rate: Number(it.rate) || 0,
      per: it.per || 'KGS',
      amount: (Number(it.quantity) || 0) * (Number(it.rate) || 0),
    })),

    isInterstate: form.isInterstate,
    taxRatePercent: form.taxRatePercent || 18,

    ...totals,

    updatedBy: updatedBy || 'Admin',
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, COLLECTION_NAME, id), payload);
};

/**
 * Deletes a Proforma Invoice from Firestore
 */
export const deleteProformaInvoice = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};
