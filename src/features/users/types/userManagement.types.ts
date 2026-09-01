import type { Timestamp } from 'firebase/firestore';

export interface UserEntry {
  id: string; // Document ID (corresponds to Firebase Auth UID)
  name: string;
  email: string;
  /** SHA-256 hash of password for reference — plaintext is NEVER stored */
  passwordHash?: string;
  /** @deprecated Legacy plaintext field — may exist in old records, never used */
  password?: string;
  role: string;
  status: 'Active' | 'Inactive';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface UserFormData {
  name: string;
  email: string;
  /** Plaintext — collected in UI only, hashed before storage, never persisted as-is */
  password?: string;
  role: string;
  status: 'Active' | 'Inactive';
}
