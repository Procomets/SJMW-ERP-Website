import { collection, doc, getDocs, setDoc, query, where, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import type { AttendanceRecord, AttendanceSettings, AttendanceStatus } from '../types/attendance';

const ATTENDANCE_COLLECTION = 'attendance';
const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'attendance_settings';

export const getAttendanceForMonth = async (monthYear: string): Promise<AttendanceRecord[]> => {
  const q = query(
    collection(db, ATTENDANCE_COLLECTION),
    where('monthYear', '==', monthYear)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AttendanceRecord[];
};

export const getYearlyAttendanceForEmployee = async (employeeId: string, year: string): Promise<AttendanceRecord[]> => {
  // Query all attendance for this employee, filter year client-side to avoid complex indexes
  const q = query(
    collection(db, ATTENDANCE_COLLECTION),
    where('employeeId', '==', employeeId)
  );
  const querySnapshot = await getDocs(q);
  const records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AttendanceRecord[];
  
  return records.filter(record => record.date.startsWith(year));
};

export const markAttendance = async (
  employeeId: string,
  date: string,
  monthYear: string,
  status: AttendanceStatus | null,
  markedBy: string
): Promise<void> => {
  const docId = `${employeeId}_${date}`;
  const docRef = doc(db, ATTENDANCE_COLLECTION, docId);

  if (status === null) {
    // Clear attendance
    await deleteDoc(docRef);
    return;
  }

  const record: Omit<AttendanceRecord, 'id'> = {
    employeeId,
    date,
    monthYear,
    status,
    markedBy,
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, record);
};

export const getAttendanceSettings = async (): Promise<AttendanceSettings> => {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as AttendanceSettings;
  }
  return { isBlocked: false };
};

export const updateAttendanceSettings = async (isBlocked: boolean, accessStartTime?: string, accessEndTime?: string): Promise<void> => {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  await setDoc(docRef, { 
    isBlocked, 
    ...(accessStartTime !== undefined && { accessStartTime }),
    ...(accessEndTime !== undefined && { accessEndTime }),
    updatedAt: serverTimestamp() 
  }, { merge: true });
};
