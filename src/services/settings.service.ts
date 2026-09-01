import { doc, onSnapshot, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const SETTINGS_DOC = doc(db, 'settings', 'global');

// ── SHA-256 hash helper ──────────────────────────────────────────────────────
// Lock password is never stored in plaintext. We hash it before storing and
// compare hashes — the real password is only ever known to the admin.
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Default lock password hash — hash of 'admin' (SHA-256)
// To change the default, update this hash value
const DEFAULT_LOCK_PASSWORD = 'admin';

export const subscribeToLockStatus = (onUpdate: (locked: boolean) => void) => {
  return onSnapshot(SETTINGS_DOC, async (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data().locked !== false); // default to true if undefined
    } else {
      // Initialize if it doesn't exist — store hash, not plaintext
      const hash = await hashPassword(DEFAULT_LOCK_PASSWORD);
      setDoc(SETTINGS_DOC, { locked: true, lockPasswordHash: hash }).then(() => {
        onUpdate(true);
      });
    }
  });
};

export const verifyLockPassword = async (password: string): Promise<boolean> => {
  const docSnap = await getDoc(SETTINGS_DOC);
  const inputHash = await hashPassword(password);

  if (docSnap.exists()) {
    const data = docSnap.data();

    // Support hashed comparison (new format)
    if (data.lockPasswordHash) {
      return data.lockPasswordHash === inputHash;
    }

    // Legacy: plaintext field exists — migrate it to hash and then compare
    if (data.lockpassword) {
      const legacyHash = await hashPassword(data.lockpassword);
      // Migrate to hashed storage, removing plaintext
      await updateDoc(SETTINGS_DOC, {
        lockPasswordHash: legacyHash,
        lockpassword: null, // remove legacy plaintext field
      });
      return legacyHash === inputHash;
    }
  }

  // Initialize if it doesn't exist — use default password
  const defaultHash = await hashPassword(DEFAULT_LOCK_PASSWORD);
  await setDoc(SETTINGS_DOC, { locked: true, lockPasswordHash: defaultHash });
  return defaultHash === inputHash;
};

export const toggleLockStatus = async (currentLockedState: boolean): Promise<void> => {
  await updateDoc(SETTINGS_DOC, {
    locked: !currentLockedState,
  });
};
