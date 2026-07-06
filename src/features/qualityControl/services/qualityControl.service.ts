import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  where,
  addDoc
} from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import type { QualityControlEntry } from '../types/qualityControl.types';

const QC_COL = 'qualityControl';

// ─── Fetch all QC entries ─────────────────────────────────────────────────────
export const fetchQualityControlEntries = async (): Promise<QualityControlEntry[]> => {
  const q = query(collection(db, QC_COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  } as QualityControlEntry));
};

// ─── Update QC Entry ──────────────────────────────────────────────────────────
export const updateQualityControl = async (id: string, updates: Partial<QualityControlEntry>) => {
  const qcRef = doc(db, QC_COL, id);
  await updateDoc(qcRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// ─── Approve QC Entry ─────────────────────────────────────────────────────────
export const approveQualityControl = async (id: string, verifiedBy: string, remarks: string = '') => {
  const qcRef = doc(db, QC_COL, id);
  
  // Fetch QC details for notification
  const qcSnap = await getDoc(qcRef);
  let heatNo = '';
  let alloyType = '';
  let productionLedgerId = '';
  if (qcSnap.exists()) {
    const data = qcSnap.data();
    heatNo = data.heatNo || '';
    alloyType = data.alloyType || '';
    productionLedgerId = data.productionLedgerId || '';
  }

  // Fallback: If productionLedgerId is missing, try to find it by heatNo
  if (!productionLedgerId && heatNo) {
    try {
      const prodQ = query(
        collection(db, 'productionLedger'),
        where('heatNo', '==', heatNo)
      );
      const prodSnap = await getDocs(prodQ);
      if (!prodSnap.empty) {
        productionLedgerId = prodSnap.docs[0].id;
      }
    } catch (e) {
      console.warn("Could not fetch productionLedgerId", e);
    }
  }

  await updateDoc(qcRef, {
    verified: true,
    verifiedBy: verifiedBy,
    verifiedAt: serverTimestamp(),
    verificationRemarks: remarks,
    overallStatus: 'PASS',
    updatedAt: serverTimestamp(),
  });

  if (heatNo) {
    try {
      // 1. Mark qc_entry and qc_verification notifications as read
      const notifQ = query(
        collection(db, 'notifications'), 
        where('heatNo', '==', heatNo),
        where('type', 'in', ['qc_entry', 'qc_verification'])
      );
      const notifSnap = await getDocs(notifQ);
      for (const notifDoc of notifSnap.docs) {
        await updateDoc(doc(db, 'notifications', notifDoc.id), {
          isRead: true
        });
      }

      // 2. Create cost_ledger notification
      await addDoc(collection(db, 'notifications'), {
        alloyType,
        createdAt: serverTimestamp(),
        heatNo,
        isRead: false,
        message: `Cost Ledger Entry Required Heat No: ${heatNo} QC Verified - Please enter cost details.`,
        productionLedgerId,
        referenceId: id,
        targetRole: 'Production Manager',
        type: 'cost_ledger'
      });
    } catch (err) {
      console.error("Failed to process notifications on QC approval:", err);
    }
  }
};

// ─── Delete QC Entry ──────────────────────────────────────────────────────────
export const deleteQualityControlEntry = async (id: string) => {
  await deleteDoc(doc(db, QC_COL, id));
};
