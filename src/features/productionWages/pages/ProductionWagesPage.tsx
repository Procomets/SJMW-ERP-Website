import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Select,
  InputLabel,
  FormControl,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { Banknote } from 'lucide-react';
import ProductionWagesTable from '../components/ProductionWagesTable';
import { getProductionWages, getAvailableFurnaces, getSavedProductionWages, saveProductionWages, updateProductionWages, toggleLockProductionWages } from '../services/productionWagesService';
import type { ProductionWageData, SavedProductionWageDoc } from '../types/productionWages';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useAuth } from '../../../context/AuthContext';
import type { ProductionWagesTableRef } from '../components/ProductionWagesTable';
import ExportExcelButton from '../../../components/common/ExportExcelButton';
import ExportPdfButton from '../../../components/common/ExportPdfButton';
import ProductionWagesHistory from '../components/ProductionWagesHistory';
import { Tabs, Tab } from '@mui/material';
import { Save, Lock, Unlock } from 'lucide-react';

const ProductionWagesPage: React.FC = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role?.toLowerCase() === 'admin';
  const tableRef = React.useRef<ProductionWagesTableRef>(null);

  const [startDate, setStartDate] = useState<string>(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(
    format(endOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [furnaces, setFurnaces] = useState<string[]>([]);
  const [availableFurnaces, setAvailableFurnaces] = useState<string[]>([]);
  const [loadingFurnaces, setLoadingFurnaces] = useState<boolean>(false);
  const [rate, setRate] = useState<number>(2.5);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [data, setData] = useState<ProductionWageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState(0);
  const [isViewingSaved, setIsViewingSaved] = useState<boolean>(false);
  const [loadedRecordId, setLoadedRecordId] = useState<string | null>(null);
  const [loadedRecordLocked, setLoadedRecordLocked] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchFurnaces = async () => {
      if (!startDate || !endDate) return;
      setLoadingFurnaces(true);
      try {
        const result = await getAvailableFurnaces(new Date(startDate), new Date(endDate));
        setAvailableFurnaces(result);
        setFurnaces(result);
      } catch (err) {
        console.error('Failed to fetch available furnaces', err);
      } finally {
        setLoadingFurnaces(false);
      }
    };
    fetchFurnaces();
  }, [startDate, endDate]);

  const handleGenerate = async () => {
    if (!startDate || !endDate || furnaces.length === 0) {
      setError('Please select date range and at least one furnace.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    setIsViewingSaved(false);
    try {
      const saved = await getSavedProductionWages(new Date(startDate), new Date(endDate), furnaces);
      if (saved) {
        setData(saved.data);
        setRate(saved.rate);
        setHasGenerated(true);
        setIsViewingSaved(true);
        setLoadedRecordId(saved.id || null);
        setLoadedRecordLocked(saved.isLocked || false);
        setSuccess(saved.isLocked ? 'Loaded previously saved entry (Locked).' : 'Loaded previously saved entry.');
      } else {
        const result = await getProductionWages(
          new Date(startDate),
          new Date(endDate),
          furnaces
        );
        setData(result);
        setHasGenerated(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch production wages.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!startDate || !endDate || furnaces.length === 0 || !data) return;
    
    const tableData = tableRef.current?.getData();
    if (!tableData) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (loadedRecordId) {
        await updateProductionWages(
          loadedRecordId,
          rate,
          tableData,
          profile?.name || profile?.email || 'Unknown'
        );
        setSuccess('Production wages updated successfully!');
      } else {
        const newId = await saveProductionWages(
          new Date(startDate),
          new Date(endDate),
          furnaces,
          rate,
          tableData,
          profile?.name || profile?.email || 'Unknown'
        );
        setLoadedRecordId(newId);
        setIsViewingSaved(true);
        setSuccess('Production wages saved successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save production wages.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLock = async () => {
    if (!loadedRecordId) return;
    try {
      const newLockedState = !loadedRecordLocked;
      await toggleLockProductionWages(loadedRecordId, newLockedState, profile?.email || 'Admin');
      setLoadedRecordLocked(newLockedState);
      setSuccess(newLockedState ? 'Record locked successfully.' : 'Record unlocked successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to toggle lock.');
    }
  };

  const handleViewRecord = (record: SavedProductionWageDoc) => {
    let sDate = '';
    let eDate = '';
    if (record.startDate && record.startDate.toDate) sDate = format(record.startDate.toDate(), 'yyyy-MM-dd');
    else if (typeof record.startDate === 'string') sDate = record.startDate;
    
    if (record.endDate && record.endDate.toDate) eDate = format(record.endDate.toDate(), 'yyyy-MM-dd');
    else if (typeof record.endDate === 'string') eDate = record.endDate;

    setStartDate(sDate);
    setEndDate(eDate);
    setFurnaces(record.furnaces);
    setRate(record.rate);
    setData(record.data);
    setHasGenerated(true);
    setIsViewingSaved(true);
    setLoadedRecordId(record.id || null);
    setLoadedRecordLocked(record.isLocked || false);
    setTabValue(0);
    setError(null);
    setSuccess(record.isLocked ? 'Viewing loaded record from history (Locked).' : 'Viewing loaded record from history.');
  };

  return (
    <Box sx={{ maxWidth: 1000, margin: '0 auto', p: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: '#e8f0fe',
              color: '#1565C0',
              display: 'flex',
            }}
          >
            <Banknote size={24} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Production Wages
            </Typography>
          </Box>
        </Box>
        
        {hasGenerated && tabValue === 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isViewingSaved ? (
              <Button
                variant="contained"
                color="success"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                onClick={handleSave}
                disabled={saving}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {saving ? 'Saving...' : 'Save Data'}
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                  onClick={handleSave}
                  disabled={saving || (loadedRecordLocked && !isAdmin)}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  {saving ? 'Updating...' : 'Update Changes'}
                </Button>
                {isAdmin && (
                  <Button
                    variant="outlined"
                    color={loadedRecordLocked ? "error" : "warning"}
                    startIcon={loadedRecordLocked ? <Unlock size={16} /> : <Lock size={16} />}
                    onClick={handleToggleLock}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    {loadedRecordLocked ? 'Unlock Record' : 'Lock Record'}
                  </Button>
                )}
              </>
            )}
            {isAdmin && (
              <ExportExcelButton 
                onClick={() => tableRef.current?.exportExcel()}
              />
            )}
            <ExportPdfButton
              onClick={() => tableRef.current?.exportPdf()}
            />
          </Box>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, nv) => setTabValue(nv)}>
          <Tab label="Generate / View" />
          <Tab label="History" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {tabValue === 0 && (
        <>
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-end' }}>
              <Box sx={{ flex: '1 1 200px' }}>
                <TextField
                  label="Start Date"
                  type="date"
                  fullWidth
                  size="small"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } } as any}
                  disabled={isViewingSaved}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px' }}>
                <TextField
                  label="End Date"
                  type="date"
                  fullWidth
                  size="small"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } } as any}
                  disabled={isViewingSaved}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px' }}>
                <FormControl fullWidth size="small" disabled={isViewingSaved}>
                  <InputLabel>Furnace No</InputLabel>
                  <Select
                    multiple
                    value={furnaces}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFurnaces(typeof val === 'string' ? val.split(',') : val);
                    }}
                    input={<OutlinedInput label="Furnace No" />}
                    renderValue={(selected) => selected.join(', ')}
                  >
                    {loadingFurnaces ? (
                      <MenuItem disabled>Loading...</MenuItem>
                    ) : availableFurnaces.length === 0 ? (
                      <MenuItem disabled>No furnaces found</MenuItem>
                    ) : (
                      availableFurnaces.map((option) => (
                        <MenuItem key={option} value={option}>
                          <Checkbox checked={furnaces.indexOf(option) > -1} />
                          <ListItemText primary={option} />
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 100px' }}>
                <TextField
                  label="Rate"
                  type="number"
                  fullWidth
                  size="small"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value) || 0)}
                  slotProps={{ htmlInput: { step: 0.1 } }}
                  disabled={isViewingSaved}
                />
              </Box>
              <Box sx={{ flex: '1 1 150px', display: 'flex', gap: 1 }}>
                {isViewingSaved ? (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => {
                      setIsViewingSaved(false);
                      setHasGenerated(false);
                      setData(null);
                      setSuccess(null);
                    }}
                    sx={{ height: 40 }}
                  >
                    Clear View
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleGenerate}
                    disabled={loading}
                    sx={{ height: 40 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Generate'}
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>

          {hasGenerated && (
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ mt: 4 }}>
                <ProductionWagesTable
                  ref={tableRef}
                  data={data}
                  startDate={new Date(startDate)}
                  endDate={new Date(endDate)}
                  furnaces={furnaces}
                  rate={rate}
                  readonly={loadedRecordLocked && !isAdmin}
                />
              </Box>
            </Paper>
          )}
        </>
      )}

      {tabValue === 1 && (
        <ProductionWagesHistory onViewRecord={handleViewRecord} />
      )}
    </Box>
  );
};

export default ProductionWagesPage;
