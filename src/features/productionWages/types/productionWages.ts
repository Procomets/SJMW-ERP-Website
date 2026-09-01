export interface ProductionWageEntry {
  id?: string;
  date: string;
  alloy: string;
  qtyInKg: number | null;
  heatNo: string;
  amount: number | null;
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
}
