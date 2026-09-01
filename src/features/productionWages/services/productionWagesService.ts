import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import type { ProductionWageData } from '../types/productionWages';
import { format } from 'date-fns';

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
