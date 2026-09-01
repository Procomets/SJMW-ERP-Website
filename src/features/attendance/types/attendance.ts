export type AttendanceStatus = 'Present' | 'Absent' | 'P/N' | 'N';

export interface AttendanceRecord {
  id?: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  monthYear: string; // YYYY-MM
  status: AttendanceStatus;
  markedBy: string;
  updatedAt: any; // Firestore Timestamp
}

export interface AttendanceSettings {
  isBlocked: boolean;
  accessStartTime?: string;
  accessEndTime?: string;
  updatedAt?: any;
}
