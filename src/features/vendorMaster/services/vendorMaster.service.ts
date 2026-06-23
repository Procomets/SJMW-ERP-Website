import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import type { VendorMaster, VendorMasterFormData } from '../types/vendorMaster.types';

const COL = 'vendorMaster';

// Generate next vendor code
const generateVendorCode = (existingVendors: VendorMaster[]): string => {
  const maxNum = existingVendors.reduce((max, v) => {
    const num = parseInt(v.vendorCode.replace('VEN', ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return `VEN${String(maxNum + 1).padStart(3, '0')}`;
};

// Subscribe to real-time vendor updates
export const subscribeVendors = (
  callback: (vendors: VendorMaster[]) => void
): Unsubscribe => {
  const q = query(collection(db, COL), orderBy('vendorCode', 'asc'));
  return onSnapshot(q, (snap) => {
    const vendors = snap.docs.map((d) => ({ id: d.id, ...d.data() } as VendorMaster));
    callback(vendors);
  });
};

// Fetch all vendors (one-time)
export const fetchVendors = async (): Promise<VendorMaster[]> => {
  const q = query(collection(db, COL), orderBy('vendorCode', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as VendorMaster));
};

// Add a new vendor
export const addVendor = async (
  form: VendorMasterFormData,
  existingVendors: VendorMaster[],
  createdBy: string
): Promise<string> => {
  const now = serverTimestamp() as Timestamp;
  const vendorCode = generateVendorCode(existingVendors);

  const payload: Omit<VendorMaster, 'id'> = {
    vendorCode,
    vendorName: form.vendorName.trim(),
    vendorCategory: form.vendorCategory,
    vendorType: form.vendorType,
    companyAddress: {
      addressLine1: form.companyAddress.addressLine1.trim(),
      addressLine2: form.companyAddress.addressLine2.trim(),
      city: form.companyAddress.city.trim(),
      district: form.companyAddress.district.trim(),
      state: form.companyAddress.state,
      stateCode: form.companyAddress.stateCode,
      country: form.companyAddress.country.trim() || 'India',
      pinCode: form.companyAddress.pinCode.trim(),
    },
    gstRegistered: form.gstRegistered,
    gstNumber: form.gstNumber?.trim() || undefined,
    panNumber: form.panNumber?.trim() || undefined,
    tanNumber: form.tanNumber?.trim() || undefined,
    msmeNumber: form.msmeNumber?.trim() || undefined,
    aadhaarNumber: form.aadhaarNumber?.trim() || undefined,
    contactPersonName: form.contactPersonName?.trim() || undefined,
    contactNumber: form.contactNumber?.trim() || undefined,
    alternateContactNumber: form.alternateContactNumber?.trim() || undefined,
    email: form.email?.trim().toLowerCase() || undefined,
    website: form.website?.trim() || undefined,
    bankDetails: (form.bankDetails?.bankName || form.bankDetails?.accountNumber)
      ? {
          bankName: form.bankDetails.bankName.trim(),
          accountNumber: form.bankDetails.accountNumber.trim(),
          ifscCode: form.bankDetails.ifscCode.trim().toUpperCase(),
          branchName: form.bankDetails.branchName.trim(),
        }
      : undefined,
    status: form.status,
    createdBy,
    createdAt: now,
    updatedBy: createdBy,
    updatedAt: now,
  };

  // Clean up undefined fields
  const cleanPayload = JSON.parse(JSON.stringify(payload));
  const ref = await addDoc(collection(db, COL), cleanPayload);
  return ref.id;
};

// Update an existing vendor
export const updateVendor = async (
  id: string,
  form: VendorMasterFormData,
  updatedBy: string
): Promise<void> => {
  const payload: any = {
    vendorName: form.vendorName.trim(),
    vendorCategory: form.vendorCategory,
    vendorType: form.vendorType,
    companyAddress: {
      addressLine1: form.companyAddress.addressLine1.trim(),
      addressLine2: form.companyAddress.addressLine2.trim(),
      city: form.companyAddress.city.trim(),
      district: form.companyAddress.district.trim(),
      state: form.companyAddress.state,
      stateCode: form.companyAddress.stateCode,
      country: form.companyAddress.country.trim() || 'India',
      pinCode: form.companyAddress.pinCode.trim(),
    },
    gstRegistered: form.gstRegistered,
    gstNumber: form.gstNumber?.trim() || null,
    panNumber: form.panNumber?.trim() || null,
    tanNumber: form.tanNumber?.trim() || null,
    msmeNumber: form.msmeNumber?.trim() || null,
    aadhaarNumber: form.aadhaarNumber?.trim() || null,
    contactPersonName: form.contactPersonName?.trim() || null,
    contactNumber: form.contactNumber?.trim() || null,
    alternateContactNumber: form.alternateContactNumber?.trim() || null,
    email: form.email?.trim().toLowerCase() || null,
    website: form.website?.trim() || null,
    bankDetails: (form.bankDetails?.bankName || form.bankDetails?.accountNumber)
      ? {
          bankName: form.bankDetails.bankName.trim(),
          accountNumber: form.bankDetails.accountNumber.trim(),
          ifscCode: form.bankDetails.ifscCode.trim().toUpperCase(),
          branchName: form.bankDetails.branchName.trim(),
        }
      : null,
    status: form.status,
    updatedBy,
    updatedAt: serverTimestamp(),
  };

  // Remove null values
  Object.keys(payload).forEach((k) => {
    if (payload[k] === null) delete payload[k];
  });

  await updateDoc(doc(db, COL, id), payload);
};

// Toggle vendor status
export const updateVendorStatus = async (
  id: string,
  newStatus: 'Active' | 'Inactive' | 'Blocked',
  updatedBy: string
): Promise<void> => {
  await updateDoc(doc(db, COL, id), {
    status: newStatus,
    updatedBy,
    updatedAt: serverTimestamp(),
  });
};

// Delete vendor (hard delete)
export const deleteVendor = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COL, id));
};
