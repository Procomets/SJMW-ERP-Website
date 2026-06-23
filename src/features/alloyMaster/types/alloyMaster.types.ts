import { Timestamp } from 'firebase/firestore';

export type AlloyStatus = 'Active' | 'Inactive';

export const ALLOY_STATUSES: AlloyStatus[] = ['Active', 'Inactive'];

export const ALLOY_CATEGORIES = [
  'Aluminium Alloy',
  'Zinc Alloy',
  'Magnesium Alloy',
  'Copper Alloy',
  'Lead Alloy',
  'Tin Alloy',
  'Other',
] as const;

export type AlloyCategory = (typeof ALLOY_CATEGORIES)[number];

export interface ChemicalElement {
  element: string;
  min: number;
  max: number;
  unit: string;
}

export interface DisplayColors {
  primaryColor: string;
  secondaryColor: string;
}

export interface AlloyMaster {
  id: string;
  alloyId?: string;
  alloyCode: string;
  alloyName: string;
  alloyCategory: AlloyCategory;
  description: string;
  defaultSellingMarginPercentage: number;
  displayColors: DisplayColors;
  /** @deprecated use displayColors.primaryColor */
  displayColor?: string;
  /** @deprecated use displayColors.secondaryColor */
  secondaryColor?: string;
  chemicalComposition: ChemicalElement[];
  keyProperties: string;
  bisCompliant: boolean;
  isoCompliant: boolean;
  status: AlloyStatus;
  createdBy: string;
  createdAt: Timestamp;
  updatedBy: string;
  updatedAt: Timestamp;
}

export interface AlloyMasterFormData {
  alloyCode: string;
  alloyName: string;
  alloyCategory: AlloyCategory;
  description: string;
  defaultSellingMarginPercentage: number;
  displayColors: DisplayColors;
  chemicalComposition: ChemicalElement[];
  keyProperties: string;
  bisCompliant: boolean;
  isoCompliant: boolean;
  status: AlloyStatus;
}

// ─── Default Chemical Elements Template ───────────────────────────────────────
export const DEFAULT_ELEMENTS: ChemicalElement[] = [
  { element: 'Fe', min: 0, max: 0, unit: '%' },
  { element: 'Si', min: 0, max: 0, unit: '%' },
  { element: 'Mn', min: 0, max: 0, unit: '%' },
  { element: 'Ni', min: 0, max: 0, unit: '%' },
  { element: 'Ti', min: 0, max: 0, unit: '%' },
  { element: 'Cu', min: 0, max: 0, unit: '%' },
  { element: 'Mg', min: 0, max: 0, unit: '%' },
  { element: 'Zn', min: 0, max: 0, unit: '%' },
];

export const getEmptyAlloyForm = (): AlloyMasterFormData => ({
  alloyCode: '',
  alloyName: '',
  alloyCategory: 'Aluminium Alloy',
  description: '',
  defaultSellingMarginPercentage: 6,
  displayColors: { primaryColor: '#1565C0', secondaryColor: '#E3F2FD' },
  chemicalComposition: DEFAULT_ELEMENTS.map((e) => ({ ...e })),
  keyProperties: '',
  bisCompliant: true,
  isoCompliant: false,
  status: 'Active',
});

// ─── Alloy Template Library ───────────────────────────────────────────────────
export interface AlloyTemplate {
  alloyCode: string;
  alloyName: string;
  alloyCategory: AlloyCategory;
  displayColors: DisplayColors;
  chemicalComposition: ChemicalElement[];
  keyProperties: string;
  bisCompliant: boolean;
  isoCompliant: boolean;
}

export const ALLOY_TEMPLATES: AlloyTemplate[] = [
  {
    alloyCode: 'ALSI12FE',
    alloyName: 'AlSi12(Fe)',
    alloyCategory: 'Aluminium Alloy',
    displayColors: { primaryColor: '#4A4A4A', secondaryColor: '#D9D9D9' },
    chemicalComposition: [
      { element: 'Fe', min: 0, max: 1.00, unit: '%' },
      { element: 'Si', min: 10.5, max: 13.5, unit: '%' },
      { element: 'Mn', min: 0, max: 0.55, unit: '%' },
      { element: 'Ni', min: 0, max: 0.10, unit: '%' },
      { element: 'Ti', min: 0, max: 0.15, unit: '%' },
      { element: 'Cu', min: 0, max: 0.10, unit: '%' },
      { element: 'Mg', min: 0, max: 0,    unit: '%' },
      { element: 'Zn', min: 0, max: 0.15, unit: '%' },
    ],
    keyProperties: 'High silicon content, excellent fluidity for die casting',
    bisCompliant: true,
    isoCompliant: false,
  },
  {
    alloyCode: 'ALSI7MG',
    alloyName: 'AlSi7Mg',
    alloyCategory: 'Aluminium Alloy',
    displayColors: { primaryColor: '#F5F5F5', secondaryColor: '#EAEAEA' },
    chemicalComposition: [
      { element: 'Fe', min: 0,    max: 0.19, unit: '%' },
      { element: 'Si', min: 6.5,  max: 7.5,  unit: '%' },
      { element: 'Mn', min: 0,    max: 0.10, unit: '%' },
      { element: 'Ni', min: 0,    max: 0.03, unit: '%' },
      { element: 'Ti', min: 0.08, max: 0.25, unit: '%' },
      { element: 'Cu', min: 0,    max: 0.05, unit: '%' },
      { element: 'Mg', min: 0.25, max: 0.45, unit: '%' },
      { element: 'Zn', min: 0,    max: 0.07, unit: '%' },
    ],
    keyProperties: 'Good strength and ductility, heat treatable',
    bisCompliant: true,
    isoCompliant: true,
  },
  {
    alloyCode: 'AC4C',
    alloyName: 'AC4C',
    alloyCategory: 'Aluminium Alloy',
    displayColors: { primaryColor: '#FFC107', secondaryColor: '#FFF8E1' },
    chemicalComposition: [
      { element: 'Fe', min: 0,    max: 0.50, unit: '%' },
      { element: 'Si', min: 6.5,  max: 7.5,  unit: '%' },
      { element: 'Mn', min: 0,    max: 0.60, unit: '%' },
      { element: 'Ni', min: 0,    max: 0.05, unit: '%' },
      { element: 'Ti', min: 0,    max: 0.20, unit: '%' },
      { element: 'Cu', min: 0,    max: 0.20, unit: '%' },
      { element: 'Mg', min: 0.20, max: 0.40, unit: '%' },
      { element: 'Zn', min: 0,    max: 0.30, unit: '%' },
    ],
    keyProperties: 'Japanese JIS standard, widely used in automotive',
    bisCompliant: true,
    isoCompliant: true,
  },
  {
    alloyCode: 'LM25',
    alloyName: 'LM25',
    alloyCategory: 'Aluminium Alloy',
    displayColors: { primaryColor: '#1565C0', secondaryColor: '#E3F2FD' },
    chemicalComposition: [
      { element: 'Fe', min: 0,    max: 0.50, unit: '%' },
      { element: 'Si', min: 6.5,  max: 7.5,  unit: '%' },
      { element: 'Mn', min: 0,    max: 0.30, unit: '%' },
      { element: 'Ni', min: 0,    max: 0.10, unit: '%' },
      { element: 'Ti', min: 0,    max: 0.20, unit: '%' },
      { element: 'Cu', min: 0,    max: 0.20, unit: '%' },
      { element: 'Mg', min: 0.20, max: 0.60, unit: '%' },
      { element: 'Zn', min: 0,    max: 0.10, unit: '%' },
    ],
    keyProperties: 'Good corrosion & thermal resistance, heat treatable',
    bisCompliant: true,
    isoCompliant: true,
  },
  {
    alloyCode: 'LM6',
    alloyName: 'LM6',
    alloyCategory: 'Aluminium Alloy',
    displayColors: { primaryColor: '#FDD835', secondaryColor: '#FFFDE7' },
    chemicalComposition: [
      { element: 'Fe', min: 0,    max: 0.60,  unit: '%' },
      { element: 'Si', min: 10.0, max: 13.0,  unit: '%' },
      { element: 'Mn', min: 0,    max: 0.50,  unit: '%' },
      { element: 'Ni', min: 0,    max: 0.10,  unit: '%' },
      { element: 'Ti', min: 0,    max: 0.05,  unit: '%' },
      { element: 'Cu', min: 0,    max: 0.10,  unit: '%' },
      { element: 'Mg', min: 0,    max: 0.10,  unit: '%' },
      { element: 'Zn', min: 0,    max: 0.10,  unit: '%' },
    ],
    keyProperties: 'Excellent fluidity, marine applications',
    bisCompliant: true,
    isoCompliant: true,
  },
  {
    alloyCode: 'LM9',
    alloyName: 'LM9',
    alloyCategory: 'Aluminium Alloy',
    displayColors: { primaryColor: '#8E24AA', secondaryColor: '#F3E5F5' },
    chemicalComposition: [
      { element: 'Fe', min: 0,    max: 0.60, unit: '%' },
      { element: 'Si', min: 10.0, max: 13.0, unit: '%' },
      { element: 'Mn', min: 0.30, max: 0.70, unit: '%' },
      { element: 'Ni', min: 0,    max: 0.10, unit: '%' },
      { element: 'Ti', min: 0,    max: 0.20, unit: '%' },
      { element: 'Cu', min: 0,    max: 0.20, unit: '%' },
      { element: 'Mg', min: 0.20, max: 0.60, unit: '%' },
      { element: 'Zn', min: 0,    max: 0.10, unit: '%' },
    ],
    keyProperties: 'Like LM6, but for low-pressure die casting',
    bisCompliant: true,
    isoCompliant: true,
  },
  {
    alloyCode: 'LM4',
    alloyName: 'LM4',
    alloyCategory: 'Aluminium Alloy',
    displayColors: { primaryColor: '#C62828', secondaryColor: '#FFEBEE' },
    chemicalComposition: [
      { element: 'Fe', min: 0,    max: 0.80, unit: '%' },
      { element: 'Si', min: 4.0,  max: 6.0,  unit: '%' },
      { element: 'Mn', min: 0,    max: 0.60, unit: '%' },
      { element: 'Ni', min: 0,    max: 0.50, unit: '%' },
      { element: 'Ti', min: 0,    max: 0.20, unit: '%' },
      { element: 'Cu', min: 2.00, max: 4.00, unit: '%' },
      { element: 'Mg', min: 0,    max: 0.20, unit: '%' },
      { element: 'Zn', min: 0,    max: 0.50, unit: '%' },
    ],
    keyProperties: 'High copper content, general purpose casting alloy',
    bisCompliant: true,
    isoCompliant: false,
  },
  {
    alloyCode: 'ALSI10MGA',
    alloyName: 'AlSi10Mg-A',
    alloyCategory: 'Aluminium Alloy',
    displayColors: { primaryColor: '#2E7D32', secondaryColor: '#E8F5E9' },
    chemicalComposition: [
      { element: 'Fe', min: 0,    max: 0.55, unit: '%' },
      { element: 'Si', min: 9.0,  max: 11.0, unit: '%' },
      { element: 'Mn', min: 0,    max: 0.45, unit: '%' },
      { element: 'Ni', min: 0,    max: 0.05, unit: '%' },
      { element: 'Ti', min: 0,    max: 0.15, unit: '%' },
      { element: 'Cu', min: 0,    max: 0.05, unit: '%' },
      { element: 'Mg', min: 0.25, max: 0.45, unit: '%' },
      { element: 'Zn', min: 0,    max: 0.10, unit: '%' },
    ],
    keyProperties: 'Very versatile, widely used in pressure die casting',
    bisCompliant: true,
    isoCompliant: true,
  },
  {
    alloyCode: 'ALSI10MGFE',
    alloyName: 'AlSi10Mg-Fe',
    alloyCategory: 'Aluminium Alloy',
    displayColors: { primaryColor: '#424242', secondaryColor: '#EEEEEE' },
    chemicalComposition: [
      { element: 'Fe', min: 0.5,  max: 1.00, unit: '%' },
      { element: 'Si', min: 9.0,  max: 11.4, unit: '%' },
      { element: 'Mn', min: 0,    max: 0.55, unit: '%' },
      { element: 'Ni', min: 0,    max: 0.15, unit: '%' },
      { element: 'Ti', min: 0,    max: 0.20, unit: '%' },
      { element: 'Cu', min: 0,    max: 0.10, unit: '%' },
      { element: 'Mg', min: 0.20, max: 0.45, unit: '%' },
      { element: 'Zn', min: 0,    max: 0.15, unit: '%' },
    ],
    keyProperties: 'Higher Fe tolerance, secondary aluminium applications',
    bisCompliant: true,
    isoCompliant: true,
  },
];
