import { Timestamp } from "firebase/firestore";

export type ReviewStatus = "Pending" | "Reviewed" | "Returned" | "Approved";

export interface ProductionManagerEntry {
  id: string;
  serialNo: number;
  heatNo: string;
  date: Timestamp;
  alloyType: string;
  supervisorName?: string;
  operatorName?: string;
  furnaceNo?: string;
  shiftStartTime?: string;
  shiftStartPeriod?: "AM" | "PM";
  shiftEndTime?: string;
  shiftEndPeriod?: "AM" | "PM";
  materials: { materialId: string; materialCode: string; materialName: string; weightKg: number; efficiencyPercentage: number }[];
  additives?: { name: string; quantity: number; unit?: string }[];
  totalInput: number;
  goodIngots: number;
  totalPieces?: number;
  noOfPieces?: number;
  badIngotsKg?: number;
  efficiencyPercentage: number;
  efficiencyStatus?: string;
  expectedEfficiencyPercentage?: number;
  actualEfficiencyPercentage?: number;
  goodIngotsKg?: number;
  totalInputKg?: number;
  remarks?: string;
  productionStatus?: string;
  // Review fields
  reviewStatus?: ReviewStatus;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  returnReason?: string;
  returnComments?: string;
  returnedBy?: string;
  returnedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
