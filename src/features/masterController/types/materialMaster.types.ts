import { Timestamp } from 'firebase/firestore';

export interface MaterialMaster {
  id: string;
  materialId: string;        // e.g. "MAT001"
  materialCode: string;      // e.g. "RTR"
  materialName: string;      // e.g. "Return Scrap"
  efficiencyPercentage: number;
  minimumStockKg: number;
  unit: string;              // e.g. "Kg"
  status: 'Active' | 'Disabled';
  showInWarehouse: boolean;
  showInProduction: boolean;
  showInCostLedger: boolean;
  showInReports: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type MaterialMasterFormData = Omit<MaterialMaster, 'id' | 'createdAt' | 'updatedAt'>;

export const getEmptyMaterialForm = (): MaterialMasterFormData => ({
  materialId: '',
  materialCode: '',
  materialName: '',
  efficiencyPercentage: 90,
  minimumStockKg: 1000,
  unit: 'Kg',
  status: 'Active',
  showInWarehouse: true,
  showInProduction: true,
  showInCostLedger: true,
  showInReports: true,
});
