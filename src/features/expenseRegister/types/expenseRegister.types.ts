import { Timestamp } from 'firebase/firestore';

// ─── Weekly amounts structure ─────────────────────────────────────────────────
export interface WeeklyAmounts {
  week1: number;
  week2: number;
  week3: number;
  week4: number;
}

// ─── Employee entry within Labour Wages ───────────────────────────────────────
export interface LabourEmployee {
  employeeId: string;
  employeeName: string;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
  monthlyTotal: number;
}

// ─── Sub-category entry (for Fuel Expenses) ──────────────────────────────────
export interface ExpenseSubCategory {
  name: string;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
  monthlyTotal: number;
}

// ─── Unified expense category (discriminated by categoryId) ──────────────────
export interface ExpenseCategory {
  categoryId: string;
  categoryName: string;

  // Standard categories (Salary Advance, Petty Cash, Fastag, Misc)
  weeklyAmounts?: WeeklyAmounts;
  monthlyTotal?: number;

  // Food Expenses specific
  formula?: string;
  foodRate?: number;
  weeklyPresent?: WeeklyAmounts; // No. of present labour per week

  // Labour Wages specific
  employees?: LabourEmployee[];

  // Fuel Expenses specific
  subCategories?: ExpenseSubCategory[];
}

// ─── Full Firestore document ─────────────────────────────────────────────────
export interface ExpenseRegisterDoc {
  id?: string; // Firestore doc id (added after fetch)
  year: string; // e.g. "2026"
  month: string; // e.g. "March"
  monthNumber: number; // 1-12
  status: 'Open' | 'Locked';
  editable: boolean;
  lockedBy: string;
  lockedAt: Timestamp | null;
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  expenseCategories: ExpenseCategory[];
  weeklyTotals: WeeklyAmounts;
  grandTotal: number;
}

// ─── Month names in Indian FY order (April → March) ──────────────────────────
export const FY_MONTHS = [
  'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March',
] as const;

// Month number mapping (calendar month number)
export const MONTH_NUMBER_MAP: Record<string, number> = {
  April: 4, May: 5, June: 6, July: 7, August: 8, September: 9,
  October: 10, November: 11, December: 12, January: 1, February: 2, March: 3,
};

// Month abbreviation for doc ID
export const MONTH_ABBREV_MAP: Record<string, string> = {
  April: 'APR', May: 'MAY', June: 'JUN', July: 'JUL', August: 'AUG', September: 'SEP',
  October: 'OCT', November: 'NOV', December: 'DEC', January: 'JAN', February: 'FEB', March: 'MAR',
};

// ─── Build document ID ───────────────────────────────────────────────────────
export const buildDocId = (year: string, month: string): string => {
  // year = "2026", month = "March" → "FY2026_MAR"
  const abbr = MONTH_ABBREV_MAP[month] || month.substring(0, 3).toUpperCase();
  return `FY${year}_${abbr}`;
};

// ─── Generate year options ───────────────────────────────────────────────
export const generateYearOptions = (): string[] => {
  const currentYear = new Date().getFullYear();
  const options: string[] = [];
  for (let i = -2; i <= 2; i++) {
    options.push(`${currentYear + i}`);
  }
  return options;
};

// ─── Default expense categories ──────────────────────────────────────────────
export const buildDefaultCategories = (): ExpenseCategory[] => [
  {
    categoryId: 'EXP001',
    categoryName: 'Salary Advance',
    weeklyAmounts: { week1: 0, week2: 0, week3: 0, week4: 0 },
    monthlyTotal: 0,
  },
  {
    categoryId: 'EXP002',
    categoryName: 'Food Expenses',
    formula: 'PresentEmployees × FoodRate',
    foodRate: 130,
    weeklyPresent: { week1: 0, week2: 0, week3: 0, week4: 0 },
    weeklyAmounts: { week1: 0, week2: 0, week3: 0, week4: 0 },
    monthlyTotal: 0,
  },
  {
    categoryId: 'EXP003',
    categoryName: 'Labour Wages',
    employees: [],
  },
  {
    categoryId: 'EXP004',
    categoryName: 'Fuel Expenses',
    subCategories: [
      { name: 'Genset (Unit 1 & 2)', week1: 0, week2: 0, week3: 0, week4: 0, monthlyTotal: 0 },
      { name: 'Fuel For Vehicles', week1: 0, week2: 0, week3: 0, week4: 0, monthlyTotal: 0 },
    ],
  },
  {
    categoryId: 'EXP005',
    categoryName: 'Petty Cash',
    weeklyAmounts: { week1: 0, week2: 0, week3: 0, week4: 0 },
    monthlyTotal: 0,
  },
  {
    categoryId: 'EXP006',
    categoryName: 'Fastag',
    weeklyAmounts: { week1: 0, week2: 0, week3: 0, week4: 0 },
    monthlyTotal: 0,
  },
  {
    categoryId: 'EXP007',
    categoryName: 'Miscellaneous Expenses',
    weeklyAmounts: { week1: 0, week2: 0, week3: 0, week4: 0 },
    monthlyTotal: 0,
  },
];

// ─── Build a new empty register ──────────────────────────────────────────────
export const buildDefaultExpenseRegister = (
  year: string,
  month: string,
  monthNumber: number,
  createdBy: string,
): Omit<ExpenseRegisterDoc, 'id'> => ({
  year,
  month,
  monthNumber,
  status: 'Open',
  editable: true,
  lockedBy: '',
  lockedAt: null,
  createdBy,
  createdAt: null, // will be set to serverTimestamp() in service
  updatedAt: null,
  expenseCategories: buildDefaultCategories(),
  weeklyTotals: { week1: 0, week2: 0, week3: 0, week4: 0 },
  grandTotal: 0,
});

// ─── Recalculate all totals ──────────────────────────────────────────────────
export const recalcAllTotals = (categories: ExpenseCategory[]): {
  categories: ExpenseCategory[];
  weeklyTotals: WeeklyAmounts;
  grandTotal: number;
} => {
  const weeklyTotals: WeeklyAmounts = { week1: 0, week2: 0, week3: 0, week4: 0 };
  let grandTotal = 0;

  const updatedCategories = categories.map((cat) => {
    const updated = { ...cat };

    if (cat.categoryId === 'EXP002' && cat.foodRate !== undefined) {
      // Food Expenses: calculated from present × rate
      const present = cat.weeklyPresent || { week1: 0, week2: 0, week3: 0, week4: 0 };
      const rate = cat.foodRate;
      const wa: WeeklyAmounts = {
        week1: (present.week1 || 0) * rate,
        week2: (present.week2 || 0) * rate,
        week3: (present.week3 || 0) * rate,
        week4: (present.week4 || 0) * rate,
      };
      updated.weeklyAmounts = wa;
      updated.weeklyPresent = { ...present };
      updated.monthlyTotal = wa.week1 + wa.week2 + wa.week3 + wa.week4;

      weeklyTotals.week1 += wa.week1;
      weeklyTotals.week2 += wa.week2;
      weeklyTotals.week3 += wa.week3;
      weeklyTotals.week4 += wa.week4;
      grandTotal += updated.monthlyTotal;
    } else if (cat.categoryId === 'EXP003' && cat.employees) {
      // Labour Wages: sum up all employees
      let catW1 = 0, catW2 = 0, catW3 = 0, catW4 = 0;
      const updatedEmps = cat.employees.map((emp) => {
        const mt = (emp.week1 || 0) + (emp.week2 || 0) + (emp.week3 || 0) + (emp.week4 || 0);
        catW1 += emp.week1 || 0;
        catW2 += emp.week2 || 0;
        catW3 += emp.week3 || 0;
        catW4 += emp.week4 || 0;
        return { ...emp, monthlyTotal: mt };
      });
      updated.employees = updatedEmps;
      updated.monthlyTotal = catW1 + catW2 + catW3 + catW4;

      weeklyTotals.week1 += catW1;
      weeklyTotals.week2 += catW2;
      weeklyTotals.week3 += catW3;
      weeklyTotals.week4 += catW4;
      grandTotal += updated.monthlyTotal;
    } else if (cat.categoryId === 'EXP004' && cat.subCategories) {
      // Fuel Expenses: sum up sub-categories
      let catW1 = 0, catW2 = 0, catW3 = 0, catW4 = 0;
      const updatedSubs = cat.subCategories.map((sub) => {
        const mt = (sub.week1 || 0) + (sub.week2 || 0) + (sub.week3 || 0) + (sub.week4 || 0);
        catW1 += sub.week1 || 0;
        catW2 += sub.week2 || 0;
        catW3 += sub.week3 || 0;
        catW4 += sub.week4 || 0;
        return { ...sub, monthlyTotal: mt };
      });
      updated.subCategories = updatedSubs;
      updated.monthlyTotal = catW1 + catW2 + catW3 + catW4;

      weeklyTotals.week1 += catW1;
      weeklyTotals.week2 += catW2;
      weeklyTotals.week3 += catW3;
      weeklyTotals.week4 += catW4;
      grandTotal += updated.monthlyTotal;
    } else if (cat.weeklyAmounts) {
      // Standard categories (Salary Advance, Petty Cash, Fastag, Misc)
      const wa = cat.weeklyAmounts;
      updated.monthlyTotal = (wa.week1 || 0) + (wa.week2 || 0) + (wa.week3 || 0) + (wa.week4 || 0);

      weeklyTotals.week1 += wa.week1 || 0;
      weeklyTotals.week2 += wa.week2 || 0;
      weeklyTotals.week3 += wa.week3 || 0;
      weeklyTotals.week4 += wa.week4 || 0;
      grandTotal += updated.monthlyTotal;
    }

    return updated;
  });

  return { categories: updatedCategories, weeklyTotals, grandTotal };
};

// ─── Format currency for display ─────────────────────────────────────────────
export const fmtAmount = (val: number): string => {
  if (!val) return '0';
  return val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};
