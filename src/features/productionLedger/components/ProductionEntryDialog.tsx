import { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Typography, Box,
  Divider, CircularProgress, InputAdornment, Chip,
  FormControl, InputLabel, Select, MenuItem, useTheme, useMediaQuery,
} from '@mui/material';
import { X, Package } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useMaterials } from '../../../context/MaterialContext';

import {
  buildEmptyForm,
  calcTotalInput,
  calcEfficiency,
  type ProductionLedgerFormData,
  type ProductionLedgerEntry,
  type ProductionMaterialEntry,
} from '../types/productionLedger.types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (form: ProductionLedgerFormData) => Promise<void>;
  editEntry?: ProductionLedgerEntry | null;
}

const ProductionEntryDialog = ({ open, onClose, onSave, editEntry }: Props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { getByModule, loading: materialsLoading } = useMaterials();
  const activeMaterials = useMemo(() => getByModule('production'), [getByModule]);

  const [form, setForm] = useState<ProductionLedgerFormData>(() => buildEmptyForm(activeMaterials));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Initialise / reset form when dialog opens ──────────────────────────────
  useEffect(() => {
    if (!open) return;

    if (editEntry) {
      // Editing: merge saved materials with current active material list
      // This ensures new materials added after original entry also appear
      const dateStr = editEntry.date instanceof Timestamp
        ? editEntry.date.toDate().toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const mergedMaterials: ProductionMaterialEntry[] = activeMaterials.map((m) => {
        // Find this material in the saved record (match by materialId or code)
        const saved = editEntry.materials?.find(
          (sm) => sm.materialId === m.id || sm.materialId === m.materialId || sm.materialCode === m.materialCode
        );
        return {
          materialId: m.id,
          materialCode: m.materialCode,
          materialName: m.materialName,
          weightKg: saved ? (saved.weightKg ?? 0) : 0,
          efficiencyPercentage: m.efficiencyPercentage,
        };
      });

      setForm({
        heatNo: editEntry.heatNo,
        date: dateStr,
        alloyType: editEntry.alloyType,
        supervisorName: editEntry.supervisorName ?? '',
        goodIngots: editEntry.goodIngots,
        totalPieces: editEntry.totalPieces ?? 0,
        noOfPieces: editEntry.noOfPieces ?? editEntry.totalPieces ?? 0,
        efficiencyStatus: editEntry.efficiencyStatus ?? '',
        remarks: editEntry.remarks ?? '',
        materials: mergedMaterials,
        furnaceNo: editEntry.furnaceNo ?? '',
        operatorName: editEntry.operatorName ?? '',
        shiftStartTime: editEntry.shiftStartTime ?? '',
        shiftStartPeriod: editEntry.shiftStartPeriod ?? 'AM',
        shiftEndTime: editEntry.shiftEndTime ?? '',
        shiftEndPeriod: editEntry.shiftEndPeriod ?? 'AM',
        expectedEfficiencyPercentage: editEntry.expectedEfficiencyPercentage ?? 90,
      });
    } else {
      // New entry: fresh form with all active materials zeroed
      setForm(buildEmptyForm(activeMaterials));
    }
    setError('');
  }, [editEntry, open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Field setters ──────────────────────────────────────────────────────────
  const setField = (key: keyof Omit<ProductionLedgerFormData, 'materials'>, val: string | number) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const setMaterialWeight = (materialId: string, val: string) => {
    const weight = val === '' ? 0 : parseFloat(val) || 0;
    setForm((prev) => ({
      ...prev,
      materials: prev.materials.map((m) =>
        m.materialId === materialId ? { ...m, weightKg: weight } : m
      ),
    }));
  };

  // ── Live calculations ──────────────────────────────────────────────────────
  const totalInput = calcTotalInput(form.materials);
  const efficiency = calcEfficiency(Number(form.goodIngots), totalInput);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.heatNo.trim()) { setError('Heat No is required.'); return; }
    if (!form.alloyType.trim()) { setError('Alloy Type is required.'); return; }
    if (!form.furnaceNo.trim()) { setError('Furnace No is required.'); return; }
    if (!form.operatorName.trim()) { setError('Operator Name is required.'); return; }
    if (!form.shiftStartTime.trim() || !form.shiftEndTime.trim()) { setError('Shift start and end times are required.'); return; }
    if (Number(form.expectedEfficiencyPercentage) <= 0) { setError('Expected efficiency percentage must be positive.'); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const numFieldSx = {
    '& input': { textAlign: 'right' as const },
    '& .MuiInputBase-root': { fontSize: '0.8rem' },
    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={isMobile}
      slotProps={{ paper: { sx: { borderRadius: isMobile ? 0 : 3, maxHeight: isMobile ? '100vh' : '92vh' } } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 0.75, borderRadius: 1.5, background: 'linear-gradient(135deg, #1565C0, #42A5F5)', display: 'flex' }}>
            <Package size={18} color="#fff" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {editEntry ? 'Edit Production Entry' : 'Add Production Entry'}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 400 }}>
              Materials loaded from Master Controller
            </Typography>
          </Box>
        </Box>
        <Button onClick={onClose} size="small" sx={{ minWidth: 0, p: 0.5 }}>
          <X size={20} />
        </Button>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        {/* Summary strip */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          <Chip label={`Total Input: ${totalInput.toLocaleString()} Kg`} size="small"
            sx={{ background: '#e3f2fd', color: '#1565C0', fontWeight: 700, px: 1 }} />
          <Chip label={`Good Ingots: ${Number(form.goodIngots).toLocaleString()} Kg`} size="small"
            sx={{ background: '#e8f5e9', color: '#2e7d32', fontWeight: 700, px: 1 }} />
          <Chip
            label={`Efficiency: ${efficiency}%`} size="small"
            sx={{
              background: efficiency >= 90 ? '#e8f5e9' : efficiency >= 75 ? '#fff8e1' : '#ffebee',
              color: efficiency >= 90 ? '#2e7d32' : efficiency >= 75 ? '#e65100' : '#c62828',
              fontWeight: 700, px: 1
            }}
          />
          <Chip
            label={`${form.materials.length} materials`} size="small"
            sx={{ background: '#f3e5f5', color: '#6a1b9a', fontWeight: 700, px: 1 }}
          />
        </Box>

        {/* Header fields */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField label="Heat No *" fullWidth size="small" value={form.heatNo}
              onChange={(e) => setField('heatNo', e.target.value)}
              error={!!error && !form.heatNo.trim()} />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField 
              label="Date *" 
              type="date" 
              fullWidth 
              size="small" 
              value={form.date}
              onChange={(e) => setField('date', e.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  onClick: (e) => {
                    try {
                      (e.target as any).showPicker?.();
                    } catch (err) {}
                  }
                }
              }} 
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField label="Alloy Type *" fullWidth size="small" value={form.alloyType}
              onChange={(e) => setField('alloyType', e.target.value)}
              placeholder="e.g. ADC12, LM6"
              error={!!error && !form.alloyType.trim()} />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField label="Supervisor Name" fullWidth size="small" value={form.supervisorName}
              onChange={(e) => setField('supervisorName', e.target.value)}
              placeholder="Optional" />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField label="Furnace No *" fullWidth size="small" value={form.furnaceNo}
              onChange={(e) => setField('furnaceNo', e.target.value)}
              placeholder="e.g. U-10"
              error={!!error && !form.furnaceNo.trim()} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField label="Operator Name *" fullWidth size="small" value={form.operatorName}
              onChange={(e) => setField('operatorName', e.target.value)}
              placeholder="e.g. A Santhosh"
              error={!!error && !form.operatorName.trim()} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField label="Expected Efficiency % *" type="number" fullWidth size="small"
              value={form.expectedEfficiencyPercentage}
              onChange={(e) => setField('expectedEfficiencyPercentage', parseFloat(e.target.value) || 0)}
              slotProps={{ htmlInput: { min: 0, max: 100 } }}
              error={!!error && (Number(form.expectedEfficiencyPercentage) <= 0)} />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField label="Shift Start Time *" fullWidth size="small" value={form.shiftStartTime}
              onChange={(e) => setField('shiftStartTime', e.target.value)}
              placeholder="e.g. 09:00"
              error={!!error && !form.shiftStartTime.trim()} />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="shift-start-period-label">Start Period</InputLabel>
              <Select
                labelId="shift-start-period-label"
                label="Start Period"
                value={form.shiftStartPeriod}
                onChange={(e) => setField('shiftStartPeriod', e.target.value as 'AM' | 'PM')}
                sx={{ fontSize: '0.8rem' }}
              >
                <MenuItem value="AM" sx={{ fontSize: '0.8rem' }}>AM</MenuItem>
                <MenuItem value="PM" sx={{ fontSize: '0.8rem' }}>PM</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField label="Shift End Time *" fullWidth size="small" value={form.shiftEndTime}
              onChange={(e) => setField('shiftEndTime', e.target.value)}
              placeholder="e.g. 12:00"
              error={!!error && !form.shiftEndTime.trim()} />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="shift-end-period-label">End Period</InputLabel>
              <Select
                labelId="shift-end-period-label"
                label="End Period"
                value={form.shiftEndPeriod}
                onChange={(e) => setField('shiftEndPeriod', e.target.value as 'AM' | 'PM')}
                sx={{ fontSize: '0.8rem' }}
              >
                <MenuItem value="AM" sx={{ fontSize: '0.8rem' }}>AM</MenuItem>
                <MenuItem value="PM" sx={{ fontSize: '0.8rem' }}>PM</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>
            RAW MATERIALS (Kg) — {form.materials.length} materials from Master Controller
          </Typography>
        </Divider>

        {/* Dynamic material fields */}
        {materialsLoading ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <CircularProgress size={24} />
            <Typography sx={{ mt: 1, fontSize: '0.8rem', color: 'text.secondary' }}>
              Loading materials from Master Controller...
            </Typography>
          </Box>
        ) : form.materials.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center', bgcolor: '#fff8e1', borderRadius: 2, border: '1px solid #ffe082' }}>
            <Typography sx={{ fontSize: '0.82rem', color: '#e65100', fontWeight: 600 }}>
              No materials configured for Production. Go to Master Controller and enable "Show In Production" for relevant materials.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={1.5}>
            {form.materials.map((mat) => (
              <Grid size={{ xs: 6, sm: 3 }} key={mat.materialId}>
                <TextField
                  label={mat.materialCode}
                  title={`${mat.materialName} (Eff: ${mat.efficiencyPercentage}%)`}
                  type="number"
                  size="small"
                  fullWidth
                  value={mat.weightKg === 0 ? '' : mat.weightKg}
                  onChange={(e) => setMaterialWeight(mat.materialId, e.target.value)}
                  slotProps={{
                    htmlInput: { min: 0, step: 0.01 },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>Kg</Typography>
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={numFieldSx}
                  helperText={
                    <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
                      {mat.materialName}
                    </span>
                  }
                />
              </Grid>
            ))}
          </Grid>
        )}

        <Divider sx={{ mt: 2.5, mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>
            OUTPUT
          </Typography>
        </Divider>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 2.4 }}>
            <TextField
              label="Good Ingots (Kg) *" type="number" fullWidth size="small"
              value={form.goodIngots === 0 ? '' : form.goodIngots}
              onChange={(e) => setField('goodIngots', parseFloat(e.target.value) || 0)}
              slotProps={{
                htmlInput: { min: 0, step: 0.01 },
                input: {
                  endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: '0.65rem', color: 'success.main' }}>Kg</Typography></InputAdornment>
                },
              }}
              sx={numFieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 2.4 }}>
            <TextField
              label="No. of Pieces" type="number" fullWidth size="small"
              value={form.noOfPieces === 0 ? '' : form.noOfPieces}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setForm((prev) => ({ ...prev, noOfPieces: val, totalPieces: val }));
              }}
              slotProps={{ htmlInput: { min: 0 } }}
              sx={numFieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 2.4 }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="eff-status-dialog-label">Efficiency Status</InputLabel>
              <Select
                labelId="eff-status-dialog-label"
                label="Efficiency Status"
                value={form.efficiencyStatus}
                onChange={(e) => setField('efficiencyStatus', e.target.value)}
                sx={{ fontSize: '0.8rem' }}
              >
                <MenuItem value="" sx={{ fontSize: '0.8rem' }}><em>None</em></MenuItem>
                <MenuItem value="Good" sx={{ fontSize: '0.8rem' }}>Good</MenuItem>
                <MenuItem value="Normal" sx={{ fontSize: '0.8rem' }}>Normal</MenuItem>
                <MenuItem value="Poor" sx={{ fontSize: '0.8rem' }}>Poor</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 2.4 }}>
            <TextField label="Total Input (auto)" fullWidth size="small"
              value={`${totalInput.toLocaleString()} Kg`} disabled sx={numFieldSx} />
          </Grid>
          <Grid size={{ xs: 12, sm: 2.4 }}>
            <TextField label="Efficiency % (auto)" fullWidth size="small"
              value={`${efficiency}%`} disabled sx={numFieldSx} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Remarks" fullWidth size="small" multiline rows={2}
              value={form.remarks}
              onChange={(e) => setField('remarks', e.target.value)}
              placeholder="Optional notes about this production run"
            />
          </Grid>
        </Grid>

        {error && (
          <Typography color="error" variant="caption" sx={{ display: 'block', mt: 2 }}>{error}</Typography>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}
          sx={{ minWidth: 120, background: 'linear-gradient(135deg, #1565C0, #1976d2)' }}
        >
          {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : editEntry ? 'Update Entry' : 'Add Entry'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductionEntryDialog;
