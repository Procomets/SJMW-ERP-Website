import { collection, query, where, getDocs, Timestamp, addDoc, serverTimestamp, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import type { ProductionWageData, SavedProductionWageDoc } from '../types/productionWages';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const getProductionWages = async (
  startDate: Date,
  endDate: Date,
  furnaces: string[]
): Promise<ProductionWageData> => {
  const startOfDay = new Date(startDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  const startTs = Timestamp.fromDate(startOfDay);
  const endTs = Timestamp.fromDate(endOfDay);

  const q = query(
    collection(db, 'productionLedger'),
    where('date', '>=', startTs),
    where('date', '<=', endTs)
  );

  const snap = await getDocs(q);
  
  const entries = snap.docs
    .map(doc => ({ id: doc.id, data: doc.data() }))
    .filter(item => {
      if (furnaces.length === 0) return true; // If none selected, maybe return all or none? Let's return none if empty.
      if (furnaces.includes('ALL')) return true;
      const furnace = item.data.furnaceNo?.trim().toUpperCase() || 'UNSPECIFIED';
      return furnaces.includes(furnace);
    })
    .sort((a, b) => {
      const dateA = a.data.date?.toMillis ? a.data.date.toMillis() : 0;
      const dateB = b.data.date?.toMillis ? b.data.date.toMillis() : 0;
      return dateA - dateB;
    })
    .map(item => {
      const data = item.data;
      const qtyInKg = data.goodIngotsKg !== undefined ? Number(data.goodIngotsKg) : (data.goodIngots !== undefined ? Number(data.goodIngots) : 0);
      
      let dateStr = '';
      if (data.date && typeof data.date.toDate === 'function') {
        dateStr = format(data.date.toDate(), 'dd-MM-yyyy');
      }
      
      return {
        id: item.id,
        date: dateStr,
        alloy: data.alloyType || '',
        qtyInKg: qtyInKg,
        heatNo: data.heatNo || '',
        amount: 0
      };
    });

  return {
    entries,
    summary: {
      advance: null,
      transferred: 0,
      cashPaid: null,
      totalLeft: 0,
      recovered: 0,
      balance: 0,
      maintenance: null,
      grossPayable: 0,
      advancePaid: null,
      paid: 0,
      netPayable: 0,
    }
  };
};

export const getAvailableFurnaces = async (
  startDate: Date,
  endDate: Date
): Promise<string[]> => {
  const startOfDay = new Date(startDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  const startTs = Timestamp.fromDate(startOfDay);
  const endTs = Timestamp.fromDate(endOfDay);

  const q = query(
    collection(db, 'productionLedger'),
    where('date', '>=', startTs),
    where('date', '<=', endTs)
  );

  const snap = await getDocs(q);
  
  const furnaceSet = new Set<string>();
  snap.docs.forEach(doc => {
    const data = doc.data();
    const furnace = data.furnaceNo?.trim().toUpperCase() || 'UNSPECIFIED';
    furnaceSet.add(furnace);
  });

  return Array.from(furnaceSet).sort();
};

export const getSavedProductionWages = async (
  startDate: Date,
  endDate: Date,
  furnaces: string[]
): Promise<SavedProductionWageDoc | null> => {
  const startOfDay = new Date(startDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  const startTs = Timestamp.fromDate(startOfDay);
  const endTs = Timestamp.fromDate(endOfDay);
  const furnacesStr = furnaces.slice().sort().join(',');

  const q = query(
    collection(db, 'productionWages'),
    where('startDate', '==', startTs),
    where('endDate', '==', endTs)
  );

  const snap = await getDocs(q);
  const match = snap.docs.find(doc => {
    const f = doc.data().furnaces || [];
    return f.slice().sort().join(',') === furnacesStr;
  });

  if (match) {
    return { id: match.id, ...match.data() } as SavedProductionWageDoc;
  }
  return null;
};

export const saveProductionWages = async (
  startDate: Date,
  endDate: Date,
  furnaces: string[],
  rate: number,
  data: ProductionWageData,
  userEmail: string
): Promise<string> => {
  const startOfDay = new Date(startDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Check if existing first
  const existing = await getSavedProductionWages(startDate, endDate, furnaces);
  if (existing && existing.id) {
    throw new Error('An entry already exists for this date range and furnaces.');
  }

  const docData = {
    startDate: Timestamp.fromDate(startOfDay),
    endDate: Timestamp.fromDate(endOfDay),
    furnaces,
    rate,
    data,
    createdAt: serverTimestamp(),
    createdBy: userEmail
  };

  const docRef = await addDoc(collection(db, 'productionWages'), docData);
  return docRef.id;
};

export const getProductionWagesHistory = async (): Promise<SavedProductionWageDoc[]> => {
  const q = query(
    collection(db, 'productionWages'),
    orderBy('startDate', 'desc')
  );

  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedProductionWageDoc));
};

export const updateProductionWages = async (
  id: string,
  rate: number,
  data: ProductionWageData,
  userEmail: string
): Promise<void> => {
  const docRef = doc(db, 'productionWages', id);
  await updateDoc(docRef, {
    rate,
    data,
    updatedAt: serverTimestamp(),
    updatedBy: userEmail
  });
};

export const toggleLockProductionWages = async (
  id: string,
  isLocked: boolean,
  userEmail: string
): Promise<void> => {
  const docRef = doc(db, 'productionWages', id);
  await updateDoc(docRef, {
    isLocked,
    lockedBy: isLocked ? userEmail : null,
    lockedAt: isLocked ? serverTimestamp() : null
  });
};


