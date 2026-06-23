import type { Timestamp } from 'firebase/firestore';

export interface UserEntry {
  id: string; // Document ID (corresponds to Firebase Auth UID)
  name: string;
  email: string;
  password?: string; // Plaintext password stored in Firestore for sync & admin reference
  role: string;
  status: 'Active' | 'Inactive';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: string;
  status: 'Active' | 'Inactive';
}
