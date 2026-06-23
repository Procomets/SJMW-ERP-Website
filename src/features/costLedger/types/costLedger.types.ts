import { Timestamp } from 'firebase/firestore';

// ─── Material sub-document (stored per record) ───────────────────────────────
export interface CostMaterialEntry {
  materialId: string;      // e.g. "MAT001"
  materialCode: string;    // e.g. "RTR"
  materialName: string;    // e.g. "Return Scrap"
  weightKg: number;
  ratePerKg: number;       // updated field
  amount: number;          // weightKg * ratePerKg
}

// ─── Firestore document ───────────────────────────────────────────────────────
export interface CostLedgerEntry {
  id: string;
  serialNo: number;
  heatNo: string;
  date: Timestamp;
  alloyType: string;
  employeeName: string;
  role: string;
  notified: boolean;
  materials: CostMaterialEntry[];  // dynamic — no fixed flat fields

  // Calculated totals
  totalInputKg: number;
  goodIngotsKg: number;
  efficiencyPercentage: number;
  totalMaterialCost: number;
  materialCostPerKg: number;         // renamed from totalMaterialCostPerKg
  laborCostPerKg: number;            // added
  productionCostPerKg: number;       // kept (always 0)
  totalProductionCost: number;       // added
  totalProductionCostPerKg: number;  // kept (now totalProductionCost / goodIngots)
  marginPercentage: number;          // renamed from sellingMarginPercentage
  sellingPricePerKg: number;

  // Aliases for legacy/backward compatibility (so Finished Goods / Dispatch and other parts don't break)
  totalMaterialCostPerKg?: number;
  sellingMarginPercentage?: number;

  // Keep these for rendering existing/historical reports if they exist
  totalRevenue?: number;
  totalProfit?: number;
  profitMarginPercentage?: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Form data (used in dialog) ───────────────────────────────────────────────
export interface CostLedgerFormData {
  heatNo: string;
  date: string;           // ISO date string "YYYY-MM-DD"
  alloyType: string;
  employeeName: string;
  role: string;
  notified: boolean;
  goodIngotsKg: number;
  laborCostPerKg: number;       // added (replaces productionCostPerKg in edit mode)
  marginPercentage: number;     // renamed from sellingMarginPercentage
  materials: CostMaterialEntry[];
}

// ─── Calculated totals helper ─────────────────────────────────────────────────
export const calculateTotals = (form: CostLedgerFormData) => {
  const totalInputKg = form.materials.reduce((s, m) => s + (Number(m.weightKg) || 0), 0);
  
  // Support both ratePerKg/amount and costPerKg/totalCost for intermediate form states/compatibility
  const totalMaterialCost = form.materials.reduce((s, m) => {
    const amt = Number(m.amount) || Number((m as any).totalCost) || 0;
    return s + amt;
  }, 0);

  const goodIngotsKg = Number(form.goodIngotsKg) || 0;
  const laborCostPerKg = Number(form.laborCostPerKg) || 0;
  const marginPercentage = Number(form.marginPercentage) || 0;

  const efficiencyPercentage = totalInputKg > 0
    ? parseFloat(((goodIngotsKg / totalInputKg) * 100).toFixed(2))
    : 0;

  const materialCostPerKg = goodIngotsKg > 0
    ? parseFloat((totalMaterialCost / goodIngotsKg).toFixed(4))
    : 0;

  // Formula: totalProductionCost = totalMaterialCost + (totalInputKg * laborCostPerKg)
  const totalProductionCost = totalMaterialCost + (totalInputKg * laborCostPerKg);

  // Formula: totalProductionCostPerKg = totalProductionCost / goodIngotsKg
  const totalProductionCostPerKg = goodIngotsKg > 0
    ? parseFloat((totalProductionCost / goodIngotsKg).toFixed(4))
    : 0;

  // Formula: sellingPricePerKg = totalProductionCostPerKg + (totalProductionCostPerKg * marginPercentage / 100)
  const sellingPricePerKg = parseFloat((totalProductionCostPerKg + (marginPercentage / 100 * totalProductionCostPerKg)).toFixed(4));

  // Also include historical compatible fields so they are computed if UI tries to read them
  const totalRevenue = goodIngotsKg * sellingPricePerKg;
  const totalProfit = totalRevenue - totalProductionCost;
  const profitMarginPercentage = totalRevenue > 0
    ? parseFloat(((totalProfit / totalRevenue) * 100).toFixed(2))
    : 0;

  return {
    totalInputKg,
    totalMaterialCost,
    efficiencyPercentage,
    materialCostPerKg,
    laborCostPerKg,
    productionCostPerKg: 0,
    totalProductionCost,
    totalProductionCostPerKg,
    marginPercentage,
    sellingPricePerKg,
    totalRevenue,
    totalProfit,
    profitMarginPercentage,
  };
};

// ─── Build empty form pre-populated with active cost-ledger materials ─────────
export const buildEmptyCostForm = (
  activeMaterials: { id: string; materialCode: string; materialName: string }[]
): CostLedgerFormData => ({
  heatNo: '',
  date: new Date().toISOString().split('T')[0],
  alloyType: '',
  employeeName: '',
  role: '',
  notified: false,
  goodIngotsKg: 0,
  laborCostPerKg: 0,
  marginPercentage: 6,
  materials: activeMaterials.map((m) => ({
    materialId: m.id,
    materialCode: m.materialCode,
    materialName: m.materialName,
    weightKg: 0,
    ratePerKg: 0,
    amount: 0,
  })),
});
