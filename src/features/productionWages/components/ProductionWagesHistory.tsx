import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Chip,
  TextField
} from '@mui/material';
import { Eye, RefreshCw, Lock } from 'lucide-react';
import { getProductionWagesHistory } from '../services/productionWagesService';
import type { SavedProductionWageDoc } from '../types/productionWages';
import { format } from 'date-fns';

interface ProductionWagesHistoryProps {
  onViewRecord: (record: SavedProductionWageDoc) => void;
}

const ProductionWagesHistory: React.FC<ProductionWagesHistoryProps> = ({ onViewRecord }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<SavedProductionWageDoc[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProductionWagesHistory();
      setRecords(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial load

  const formatDateStr = (ts: any) => {
    if (!ts) return '';
    if (ts.toDate) return format(ts.toDate(), 'dd MMM yyyy');
    return String(ts);
  };

  const displayedRecords = React.useMemo(() => {
    if (!selectedMonth) return records;
    return records.filter(record => {
      let d: Date;
      if (record.startDate?.toDate) d = record.startDate.toDate();
      else d = new Date(record.startDate);
      return format(d, 'yyyy-MM') === selectedMonth;
    });
  }, [records, selectedMonth]);

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ width: 250 }}>
          <TextField
            label="Filter by Month"
            type="month"
            fullWidth
            size="small"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } } as any}
          />
        </Box>
        <Button
          variant="outlined"
          onClick={fetchHistory}
          disabled={loading}
          startIcon={<RefreshCw size={18} />}
          sx={{ height: 40 }}
        >
          {loading ? 'Refreshing...' : 'Refresh History'}
        </Button>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Date Range</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Furnaces</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rate</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Total Qty</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Saved By</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : displayedRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No saved production wages found.
                  </TableCell>
                </TableRow>
              ) : (
                displayedRecords.map(record => {
                  const qty = record.data?.entries?.reduce((sum, e) => sum + (e.qtyInKg || 0), 0) || 0;
                  return (
                    <TableRow key={record.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                          {formatDateStr(record.startDate)} - {formatDateStr(record.endDate)}
                          {record.isLocked && (
                            <Chip size="small" icon={<Lock size={12} />} label="Locked" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 200 }}>
                          {record.furnaces?.map(f => (
                            <Chip key={f} label={f} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>₹{record.rate}</TableCell>
                      <TableCell>{qty} kg</TableCell>
                      <TableCell>{record.createdBy}</TableCell>
                      <TableCell>{formatDateStr(record.createdAt)}</TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Eye size={16} />}
                          onClick={() => onViewRecord(record)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ProductionWagesHistory;
