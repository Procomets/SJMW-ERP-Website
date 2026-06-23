import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuR9U5V-2lGGNACuvZYDMdVR9A3Ne09BU",
  authDomain: "moms-b63df.firebaseapp.com",
  projectId: "moms-b63df",
  storageBucket: "moms-b63df.firebasestorage.app",
  messagingSenderId: "651089619335",
  appId: "1:651089619335:web:757641aa55409751cfcb22",
  measurementId: "G-K9W8E0PRV1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
