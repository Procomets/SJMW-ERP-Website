import { doc, onSnapshot, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const SETTINGS_DOC = doc(db, 'settings', 'global');

export const subscribeToLockStatus = (onUpdate: (locked: boolean) => void) => {
  return onSnapshot(SETTINGS_DOC, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data().locked !== false); // default to true if undefined
    } else {
      // Initialize if it doesn't exist
      setDoc(SETTINGS_DOC, { locked: true, lockpassword: 'admin' }).then(() => {
        onUpdate(true);
      });
    }
  });
};

export const verifyLockPassword = async (password: string): Promise<boolean> => {
  const docSnap = await getDoc(SETTINGS_DOC);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return data.lockpassword === password;
  }
  // Initialize if it doesn't exist
  await setDoc(SETTINGS_DOC, { locked: true, lockpassword: 'admin' });
  return password === 'admin';
};

export const toggleLockStatus = async (currentLockedState: boolean): Promise<void> => {
  await updateDoc(SETTINGS_DOC, {
    locked: !currentLockedState,
  });
};
