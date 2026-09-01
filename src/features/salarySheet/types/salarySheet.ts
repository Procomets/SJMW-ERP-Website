import { Timestamp } from 'firebase/firestore';

export interface SalaryRecord {
  id?: string;
  employeeId: string;
  monthYear: string; // YYYY-MM
  period?: 'monthly' | 'first15' | 'next15'; // Default to monthly if undefined
  
  // User Editable Fields
  asOnDateSalary?: number; // For "As on 31-3-26" column
  hike?: number;
  pf?: number;
  esi?: number;
  salaryAdvance?: number;
  lop?: number;
  remark?: string;

  // New fields for 15 Days Salary Sheet
  previousHolding?: number;
  holdingAmount?: number;
  commissionRate?: number;
  commissionAmount?: number;

  // Metadata
  updatedAt: Timestamp;
  updatedBy: string;
}
