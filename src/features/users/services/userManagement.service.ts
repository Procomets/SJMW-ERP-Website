import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
  deleteUser as deleteUserAuth,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import type { UserEntry, UserFormData } from '../types/userManagement.types';

const COL = 'users';

// Firebase configuration for secondary auth instance
const firebaseConfig = {
  apiKey: "AIzaSyAuR9U5V-2lGGNACuvZYDMdVR9A3Ne09BU",
  authDomain: "moms-b63df.firebaseapp.com",
  projectId: "moms-b63df",
  storageBucket: "moms-b63df.firebasestorage.app",
  messagingSenderId: "651089619335",
  appId: "1:651089619335:web:757641aa55409751cfcb22",
  measurementId: "G-K9W8E0PRV1"
};

// Helper to get secondary Auth instance
const getSecondaryAuth = () => {
  const secondaryApp = getApps().find(app => app.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary');
  return getAuth(secondaryApp);
};

// Fetch all users
export const fetchUsers = async (): Promise<UserEntry[]> => {
  const q = query(collection(db, COL), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  } as UserEntry));
};

// Add a new user (Create Auth + Firestore)
export const addUser = async (form: UserFormData): Promise<string> => {
  const secondaryAuth = getSecondaryAuth();

  // 1. Create in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(
    secondaryAuth,
    form.email.trim(),
    form.password || ''
  );
  const uid = userCredential.user.uid;

  // 2. Set profile displayName
  await updateProfile(userCredential.user, { displayName: form.name.trim() });

  // 3. Sign out of secondary auth immediately
  await signOut(secondaryAuth);

  // 4. Create document in Firestore users collection
  const now = serverTimestamp();
  const payload = {
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password || '',
    role: form.role,
    status: form.status,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, COL, uid), payload);
  return uid;
};

// Update an existing user's profile details (Firestore only)
export const updateUserProfile = async (
  uid: string,
  form: Partial<UserFormData>
): Promise<void> => {
  const payload: any = {
    ...form,
    updatedAt: serverTimestamp(),
  };

  // Remove undefined fields
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

  await updateDoc(doc(db, COL, uid), payload);
};

// Change a user's password (Auth + Firestore)
export const updateUserPassword = async (
  uid: string,
  email: string,
  oldPasswordInDb: string,
  newPassword: string,
  currentPasswordOverride?: string
): Promise<void> => {
  const secondaryAuth = getSecondaryAuth();
  const currentPassword = currentPasswordOverride || oldPasswordInDb;

  if (!currentPassword) {
    throw new Error("MISSING_CURRENT_PASSWORD");
  }

  try {
    // 1. Sign in as the user to secondary auth
    const credentials = await signInWithEmailAndPassword(secondaryAuth, email, currentPassword);
    
    // 2. Update password
    await updatePassword(credentials.user, newPassword);
    
    // 3. Sign out
    await signOut(secondaryAuth);
  } catch (authError: any) {
    console.error("Auth password update sync error:", authError);
    throw new Error(
      `AUTH_SYNC_FAILED: ${authError.message}`
    );
  }

  // 4. Update Firestore with new password
  await updateDoc(doc(db, COL, uid), {
    password: newPassword,
    updatedAt: serverTimestamp(),
  });
};

// Send password reset email directly
export const sendResetEmail = async (email: string): Promise<void> => {
  // We use the main auth instance for sending reset emails
  const { sendPasswordResetEmail } = await import('firebase/auth');
  const { auth: mainAuth } = await import('../../../firebase/firebaseConfig');
  await sendPasswordResetEmail(mainAuth, email.trim());
};

// Delete a user (Auth + Firestore)
export const deleteUser = async (
  uid: string,
  email: string,
  passwordInDb: string,
  currentPasswordOverride?: string
): Promise<void> => {
  const secondaryAuth = getSecondaryAuth();
  const currentPassword = currentPasswordOverride || passwordInDb;
  let authDeleted = false;

  if (currentPassword) {
    try {
      // 1. Sign in to secondary auth
      const credentials = await signInWithEmailAndPassword(secondaryAuth, email, currentPassword);
      
      // 2. Delete Auth account
      await deleteUserAuth(credentials.user);
      authDeleted = true;
    } catch (authError: any) {
      console.error("Auth deletion sync error:", authError);
      // Log the error. We will still delete from Firestore so the user is removed from the admin UI.
    }
  }

  // 3. Delete from Firestore users collection
  await deleteDoc(doc(db, COL, uid));

  if (!authDeleted) {
    throw new Error(
      "User was deleted from the database collection, but could not be removed from Firebase Authentication (likely due to missing credentials/session sync). Please delete the auth user manually in the Firebase Console."
    );
  }
};
