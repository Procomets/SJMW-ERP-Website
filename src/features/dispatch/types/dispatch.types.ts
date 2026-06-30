import { Timestamp } from 'firebase/firestore';

// ─── Dispatch Item (one heat per item) ───────────────────────────────────────
export interface DispatchItem {
  finishedGoodsId: string;
  heatNo: string;
  availableWeightKg: number;
  availablePieces: number;
  dispatchWeightKg: number;
  dispatchPieces: number;
}

// ─── Firestore Document ───────────────────────────────────────────────────────
export interface DispatchEntry {
  id: string;
  dispatchNumber: string;

  dispatchDate: Timestamp;

  // Customer
  customerId: string;
  customerName: string;
  customerCode?: string; // Resolved from vendor code
  vendor?: any;          // Resolved matched VendorMaster object

  alloyType: string;

  // Line items
  dispatchItems: DispatchItem[];

  // Totals
  totalDispatchWeightKg: number;
  totalDispatchPieces: number;

  // Logistics
  vehicleNumber: string;
  driverName: string;
  remarks: string;

  // Audit
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Form Data ────────────────────────────────────────────────────────────────
export interface DispatchFormData {
  dispatchDate: string;            // ISO date string for the form
  customerId: string;
  customerName: string;
  alloyType: string;
  dispatchItems: DispatchItemForm[];
  vehicleNumber: string;
  driverName: string;
  remarks: string;
}

export interface DispatchItemForm {
  finishedGoodsId: string;
  heatNo: string;
  availableWeightKg: number;
  availablePieces: number;
  dispatchWeightKg: number | '';
  dispatchPieces: number | '';
}

export const getEmptyDispatchForm = (): DispatchFormData => ({
  dispatchDate: new Date().toISOString().slice(0, 10),
  customerId: '',
  customerName: '',
  alloyType: '',
  dispatchItems: [],
  vehicleNumber: '',
  driverName: '',
  remarks: '',
});
