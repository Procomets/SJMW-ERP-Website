// ─── Date Preset ─────────────────────────────────────────────────────────────
export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'currentMonth'
  | 'previousMonth'
  | 'currentQuarter'
  | 'currentYear'
  | 'custom';

// ─── Filter State ─────────────────────────────────────────────────────────────
export interface DashboardFilters {
  datePreset: DatePreset;
  customStart: string;   // ISO date string 'YYYY-MM-DD'
  customEnd: string;
  alloyType: string;
  furnaceNo: string;
  shift: string;         // 'morning' | 'afternoon' | 'night' | ''
  supervisor: string;
  customer: string;
  qualityStatus: '' | 'PASS' | 'FAIL';
}

export const DEFAULT_FILTERS: DashboardFilters = {
  datePreset: 'last30',
  customStart: '',
  customEnd: '',
  alloyType: '',
  furnaceNo: '',
  shift: '',
  supervisor: '',
  customer: '',
  qualityStatus: '',
};

// ─── Resolved Date Range (milliseconds) ──────────────────────────────────────
export interface DateRange {
  start: Date;
  end: Date;
}

// ─── Aggregated series point ──────────────────────────────────────────────────
export interface TimeSeriesPoint {
  date: string;   // 'DD MMM' e.g. '01 Jun'
  value: number;
  value2?: number;
  value3?: number; // used in costTrend: soldPricePerKg (actual sold price, admin-set)
}

// ─── Named value (for bar/pie charts) ────────────────────────────────────────
export interface NamedValue {
  name: string;
  value: number;
  value2?: number;
  color?: string;
}

// ─── KPI Card data ────────────────────────────────────────────────────────────
export interface KpiData {
  label: string;
  value: number;
  prevValue: number;
  unit: string;     // 'kg' | 't' | '%' | '₹' | 'hrs' | ''
  format: 'number' | 'currency' | 'percent' | 'weight' | 'hours';
  icon: string;     // icon name key
  color: string;    // accent color hex
}

// ─── All computed dashboard data ──────────────────────────────────────────────
export interface DashboardAnalytics {
  kpis: KpiData[];

  // Production
  dailyProductionTrend: TimeSeriesPoint[];
  inputVsOutput: NamedValue[];
  alloyWiseProduction: NamedValue[];
  productionHoursTrend: TimeSeriesPoint[];

  // Inventory
  rawMaterialStock: NamedValue[];
  materialConsumption: NamedValue[];
  materialShare: NamedValue[];

  // Financial
  costTrend: TimeSeriesPoint[];        // value = productionCostPerKg, value2 = sellingPricePerKg (expected), value3 = soldPricePerKg (actual, admin-set)
  materialCostDistribution: NamedValue[];

  // Dispatch
  dispatchTrend: TimeSeriesPoint[];
  customerWiseDispatch: NamedValue[];
  vehicleUtilization: NamedValue[];

  // Quality
  efficiencyTrend: TimeSeriesPoint[];
  qualityPassFail: NamedValue[];
  shiftPerformance: NamedValue[];
  lossAnalysis: NamedValue[];
}
