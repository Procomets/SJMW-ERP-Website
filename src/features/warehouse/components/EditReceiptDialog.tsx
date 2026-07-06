import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, Grid, Alert,
  IconButton
} from '@mui/material';
import { Edit, Save, X, Plus, Trash2 } from 'lucide-react';
import type { MaterialReceipt, ReceiptMaterial } from '../types/warehouse.types';
import { updateMaterialReceipt, addMaterialReceipt } from '../services/warehouse.service';
import { useMaterials } from '../../../context/MaterialContext';
import { useAuth } from '../../../context/AuthContext';
import { fetchVendors } from '../../vendorMaster/services/vendorMaster.service';
import type { VendorMaster } from '../../vendorMaster/types/vendorMaster.types';

interface EditReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  receipt: MaterialReceipt | null;
  onSave: () => void;
}

const EditReceiptDialog = ({ open, onClose, receipt, onSave }: EditReceiptDialogProps) => {
  const { materials } = useMaterials();
  const { profile } = useAuth();
  const [vendorName, setVendorName] = useState('');
  const [receiptMaterials, setReceiptMaterials] = useState<ReceiptMaterial[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [vendors, setVendors] = useState<VendorMaster[]>([]);

  const isAddMode = !receipt;

  useEffect(() => {
    const loadVendors = async () => {
      try {
        const vList = await fetchVendors();
        // filter where category is Supplier or Both and active
        const filtered = vList.filter(
          v => (v.vendorCategory === 'Supplier' || v.vendorCategory === 'Both') && v.status === 'Active'
        );
        setVendors(filtered);
      } catch (err) {
        console.error("Failed to load vendors:", err);
      }
    };
    if (open) {
      loadVendors();
      if (receipt) {
        setVendorName(receipt.vendorName || '');
        setReceiptMaterials(JSON.parse(JSON.stringify(receipt.materials || [])));
      } else {
        setVendorName('');
        setReceiptMaterials([]);
      }
      setError('');
    }
  }, [receipt, open]);

  const handleMaterialChange = (index: number, field: keyof ReceiptMaterial, value: any) => {
    const updated = [...receiptMaterials];
    (updated[index] as any)[field] = value;
    
    // Auto calculate net intake
    if (field === 'receivedWeightKg' || field === 'returnedWeightKg') {
      const rec = Number(updated[index].receivedWeightKg) || 0;
      const ret = Number(updated[index].returnedWeightKg) || 0;
      updated[index].netIntakeWeightKg = Math.max(0, rec - ret);
    }
    
    setReceiptMaterials(updated);
  };

  const addMaterial = () => {
    setReceiptMaterials([...receiptMaterials, {
      materialId: '',
      materialCode: '',
      materialName: '',
      receivedWeightKg: 0,
      returnedWeightKg: 0,
      netIntakeWeightKg: 0,
      costPerKg: 0,
      efficiencyPercentage: 0
    }]);
  };

  const removeMaterial = (index: number) => {
    setReceiptMaterials(receiptMaterials.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Validate
    if (!vendorName.trim()) {
      setError('Vendor Name is required.');
      return;
    }
    if (receiptMaterials.length === 0) {
      setError('Please add at least one material.');
      return;
    }
    for (const m of receiptMaterials) {
      if (!m.materialCode) {
        setError('Material code cannot be empty.');
        return;
      }
    }

    setSaving(true);
    setError('');
    try {
      const totalReceivedWeightKg = receiptMaterials.reduce((s, m) => s + (Number(m.receivedWeightKg) || 0), 0);
      const totalReturnedWeightKg = receiptMaterials.reduce((s, m) => s + (Number(m.returnedWeightKg) || 0), 0);
      const totalNetIntakeWeightKg = receiptMaterials.reduce((s, m) => s + (Number(m.netIntakeWeightKg) || 0), 0);

      if (isAddMode) {
        await addMaterialReceipt({
          vendorName,
          materials: receiptMaterials,
          totalReceivedWeightKg,
          totalReturnedWeightKg,
          totalNetIntakeWeightKg,
          createdBy: profile?.name || 'Production Manager',
        });
      } else {
        await updateMaterialReceipt(receipt.id, {
          vendorName,
          materials: receiptMaterials,
          totalReceivedWeightKg,
          totalReturnedWeightKg,
          totalNetIntakeWeightKg,
        });
      }
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save receipt.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="font-bold text-lg flex items-center gap-2 text-slate-800">
        <Edit size={20} className="text-blue-600" /> {isAddMode ? 'Add Material Receipt' : `Edit Material Receipt - ${receipt?.receiptNumber}`}
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box className="space-y-6">
          {/* General Details */}
          <Box>
            <Typography className="text-sm font-bold text-slate-700 mb-3 border-b pb-1">Receipt Details</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Vendor Name"
                  fullWidth
                  size="small"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  slotProps={{ select: { native: true } }}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.vendorName}>{v.vendorName}</option>
                  ))}
                  {vendorName && !vendors.some(v => v.vendorName === vendorName) && (
                    <option value={vendorName}>{vendorName}</option>
                  )}
                </TextField>
              </Grid>
            </Grid>
          </Box>

          {/* Materials */}
          <Box>
            <Box className="flex items-center justify-between mb-3 border-b pb-1">
              <Typography className="text-sm font-bold text-slate-700">Received Materials</Typography>
              <Button size="small" startIcon={<Plus size={16} />} onClick={addMaterial}>Add Material</Button>
            </Box>
            <Box className="space-y-3">
              {receiptMaterials.map((mat, index) => (
                <Box key={index} className="p-3 border border-slate-200 rounded-lg bg-slate-50 relative">
                  <IconButton 
                    size="small" 
                    className="absolute top-1 right-1 text-red-500" 
                    onClick={() => removeMaterial(index)}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        select
                        label="Material"
                        fullWidth
                        size="small"
                        value={mat.materialCode}
                        onChange={(e) => {
                          const m = materials.find(x => x.materialCode === e.target.value);
                          handleMaterialChange(index, 'materialCode', e.target.value);
                          if (m) {
                            handleMaterialChange(index, 'materialId', m.id);
                            handleMaterialChange(index, 'materialName', m.materialName);
                            if (!mat.efficiencyPercentage) handleMaterialChange(index, 'efficiencyPercentage', m.efficiencyPercentage);
                          }
                        }}
                        slotProps={{ select: { native: true } }}
                      >
                        <option value="">Select Material</option>
                        {materials.map(m => (
                          <option key={m.id} value={m.materialCode}>{m.materialName} ({m.materialCode})</option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField
                        label="Received (Kg)"
                        type="number"
                        fullWidth
                        size="small"
                        value={mat.receivedWeightKg}
                        onChange={(e) => handleMaterialChange(index, 'receivedWeightKg', parseFloat(e.target.value))}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField
                        label="Returned (Kg)"
                        type="number"
                        fullWidth
                        size="small"
                        value={mat.returnedWeightKg}
                        onChange={(e) => handleMaterialChange(index, 'returnedWeightKg', parseFloat(e.target.value))}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField
                        label="Net Intake (Kg)"
                        type="number"
                        fullWidth
                        size="small"
                        slotProps={{ input: { readOnly: true } }}
                        value={mat.netIntakeWeightKg}
                        className="bg-slate-100"
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <TextField
                        label="Cost per Kg (₹)"
                        type="number"
                        fullWidth
                        size="small"
                        value={mat.costPerKg}
                        onChange={(e) => handleMaterialChange(index, 'costPerKg', parseFloat(e.target.value))}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}
              {receiptMaterials.length === 0 && (
                <Typography className="text-sm text-slate-500 text-center py-4">No materials in this receipt.</Typography>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions className="p-4 bg-slate-50 border-t border-slate-200">
        <Button onClick={onClose} disabled={saving} startIcon={<X size={16} />} className="text-slate-600">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} variant="contained" className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20" startIcon={<Save size={16} />}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditReceiptDialog;
