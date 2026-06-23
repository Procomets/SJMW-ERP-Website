import { Timestamp } from 'firebase/firestore';

// ─── Element Result ───────────────────────────────────────────────────────────
export interface QCElement {
  element: string;
  minValue: number;
  maxValue: number;
  observedValue: number;
  unit: string;
  status: 'PASS' | 'FAIL';
}

// ─── Quality Control Document (Firestore: qualityControl collection) ──────────
export interface QualityControlEntry {
  id: string;

  // Identity
  qualityControlId: string;      // e.g. "AUTO_GENERATED"
  heatNo: string;                // e.g. "HEAT-TEST"
  productionLedgerId: string;    // reference to productionLedger doc
  finishedGoodsId: string;       // reference to finishedGoods doc
  date: Timestamp;

  // Production details
  alloyType: string;
  furnaceNo: string;
  operatorName: string;
  supervisorName: string;

  // Shift
  shiftStartTime: string;
  shiftStartPeriod: 'AM' | 'PM';
  shiftEndTime: string;
  shiftEndPeriod: 'AM' | 'PM';

  // Test elements
  elements: QCElement[];
  overallStatus: 'PASS' | 'FAIL';

  // Supervisor submission
  supervisorSubmitted: boolean;
  supervisorSubmittedAt: Timestamp;

  // Admin verification
  verified: boolean;
  verifiedBy: string;
  verifiedAt: Timestamp;
  verificationRemarks: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
