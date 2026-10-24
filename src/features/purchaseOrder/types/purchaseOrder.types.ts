import { Timestamp } from 'firebase/firestore';

export interface PurchaseOrderItem {
  id: string;
  siNo: number;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface PurchaseOrderTerms {
  paymentTerms: string;
  gstTax: string;
  delivery: string;
  otherTerms?: string[];
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string; // DD/MM/YYYY
  vendorId?: string;
  vendorName: string;
  vendorGst: string;
  vendorAddress: string;
  quotationRef: string;
  items: PurchaseOrderItem[];
  subTotal?: number;
  taxPercent?: number;
  taxAmount?: number;
  includeGstInTotal?: boolean;
  totalAmount: number;
  terms: PurchaseOrderTerms;
  notes?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedBy: string;
  updatedAt: Timestamp;
}

export interface PurchaseOrderFormData {
  poNumber: string;
  date: string;
  vendorId?: string;
  vendorName: string;
  vendorGst: string;
  vendorAddress: string;
  quotationRef: string;
  items: PurchaseOrderItem[];
  subTotal?: number;
  taxPercent?: number;
  taxAmount?: number;
  includeGstInTotal?: boolean;
  totalAmount?: number;
  terms: PurchaseOrderTerms;
}

export const DEFAULT_TERMS: PurchaseOrderTerms = {
  paymentTerms: '45 Days',
  gstTax: '18% Extra',
  delivery: 'IMMEDIATE.',
  otherTerms: [],
};

export const getEmptyPurchaseOrderForm = (): PurchaseOrderFormData => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const dateStr = `${day}/${month}/${year}`;

  return {
    poNumber: '',
    date: dateStr,
    vendorId: '',
    vendorName: '',
    vendorGst: '',
    vendorAddress: '',
    quotationRef: 'By Telephonic',
    items: [
      {
        id: '1',
        siNo: 1,
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ],
    terms: { ...DEFAULT_TERMS },
  };
};
