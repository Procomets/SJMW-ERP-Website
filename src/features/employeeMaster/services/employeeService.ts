import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import type { Employee, EmploymentStatus } from '../types/employee';

const COLLECTION_NAME = 'employees';

export const getEmployees = async (): Promise<Employee[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('employeeId', 'asc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Employee[];
};

export const generateNextEmployeeId = async (): Promise<string> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('employeeId', 'desc'), limit(1));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return 'EMP0001';
  }
  
  const lastEmployee = querySnapshot.docs[0].data() as Employee;
  const lastId = lastEmployee.employeeId; 
  
  if (!lastId || !lastId.startsWith('EMP')) {
    return 'EMP0001'; 
  }
  
  const numPart = parseInt(lastId.substring(3), 10);
  if (isNaN(numPart)) return 'EMP0001';

  const nextNum = numPart + 1;
  return `EMP${nextNum.toString().padStart(4, '0')}`;
};

export const addEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'employeeId' | 'employeeCode'>, userEmail: string): Promise<Employee> => {
  const nextId = await generateNextEmployeeId();
  const numPart = parseInt(nextId.substring(3), 10);
  const nextCode = `SJMW-${numPart.toString().padStart(3, '0')}`;
  
  const docRef = doc(collection(db, COLLECTION_NAME));
  
  const newEmployee: Omit<Employee, 'id'> = {
    ...employeeData,
    employeeId: nextId,
    employeeCode: nextCode,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
    createdBy: userEmail
  };
  
  await setDoc(docRef, newEmployee);
  
  return {
    id: docRef.id,
    ...newEmployee
  };
};

export const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const updateEmployeeStatus = async (id: string, status: EmploymentStatus): Promise<void> => {
  await updateEmployee(id, { employmentStatus: status });
};

export const deleteEmployee = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
