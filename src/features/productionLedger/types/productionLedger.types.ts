import { Timestamp } from 'firebase/firestore';

// ─── Material sub-document (stored per record) ───────────────────────────────
export interface ProductionMaterialEntry {
  materialId: string;          // e.g. "MAT001"
  materialCode: string;        // e.g. "RTR"
  materialName: string;        // e.g. "Return Scrap"
  weightKg: number;
  efficiencyPercentage: number; // from materialMaster at time of entry
}

// ─── Firestore document ───────────────────────────────────────────────────────
export interface ProductionLedgerEntry {
  id: string;
  serialNo: number;
  heatNo: string;
  date: Timestamp;
  alloyType: string;
  supervisorName?: string;
  employeeName?: string;
  role?: string;
  materials: ProductionMaterialEntry[];  // dynamic — no fixed fields
  totalInput: number;
  goodIngots: number;
  totalPieces?: number;
  noOfPieces?: number;
  efficiencyStatus?: string;
  efficiencyPercentage: number;
  remarks?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // New fields
  furnaceNo?: string;
  operatorName?: string;
  shiftStartTime?: string;
  shiftStartPeriod?: 'AM' | 'PM';
  shiftEndTime?: string;
  shiftEndPeriod?: 'AM' | 'PM';
  expectedEfficiencyPercentage?: number;
  actualEfficiencyPercentage?: number;
  totalInputKg?: number;
  goodIngotsKg?: number;
  notified?: boolean;
}

// ─── Form data (used in dialog) ───────────────────────────────────────────────
export interface ProductionLedgerFormData {
  heatNo: string;
  date: string;           // ISO date string "YYYY-MM-DD"
  alloyType: string;
  supervisorName: string;
  goodIngots: number;
  totalPieces: number;
  noOfPieces: number;
  efficiencyStatus: string;
  remarks: string;
  materials: ProductionMaterialEntry[];

  // New fields
  furnaceNo: string;
  operatorName: string;
  shiftStartTime: string;
  shiftStartPeriod: 'AM' | 'PM';
  shiftEndTime: string;
  shiftEndPeriod: 'AM' | 'PM';
  expectedEfficiencyPercentage: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const calcTotalInput = (materials: ProductionMaterialEntry[]): number =>
  materials.reduce((sum, m) => sum + (Number(m.weightKg) || 0), 0);

export const calcEfficiency = (goodIngots: number, totalInput: number): number =>
  totalInput > 0 ? parseFloat(((goodIngots / totalInput) * 100).toFixed(2)) : 0;

// Build an empty form pre-populated with active materials from Master
export const buildEmptyForm = (
  activeMaterials: { id: string; materialCode: string; materialName: string; efficiencyPercentage: number }[]
): ProductionLedgerFormData => ({
  heatNo: '',
  date: new Date().toISOString().split('T')[0],
  alloyType: '',
  supervisorName: '',
  goodIngots: 0,
  totalPieces: 0,
  noOfPieces: 0,
  efficiencyStatus: '',
  remarks: '',
  furnaceNo: '',
  operatorName: '',
  shiftStartTime: '',
  shiftStartPeriod: 'AM',
  shiftEndTime: '',
  shiftEndPeriod: 'AM',
  expectedEfficiencyPercentage: 90,
  materials: activeMaterials.map((m) => ({
    materialId: m.id,
    materialCode: m.materialCode,
    materialName: m.materialName,
    weightKg: 0,
    efficiencyPercentage: m.efficiencyPercentage,
  })),
});

