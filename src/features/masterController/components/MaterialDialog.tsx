import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box,
  Divider, CircularProgress, MenuItem,
  FormControlLabel, Switch, Grid,
  useTheme, useMediaQuery,
} from '@mui/material';
import { X, Package, ShieldCheck } from 'lucide-react';
import type { MaterialMaster, MaterialMasterFormData } from '../types/materialMaster.types';
import { getEmptyMaterialForm } from '../types/materialMaster.types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (form: MaterialMasterFormData) => Promise<void>;
  editMaterial?: MaterialMaster | null;
}

const VISIBILITY_FIELDS = [
  { key: 'showInWarehouse',  label: 'Warehouse',   desc: 'Appears in warehouse stock & receipts' },
  { key: 'showInProduction', label: 'Production',  desc: 'Available in heat & production entry' },
  { key: 'showInCostLedger', label: 'Cost Ledger', desc: 'Shown in cost analysis sheets' },
  { key: 'showInReports',    label: 'Reports',     desc: 'Included in export & analytics' },
] as const;

const MaterialDialog = ({ open, onClose, onSave, editMaterial }: Props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [form, setForm] = useState<MaterialMasterFormData>(getEmptyMaterialForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editMaterial) {
      setForm({
        materialId: editMaterial.materialId,
        materialCode: editMaterial.materialCode,
        materialName: editMaterial.materialName,
        efficiencyPercentage: editMaterial.efficiencyPercentage,
        minimumStockKg: editMaterial.minimumStockKg,
        unit: editMaterial.unit,
        status: editMaterial.status,
        showInWarehouse: editMaterial.showInWarehouse,
        showInProduction: editMaterial.showInProduction,
        showInCostLedger: editMaterial.showInCostLedger,
        showInReports: editMaterial.showInReports,
      });
    } else {
      setForm(getEmptyMaterialForm());
    }
    setError('');
  }, [editMaterial, open]);

  const set = (key: keyof MaterialMasterFormData, val: any) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const validate = (): string => {
    if (!form.materialCode.trim()) return 'Material Code is required.';
    if (!form.materialName.trim()) return 'Material Name is required.';
    if (form.efficiencyPercentage < 0 || form.efficiencyPercentage > 100)
      return 'Efficiency must be between 0 and 100.';
    if (form.minimumStockKg < 0) return 'Minimum Stock cannot be negative.';
    return '';
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save material.');
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!editMaterial;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}
      slotProps={{ paper: { sx: { borderRadius: isMobile ? 0 : 3, maxHeight: isMobile ? '100vh' : '92vh' } } }}
    >
      {/* Header */}
      <DialogTitle sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid', borderColor: 'divider',
        py: 2, px: 3, bgcolor: 'grey.50'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, bgcolor: 'primary.main', color: 'white', borderRadius: 1.5, display: 'flex' }}>
            <Package size={18} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>
              {isEdit ? 'Edit Material' : 'Add New Material'}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 400 }}>
              {isEdit ? 'Update material configuration' : 'Register a new material in Master Controller'}
            </Typography>
          </Box>
        </Box>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>
          <X size={20} />
        </button>
      </DialogTitle>

      <DialogContent sx={{ py: 3, px: 3 }}>
        {error && (
          <Box sx={{ mb: 2.5, p: 1.5, bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 1.5 }}>
            <Typography sx={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 600 }}>{error}</Typography>
          </Box>
        )}

        {/* Basic Info */}
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.5 }}>
          Basic Information
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Material Code *"
              size="small"
              fullWidth
              value={form.materialCode}
              onChange={(e) => set('materialCode', e.target.value)}
              placeholder="e.g. RTR"
              slotProps={{ htmlInput: { style: { textTransform: 'uppercase' as const } } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Material ID"
              size="small"
              fullWidth
              value={form.materialId}
              onChange={(e) => set('materialId', e.target.value)}
              placeholder="Auto-generated"
              disabled={isEdit}
              sx={{ bgcolor: isEdit ? 'grey.100' : 'transparent' }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Material Name *"
              size="small"
              fullWidth
              value={form.materialName}
              onChange={(e) => set('materialName', e.target.value)}
              placeholder="e.g. Return Scrap"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        {/* Technical Properties */}
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.5 }}>
          Technical Properties
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Efficiency %"
              size="small"
              fullWidth
              type="number"
              value={form.efficiencyPercentage}
              onChange={(e) => set('efficiencyPercentage', parseFloat(e.target.value) || 0)}
              slotProps={{
                htmlInput: { min: 0, max: 100, step: 0.1 },
                input: { endAdornment: <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>%</span> }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Min. Stock"
              size="small"
              fullWidth
              type="number"
              value={form.minimumStockKg}
              onChange={(e) => set('minimumStockKg', parseFloat(e.target.value) || 0)}
              slotProps={{
                htmlInput: { min: 0, step: 1 },
                input: { endAdornment: <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Kg</span> }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Unit"
              size="small"
              select
              fullWidth
              value={form.unit}
              onChange={(e) => set('unit', e.target.value)}
            >
              <MenuItem value="Kg">Kg</MenuItem>
              <MenuItem value="Ton">Ton</MenuItem>
              <MenuItem value="Pcs">Pcs</MenuItem>
              <MenuItem value="Ltr">Ltr</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Status"
              size="small"
              select
              fullWidth
              value={form.status}
              onChange={(e) => set('status', e.target.value as 'Active' | 'Disabled')}
            >
              <MenuItem value="Active">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e' }} />
                  Active
                </Box>
              </MenuItem>
              <MenuItem value="Disabled">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#94a3b8' }} />
                  Disabled
                </Box>
              </MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        {/* Visibility Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <ShieldCheck size={14} color="#1565C0" />
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Module Visibility
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {VISIBILITY_FIELDS.map((f) => (
            <Box key={f.key} sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              px: 1.5, py: 1, bgcolor: 'grey.50', borderRadius: 1.5,
              border: '1px solid', borderColor: form[f.key] ? 'primary.light' : 'grey.200',
              transition: 'all 0.15s ease',
            }}>
              <Box>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.primary' }}>{f.label}</Typography>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{f.desc}</Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={form[f.key] as boolean}
                    onChange={(e) => set(f.key, e.target.checked)}
                    color="primary"
                  />
                }
                label=""
                sx={{ m: 0 }}
              />
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', py: 2, px: 3, gap: 1, bgcolor: 'grey.50' }}>
        <Button onClick={onClose} variant="outlined" disabled={saving} sx={{ borderRadius: 2, px: 3 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={{ borderRadius: 2, px: 4, fontWeight: 600 }}
        >
          {saving ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={14} sx={{ color: 'white' }} />
              Saving...
            </Box>
          ) : (isEdit ? 'Update Material' : 'Add Material')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialDialog;
