import type { Timestamp } from 'firebase/firestore';

// ─── Material Receipt (from Firebase materialReceipts collection) ─────────────
export interface ReceiptMaterial {
  materialId: string;
  materialCode: string;
  materialName: string;
  receivedWeightKg: number;
  returnedWeightKg: number;
  netIntakeWeightKg: number;
  costPerKg: number;
  efficiencyPercentage: number;
  remarks?: string;
}

export interface MaterialReceipt {
  id: string;
  receiptNumber: string;
  vendorName: string;
  dateReceived: Timestamp;
  materials: ReceiptMaterial[];
  totalReceivedWeightKg: number;
  totalReturnedWeightKg: number;
  totalNetIntakeWeightKg: number;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Inventory Item (from Firebase inventory collection) ──────────────────────
export type StockStatus = 'Healthy' | 'Low Stock' | 'Critical Stock' | 'Out Of Stock';

export interface InventoryItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  currentStockKg: number;
  minimumStockKg: number;
  averageCost: number;
  efficiencyPercentage?: number;
  status: StockStatus;
  lastReceiptDate: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Inventory Overview KPIs ──────────────────────────────────────────────────
export interface InventoryOverview {
  totalStockKg: number;
  lowStockCount: number;
  receivedToday: number;
  totalInventoryValue: number;
  outOfStockCount: number;
  healthyCount: number;
}
