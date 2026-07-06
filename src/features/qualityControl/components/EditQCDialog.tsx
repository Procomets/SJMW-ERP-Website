import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, Grid, Alert
} from '@mui/material';
import { Edit, Save, X } from 'lucide-react';
import type { QualityControlEntry, QCElement } from '../types/qualityControl.types';
import { updateQualityControl } from '../services/qualityControl.service';

interface EditQCDialogProps {
  open: boolean;
  onClose: () => void;
  qcEntry: QualityControlEntry | null;
  onSave: () => void;
}

const EditQCDialog = ({ open, onClose, qcEntry, onSave }: EditQCDialogProps) => {
  const [elements, setElements] = useState<QCElement[]>([]);
  const [operatorName, setOperatorName] = useState('');
  const [furnaceNo, setFurnaceNo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (qcEntry && open) {
      // Deep copy elements to avoid mutating prop directly
      setElements(JSON.parse(JSON.stringify(qcEntry.elements || [])));
      setOperatorName(qcEntry.operatorName || '');
      setFurnaceNo(qcEntry.furnaceNo || '');
      setError('');
    }
  }, [qcEntry, open]);

  const handleElementChange = (index: number, val: string) => {
    const updated = [...elements];
    const numVal = parseFloat(val);
    updated[index].observedValue = isNaN(numVal) ? 0 : numVal;
    
    // Update status based on min/max
    const { minValue, maxValue, observedValue } = updated[index];
    updated[index].status = (observedValue >= minValue && observedValue <= maxValue) ? 'PASS' : 'FAIL';
    
    setElements(updated);
  };

  const handleSave = async () => {
    if (!qcEntry) return;
    setSaving(true);
    setError('');
    try {
      const overallStatus = elements.every(e => e.status === 'PASS') ? 'PASS' : 'FAIL';
      await updateQualityControl(qcEntry.id, {
        elements,
        operatorName,
        furnaceNo,
        overallStatus,
      });
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save QC updates.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="font-bold text-lg flex items-center gap-2 text-slate-800">
        <Edit size={20} className="text-blue-600" /> Edit Quality Control - {qcEntry?.heatNo}
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box className="space-y-6">
          {/* General Details */}
          <Box>
            <Typography className="text-sm font-bold text-slate-700 mb-3 border-b pb-1">General Details</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Operator Name"
                  fullWidth
                  size="small"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Furnace No"
                  fullWidth
                  size="small"
                  value={furnaceNo}
                  onChange={(e) => setFurnaceNo(e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Element Analysis */}
          <Box>
            <Typography className="text-sm font-bold text-slate-700 mb-3 border-b pb-1">Element Analysis (Observed Values)</Typography>
            <Grid container spacing={2}>
              {elements.map((el, index) => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                  <Box className={`p-3 rounded-lg border ${el.status === 'PASS' ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'}`}>
                    <Typography className="text-xs font-bold text-slate-600 mb-1">{el.element} ({el.unit})</Typography>
                    <TextField
                      size="small"
                      type="number"
                      fullWidth
                      value={el.observedValue}
                      onChange={(e) => handleElementChange(index, e.target.value)}
                      slotProps={{
                        input: {
                          style: { fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }
                        }
                      }}
                    />
                    <Typography className="text-[10px] text-center text-slate-500 mt-1">
                      Range: {el.minValue} - {el.maxValue}
                    </Typography>
                    <Box className="flex justify-center mt-1">
                      {el.status === 'PASS' ? (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">PASS</span>
                      ) : (
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">FAIL</span>
                      )}
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
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

export default EditQCDialog;
