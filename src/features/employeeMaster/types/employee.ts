import { Timestamp } from 'firebase/firestore';

export type EmployeeType = 'Monthly Salary' | 'Labour';
export type EmploymentStatus = 'Active' | 'Inactive';
export type Gender = 'Male' | 'Female' | 'Other';

export interface Employee {
  id?: string; // Firestore document ID
  employeeId: string; // EMP0001
  employeeCode: string; // SJMW-001
  
  employeeType: EmployeeType;
  employmentStatus: EmploymentStatus;
  
  // Personal Info
  fullName: string;
  gender: Gender;
  dateOfBirth?: Timestamp | null;
  mobileNumber: string;
  alternateMobile?: string;
  email?: string;
  
  // Address
  address?: string;
  state?: string;
  pincode?: string;
  
  // Identification
  aadharNumber?: string;
  panNumber?: string; // Monthly Salary only
  bloodGroup?: string;
  
  // Documents & Photos
  personPhotoUrl?: string;
  aadharPhotoUrl?: string;
  
  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  
  // Employment Info (Monthly Salary mostly)
  department?: string;
  designation?: string;
  dateOfJoining?: string;
  reportingManager?: string;
  workLocation?: string;
  shift?: string;
  
  // Bank Details
  accountNumber?: string;
  ifscCode?: string;
  bankBranch?: string;
  
  // Compensation
  monthlyIncome?: number;
  dailyWages?: number;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
