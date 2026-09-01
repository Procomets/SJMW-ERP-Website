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
import { getProductionWages, getAvailableFurnaces } from '../services/productionWagesService';
import type { ProductionWageData } from '../types/productionWages';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useAuth } from '../../../context/AuthContext';
import type { ProductionWagesTableRef } from '../components/ProductionWagesTable';
import ExportExcelButton from '../../../components/common/ExportExcelButton';
import ExportPdfButton from '../../../components/common/ExportPdfButton';

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
  const [data, setData] = useState<ProductionWageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);

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
    try {
      const result = await getProductionWages(
        new Date(startDate),
        new Date(endDate),
        furnaces
      );
      setData(result);
      setHasGenerated(true);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch production wages.');
    } finally {
      setLoading(false);
    }
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
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              View production wages by furnace and date range
            </Typography>
          </Box>
        </Box>
        
        {hasGenerated && (
          <Box sx={{ display: 'flex', gap: 1 }}>
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
            />
          </Box>
          <Box sx={{ flex: '1 1 200px' }}>
            <FormControl fullWidth size="small">
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
            />
          </Box>
          <Box sx={{ flex: '1 1 150px' }}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleGenerate}
              disabled={loading}
              sx={{ height: 40 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Generate'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

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
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ProductionWagesPage;
