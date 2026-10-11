import { Timestamp } from 'firebase/firestore';

export interface ProformaInvoiceItem {
  id: string;
  slNo: number;
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  per: string; // e.g. KGS, PCS, NOS
  amount: number;
}

export interface ProformaInvoiceParty {
  name: string;
  address: string;
  gstin: string;
  stateName: string;
  stateCode: string;
}

export interface ProformaInvoice {
  id: string;
  invoiceNo: string;
  date: string; // DD-MM-YYYY
  eWayBillNo?: string;
  deliveryNote?: string;
  modeTermsOfPayment: string;
  referenceNoAndDate?: string;
  otherReferences?: string;
  buyerOrderNo?: string;
  buyerOrderDate?: string;
  dispatchDocNo?: string;
  deliveryNoteDate?: string;
  dispatchedThrough?: string;
  destination?: string;
  termsOfDelivery?: string;

  // Party details
  customerId?: string;
  consignee: ProformaInvoiceParty;
  buyer: ProformaInvoiceParty;

  // Items & Tax calculation
  items: ProformaInvoiceItem[];
  isInterstate: boolean; // True if IGST, False if CGST + SGST
  taxRatePercent: number; // e.g. 18% (9% CGST + 9% SGST or 18% IGST)
  
  subTotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  grandTotal: number;

  taxAmountInWords?: string;
  totalAmountInWords?: string;

  createdBy: string;
  createdAt: Timestamp;
  updatedBy: string;
  updatedAt: Timestamp;
}

export interface ProformaInvoiceFormData {
  invoiceNo: string;
  date: string;
  eWayBillNo: string;
  deliveryNote: string;
  modeTermsOfPayment: string;
  referenceNoAndDate: string;
  otherReferences: string;
  buyerOrderNo: string;
  buyerOrderDate: string;
  dispatchDocNo: string;
  deliveryNoteDate: string;
  dispatchedThrough: string;
  destination: string;
  termsOfDelivery: string;

  customerId?: string;
  sameAsConsignee: boolean;
  consignee: ProformaInvoiceParty;
  buyer: ProformaInvoiceParty;

  items: ProformaInvoiceItem[];
  isInterstate: boolean;
  taxRatePercent: number;
}

export const getEmptyProformaInvoiceForm = (): ProformaInvoiceFormData => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const dateStr = `${day}-${month}-${year}`;

  return {
    invoiceNo: '',
    date: dateStr,
    eWayBillNo: '',
    deliveryNote: '',
    modeTermsOfPayment: 'IMMEDIATE',
    referenceNoAndDate: '',
    otherReferences: '',
    buyerOrderNo: '',
    buyerOrderDate: '',
    dispatchDocNo: '',
    deliveryNoteDate: '',
    dispatchedThrough: '',
    destination: '',
    termsOfDelivery: '',

    customerId: '',
    sameAsConsignee: true,
    consignee: {
      name: '',
      address: '',
      gstin: '',
      stateName: 'Tamil Nadu',
      stateCode: '33',
    },
    buyer: {
      name: '',
      address: '',
      gstin: '',
      stateName: 'Tamil Nadu',
      stateCode: '33',
    },

    items: [
      {
        id: '1',
        slNo: 1,
        description: '',
        hsnSac: '76012010',
        quantity: 0,
        rate: 0,
        per: 'KGS',
        amount: 0,
      },
    ],
    isInterstate: false,
    taxRatePercent: 18,
  };
};
