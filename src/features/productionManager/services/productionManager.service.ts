import {
  collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";
import type { ProductionManagerEntry } from "../types/productionManager.types";

const COL = "productionLedger";

export const subscribeToProductionLedger = (
  callback: (entries: ProductionManagerEntry[]) => void
) => {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map((d) => ({
      id: d.id,
      reviewStatus: "Pending",
      ...d.data(),
    } as ProductionManagerEntry));
    callback(entries);
  });
};

export const approveReview = async (id: string, reviewerName: string): Promise<void> => {
  await updateDoc(doc(db, COL, id), {
    reviewStatus: "Reviewed",
    reviewedBy: reviewerName,
    reviewedAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp(),
  });
};

export const returnToSupervisor = async (
  id: string,
  reason: string,
  comments: string,
  reviewerName: string
): Promise<void> => {
  await updateDoc(doc(db, COL, id), {
    reviewStatus: "Returned",
    returnReason: reason,
    returnComments: comments,
    returnedBy: reviewerName,
    returnedAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp(),
  });
};
