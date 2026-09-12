export interface ProductionWageEntry {
  id?: string;
  date: string;
  alloy: string;
  qtyInKg: number | null;
  heatNo: string;
  amount: number | null;
  isCustom?: boolean;
}

export interface ProductionWageSummary {
  advance: number | null;
  transferred: number | null;
  cashPaid: number | null;
  totalLeft: number | null; // left side total
  recovered: number | null;
  balance: number | null;
  maintenance: number | null;
  grossPayable: number | null;
  advancePaid: number | null;
  paid: number | null;
  netPayable: number | null;
}

export interface ProductionWageData {
  entries: ProductionWageEntry[];
  summary: ProductionWageSummary;
  maintenanceDetails?: { date: string; persons: number; costPerDay: number }[];
}

export interface SavedProductionWageDoc {
  id?: string;
  startDate: any; // Timestamp in DB, string when serialized
  endDate: any;
  furnaces: string[];
  rate: number;
  data: ProductionWageData;
  createdAt: any;
  createdBy: string;
  isLocked?: boolean;
  lockedBy?: string;
}

