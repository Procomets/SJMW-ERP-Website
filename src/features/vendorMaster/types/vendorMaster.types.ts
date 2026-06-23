import { Timestamp } from 'firebase/firestore';

export type VendorCategory = 'Supplier' | 'Customer' | 'Both';

export type VendorType =
  | 'Proprietorship'
  | 'Partnership'
  | 'LLP'
  | 'Private Limited'
  | 'Public Limited'
  | 'Government'
  | 'Other';

export type VendorStatus = 'Active' | 'Inactive' | 'Blocked';

export interface CompanyAddress {
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  state: string;
  stateCode: string;
  country: string;
  pinCode: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
}

export interface VendorMaster {
  id: string;
  vendorCode: string;
  vendorName: string;
  vendorCategory: VendorCategory;
  vendorType: VendorType;
  companyAddress: CompanyAddress;
  gstRegistered: boolean;
  gstNumber?: string;
  panNumber?: string;
  tanNumber?: string;
  msmeNumber?: string;
  aadhaarNumber?: string;
  contactPersonName?: string;
  contactNumber?: string;
  alternateContactNumber?: string;
  email?: string;
  website?: string;
  bankDetails?: BankDetails;
  status: VendorStatus;
  createdBy: string;
  createdAt: Timestamp;
  updatedBy: string;
  updatedAt: Timestamp;
}

export interface VendorMasterFormData {
  vendorName: string;
  vendorCategory: VendorCategory;
  vendorType: VendorType;
  companyAddress: CompanyAddress;
  gstRegistered: boolean;
  gstNumber: string;
  panNumber: string;
  tanNumber: string;
  msmeNumber: string;
  aadhaarNumber: string;
  contactPersonName: string;
  contactNumber: string;
  alternateContactNumber: string;
  email: string;
  website: string;
  bankDetails: BankDetails;
  status: VendorStatus;
}

export const getEmptyVendorForm = (): VendorMasterFormData => ({
  vendorName: '',
  vendorCategory: 'Supplier',
  vendorType: 'Private Limited',
  companyAddress: {
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    state: '',
    stateCode: '',
    country: 'India',
    pinCode: '',
  },
  gstRegistered: false,
  gstNumber: '',
  panNumber: '',
  tanNumber: '',
  msmeNumber: '',
  aadhaarNumber: '',
  contactPersonName: '',
  contactNumber: '',
  alternateContactNumber: '',
  email: '',
  website: '',
  bankDetails: {
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
  },
  status: 'Active',
});

export const VENDOR_CATEGORIES: VendorCategory[] = ['Supplier', 'Customer', 'Both'];

export const VENDOR_TYPES: VendorType[] = [
  'Proprietorship',
  'Partnership',
  'LLP',
  'Private Limited',
  'Public Limited',
  'Government',
  'Other',
];

export const VENDOR_STATUSES: VendorStatus[] = ['Active', 'Inactive', 'Blocked'];

export const INDIA_STATES = [
  { name: 'Andhra Pradesh', code: '28' },
  { name: 'Arunachal Pradesh', code: '12' },
  { name: 'Assam', code: '18' },
  { name: 'Bihar', code: '10' },
  { name: 'Chhattisgarh', code: '22' },
  { name: 'Goa', code: '30' },
  { name: 'Gujarat', code: '24' },
  { name: 'Haryana', code: '06' },
  { name: 'Himachal Pradesh', code: '02' },
  { name: 'Jharkhand', code: '20' },
  { name: 'Karnataka', code: '29' },
  { name: 'Kerala', code: '32' },
  { name: 'Madhya Pradesh', code: '23' },
  { name: 'Maharashtra', code: '27' },
  { name: 'Manipur', code: '14' },
  { name: 'Meghalaya', code: '17' },
  { name: 'Mizoram', code: '15' },
  { name: 'Nagaland', code: '13' },
  { name: 'Odisha', code: '21' },
  { name: 'Punjab', code: '03' },
  { name: 'Rajasthan', code: '08' },
  { name: 'Sikkim', code: '11' },
  { name: 'Tamil Nadu', code: '33' },
  { name: 'Telangana', code: '36' },
  { name: 'Tripura', code: '16' },
  { name: 'Uttar Pradesh', code: '09' },
  { name: 'Uttarakhand', code: '05' },
  { name: 'West Bengal', code: '19' },
  { name: 'Andaman & Nicobar Islands', code: '35' },
  { name: 'Chandigarh', code: '04' },
  { name: 'Dadra & Nagar Haveli and Daman & Diu', code: '26' },
  { name: 'Delhi', code: '07' },
  { name: 'Jammu & Kashmir', code: '01' },
  { name: 'Ladakh', code: '38' },
  { name: 'Lakshadweep', code: '31' },
  { name: 'Puducherry', code: '34' },
];
