import { Timestamp } from 'firebase/firestore';

// ─── Status Values ────────────────────────────────────────────────────────────
// ─── Status Values ────────────────────────────────────────────────────────────
export type FinishedGoodStatus =
  | 'Available'
  | 'Partially Dispatched'
  | 'Fully Dispatched';

// ─── Firestore Document ───────────────────────────────────────────────────────
export interface FinishedGoodEntry {
  id: string;

  // Identity
  heatNo: string;
  productionDate: Timestamp;
  alloyType: string;

  // Weight data
  grossWeightKg: number;        // totalInputKg from production ledger
  goodOutputKg: number;         // goodIngots from production ledger
  numberOfPieces: number;       // totalPieces from production ledger

  // Costing
  productionCostPerKg: number;  // from cost ledger
  estimatedSellingPrice: number; // productionCostPerKg * 1.06
  efficiencyPercentage?: number; // from production ledger

  // Dispatch tracking
  availableWeightKg: number;
  dispatchedWeightKg: number;
  remainingWeightKg: number;
  dispatchedPieces: number;
  remainingPieces: number;

  status: FinishedGoodStatus;

  // Source references
  productionLedgerId?: string;
  costLedgerId?: string;

  // True only when explicitly approved via the Approval Queue
  manuallyApproved?: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Grouping Helper ─────────────────────────────────────────────────────────
export interface FinishedGoodsGroup {
  alloyType: string;
  entries: FinishedGoodEntry[];
  totalGoodOutputKg: number;
  totalAvailableKg: number;
  totalDispatchedKg: number;
  totalRemainingKg: number;
  inventoryValue: number;
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface FinishedGoodsAnalytics {
  totalAvailableStock: number;
  totalInventoryValue: number;
  totalDispatchedKg: number;
  productionByAlloy: { alloyType: string; kg: number }[];
  statusBreakdown: { status: FinishedGoodStatus; count: number; kg: number }[];
}

// ─── Form Data (for Admin Edit) ───────────────────────────────────────────────
export interface FinishedGoodEditFormData {
  estimatedSellingPrice: number;
  dispatchedWeightKg: number;
  dispatchedPieces: number;
  status: FinishedGoodStatus;
}

// ─── Drass Ledger Entry (Dross Management) ────────────────────────────────────
export type DrassStatus = 'Pending Approval' | 'Available' | 'Dispatched';

export interface DrassEntry {
  id: string;
  drassId: string;
  drassCode: string;
  heatIds: string[];
  heatNumbers: string[];
  grossWeightKg: number;
  remainingWeightKg: number;
  startDate: Timestamp;
  endDate: Timestamp;
  storageDays: number;
  status: DrassStatus;
  approved: boolean;
  remarks: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DrassFormData {
  drassCode: string;
  heatIds: string[];
  heatNumbers: string[];
  grossWeightKg: number;
  remainingWeightKg: number;
  startDate: string; // ISO Date YYYY-MM-DD
  endDate: string; // ISO Date YYYY-MM-DD
  status: DrassStatus;
  approved?: boolean;
  remarks: string;
  createdBy: string;
}
