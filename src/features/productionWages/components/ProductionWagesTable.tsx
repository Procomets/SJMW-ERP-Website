import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
} from '@mui/material';
import { Edit2 } from 'lucide-react';
import type { ProductionWageData } from '../types/productionWages';
import { format } from 'date-fns';
import { exportProductionWagesToExcel } from '../utils/productionWagesExport';
import { exportProductionWagesToPdf } from '../utils/productionWagesPdfExport';

interface ProductionWagesTableProps {
  data: ProductionWageData | null;
  startDate: Date | null;
  endDate: Date | null;
  furnaces: string[];
  rate?: number;
}

export interface ProductionWagesTableRef {
  exportExcel: () => void;
  exportPdf: () => void;
}

const DARK_BLUE = '#002060';
const BORDER_COLOR = '#000000';

const EditableCell = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <TextField
    variant="standard"
    type="number"
    value={value === 0 ? '' : value}
    onChange={(e) => onChange(Number(e.target.value) || 0)}
    slotProps={{
      input: {
        disableUnderline: true,
      },
      htmlInput: {
        style: { textAlign: 'center', padding: 0, fontSize: '0.85rem', fontWeight: 600 }
      }
    }}
    sx={{ width: '100%' }}
  />
);

const StyledTableCell = ({
  children,
  header = false,
  align = 'center',
  bold = false,
  colSpan,
  rowSpan,
  sx = {},
}: any) => (
  <TableCell
    align={align}
    colSpan={colSpan}
    rowSpan={rowSpan}
    sx={{
      border: `1px solid ${BORDER_COLOR}`,
      backgroundColor: header ? DARK_BLUE : 'inherit',
      color: header ? '#fff' : 'inherit',
      fontWeight: header || bold ? 'bold' : 'normal',
      py: 0.5,
      px: 1,
      fontSize: '0.85rem',
      ...sx,
    }}
  >
    {children}
  </TableCell>
);

interface MaintenanceEntry {
  date: string;
  persons: number;
  costPerDay: number;
}

const MaintenanceModal = ({
  open,
  onClose,
  details,
  setDetails
}: {
  open: boolean;
  onClose: () => void;
  details: MaintenanceEntry[];
  setDetails: (details: MaintenanceEntry[]) => void;
}) => {
  const [localDetails, setLocalDetails] = useState<MaintenanceEntry[]>(details);

  useEffect(() => {
    if (open) {
      setLocalDetails(details);
    }
  }, [open, details]);

  const handleChange = (index: number, field: keyof MaintenanceEntry, value: number) => {
    const updated = [...localDetails];
    updated[index] = { ...updated[index], [field]: value };
    setLocalDetails(updated);
  };

  const handleSave = () => {
    setDetails(localDetails);
    onClose();
  };

  const grandTotal = localDetails.reduce((acc, row) => acc + (row.persons * row.costPerDay), 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ backgroundColor: DARK_BLUE, py: 1.5 }}>
        <Box sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '1.25rem' }}>
          Maintenance Calculation
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <StyledTableCell header>DATE</StyledTableCell>
                <StyledTableCell header>NO OF PERSONS</StyledTableCell>
                <StyledTableCell header>PER DAY COST</StyledTableCell>
                <StyledTableCell header>TOTAL AMOUNT</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {localDetails.map((row, idx) => (
                <TableRow key={idx}>
                  <StyledTableCell>{row.date}</StyledTableCell>
                  <StyledTableCell>
                    <EditableCell value={row.persons} onChange={(v) => handleChange(idx, 'persons', v)} />
                  </StyledTableCell>
                  <StyledTableCell>
                    <EditableCell value={row.costPerDay} onChange={(v) => handleChange(idx, 'costPerDay', v)} />
                  </StyledTableCell>
                  <StyledTableCell>{row.persons * row.costPerDay}</StyledTableCell>
                </TableRow>
              ))}
              {localDetails.length === 0 && (
                <TableRow>
                  <StyledTableCell colSpan={4}>No production dates found in this range.</StyledTableCell>
                </TableRow>
              )}
              <TableRow>
                <StyledTableCell colSpan={3} bold align="right">TOTAL</StyledTableCell>
                <StyledTableCell bold>{grandTotal}</StyledTableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: DARK_BLUE }}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

const ProductionWagesTable = forwardRef<ProductionWagesTableRef, ProductionWagesTableProps>(({
  data,
  startDate,
  endDate,
  furnaces,
  rate = 2.5,
}, ref) => {
  const [advance, setAdvance] = useState(0);
  const [transferred, setTransferred] = useState(0);
  const [cashPaid, setCashPaid] = useState(0);
  const [recovered, setRecovered] = useState(0);
  const [paid, setPaid] = useState(0);

  const [maintenanceDetails, setMaintenanceDetails] = useState<MaintenanceEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const initialSummary = data?.summary;

  useEffect(() => {
    if (initialSummary) {
      setAdvance(initialSummary.advance || 0);
      setTransferred(initialSummary.transferred || 0);
      setCashPaid(initialSummary.cashPaid || 0);
      setRecovered(initialSummary.recovered || 0);
      setPaid(initialSummary.paid || 0);
    }
  }, [initialSummary]);

  if (!data) return null;

  const { entries } = data;

  useEffect(() => {
    // Automatically populate unique dates
    const uniqueDates = Array.from(new Set(entries.map(e => e.date))).filter(Boolean);
    
    setMaintenanceDetails(prevDetails => {
      return uniqueDates.map(date => {
        const existing = prevDetails.find(d => d.date === date);
        if (existing) return existing;
        return { date, persons: 0, costPerDay: 800 };
      });
    });
  }, [entries]);
  
  const formatDateRange = () => {
    if (!startDate || !endDate) return 'PERIOD';
    return `PERIOD ${format(startDate, 'dd-MM-yyyy')} To ${format(endDate, 'dd-MM-yyyy')}`;
  };

  const getFurnaceTitle = () => {
    if (!furnaces || furnaces.length === 0) return 'NO UNITS SELECTED';
    if (furnaces.includes('ALL')) return 'ALL UNITS WAGES';
    if (furnaces.length === 1) return `${furnaces[0].toUpperCase()} WAGES`;
    
    const upper = furnaces.map(f => f.toUpperCase());
    const last = upper.pop();
    return `${upper.join(', ')} & ${last} WAGES`;
  };

  const formatNum = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '';
    if (val === 0) return '0';
    return val.toString();
  };

  // Calculate some sub totals
  const calculatedEntries = entries.map(row => ({
    ...row,
    amount: (row.qtyInKg || 0) * rate
  }));

  const totalAmount = calculatedEntries.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const calculatedMaintenance = maintenanceDetails.reduce((acc, row) => acc + (row.persons * row.costPerDay), 0);

  const totalLeft = advance + transferred + cashPaid;
  const balance = totalLeft - recovered;

  const grossPayable = totalAmount + calculatedMaintenance;
  const netPayable = grossPayable - recovered - paid;

  const handleExport = async () => {
    try {
      await exportProductionWagesToExcel({
        entries,
        startDate,
        endDate,
        furnaces,
        rate,
        advance,
        transferred,
        cashPaid,
        recovered,
        paid,
        maintenanceDetails,
      });
    } catch (err) {
      console.error('Failed to export to Excel', err);
      alert('Failed to export to Excel');
    }
  };

  const handleExportPdf = async () => {
    try {
      await exportProductionWagesToPdf({
        entries,
        startDate,
        endDate,
        furnaces,
        rate,
        advance,
        transferred,
        cashPaid,
        recovered,
        paid,
        maintenanceDetails,
      });
    } catch (err) {
      console.error('Failed to export to PDF', err);
      alert('Failed to export to PDF');
    }
  };

  useImperativeHandle(ref, () => ({
    exportExcel: handleExport,
    exportPdf: handleExportPdf,
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
      <TableContainer component={Paper} elevation={0} sx={{ maxWidth: 800, borderRadius: 0, border: `1px solid ${BORDER_COLOR}` }}>
        <Table size="small" sx={{ minWidth: 650 }} aria-label="production wages table">
          <TableHead>
            {/* Title Row */}
            <TableRow>
              <StyledTableCell header colSpan={5} sx={{ fontSize: '1.1rem', py: 1 }}>
                {getFurnaceTitle()}
              </StyledTableCell>
            </TableRow>
            {/* Subtitle Row */}
            <TableRow>
              <StyledTableCell header colSpan={5} sx={{ fontSize: '0.95rem' }}>
                {formatDateRange()}
              </StyledTableCell>
            </TableRow>
            {/* Column Headers */}
            <TableRow>
              <StyledTableCell header width="20%">DATE</StyledTableCell>
              <StyledTableCell header width="20%">ALLOY</StyledTableCell>
              <StyledTableCell header width="20%">QTY IN KG</StyledTableCell>
              <StyledTableCell header width="20%">HEAT NO</StyledTableCell>
              <StyledTableCell header width="20%">AMOUNT</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Data Rows */}
            {calculatedEntries.length > 0 ? (
              calculatedEntries.map((row, index) => (
                <TableRow key={index}>
                  <StyledTableCell>{row.date}</StyledTableCell>
                  <StyledTableCell>{row.alloy}</StyledTableCell>
                  <StyledTableCell>{formatNum(row.qtyInKg)}</StyledTableCell>
                  <StyledTableCell>{row.heatNo}</StyledTableCell>
                  <StyledTableCell>{formatNum(row.amount)}</StyledTableCell>
                </TableRow>
              ))
            ) : (
              // Empty rows placeholder to match the image structure if no data
              Array.from({ length: 4 }).map((_, idx) => (
                <TableRow key={idx}>
                  <StyledTableCell>&nbsp;</StyledTableCell>
                  <StyledTableCell>&nbsp;</StyledTableCell>
                  <StyledTableCell>&nbsp;</StyledTableCell>
                  <StyledTableCell>&nbsp;</StyledTableCell>
                  <StyledTableCell>0</StyledTableCell>
                </TableRow>
              ))
            )}

            {/* Total Row 1 */}
            <TableRow>
              <StyledTableCell></StyledTableCell>
              <StyledTableCell bold>TOTAL</StyledTableCell>
              <StyledTableCell></StyledTableCell>
              <StyledTableCell></StyledTableCell>
              <StyledTableCell>{totalAmount === 0 ? '-' : totalAmount}</StyledTableCell>
            </TableRow>

            {/* Extra Amount Row (e.g. 2.50) */}
            <TableRow>
              <StyledTableCell></StyledTableCell>
              <StyledTableCell></StyledTableCell>
              <StyledTableCell></StyledTableCell>
              <StyledTableCell></StyledTableCell>
              <StyledTableCell>{rate.toFixed(2)}</StyledTableCell>
            </TableRow>

            {/* Dark Blue Total Row */}
            <TableRow>
              <StyledTableCell></StyledTableCell>
              <StyledTableCell></StyledTableCell>
              <StyledTableCell></StyledTableCell>
              <StyledTableCell header>TOTAL</StyledTableCell>
              <StyledTableCell header>{totalAmount === 0 ? '-' : formatNum(totalAmount)}</StyledTableCell>
            </TableRow>

            {/* Footer Rows */}
            <TableRow>
              <StyledTableCell align="left">ADVANCE</StyledTableCell>
              <StyledTableCell><EditableCell value={advance} onChange={setAdvance} /></StyledTableCell>
              <StyledTableCell></StyledTableCell>
              <StyledTableCell align="left" sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', pl: 1 }}>
                  <Box>MAINTANANCE</Box>
                  <IconButton size="small" onClick={() => setModalOpen(true)} sx={{ p: 0.5, mr: 0.5 }}>
                    <Edit2 size={14} color={DARK_BLUE} />
                  </IconButton>
                </Box>
              </StyledTableCell>
              <StyledTableCell>{formatNum(calculatedMaintenance)}</StyledTableCell>
            </TableRow>

            <TableRow>
              <StyledTableCell align="left">TRANSFERRED</StyledTableCell>
              <StyledTableCell><EditableCell value={transferred} onChange={setTransferred} /></StyledTableCell>
              <StyledTableCell></StyledTableCell>
              <StyledTableCell></StyledTableCell>
              <StyledTableCell></StyledTableCell>
            </TableRow>

            <TableRow>
              <StyledTableCell align="left">CASH PAID</StyledTableCell>
              <StyledTableCell><EditableCell value={cashPaid} onChange={setCashPaid} /></StyledTableCell>
              <StyledTableCell></StyledTableCell>
              <StyledTableCell align="left">GROSS PAYABLE</StyledTableCell>
              <StyledTableCell>{formatNum(grossPayable)}</StyledTableCell>
            </TableRow>

            <TableRow>
              <StyledTableCell align="left">TOTAL</StyledTableCell>
              <StyledTableCell>{formatNum(totalLeft)}</StyledTableCell>
              <StyledTableCell></StyledTableCell>
              <StyledTableCell align="left">Advance Paid</StyledTableCell>
              <StyledTableCell>{formatNum(recovered)}</StyledTableCell>
            </TableRow>

            <TableRow>
              <StyledTableCell align="left">RECOVERED</StyledTableCell>
              <StyledTableCell><EditableCell value={recovered} onChange={setRecovered} /></StyledTableCell>
              <StyledTableCell></StyledTableCell>
              <StyledTableCell align="center" bold>PAID</StyledTableCell>
              <StyledTableCell><EditableCell value={paid} onChange={setPaid} /></StyledTableCell>
            </TableRow>

            <TableRow>
              <StyledTableCell header align="left" sx={{ color: '#fff', backgroundColor: DARK_BLUE, fontWeight: 'bold' }}>BALANCE</StyledTableCell>
              <StyledTableCell header sx={{ color: '#fff', backgroundColor: DARK_BLUE, fontWeight: 'bold' }}>{formatNum(balance)}</StyledTableCell>
              <StyledTableCell header sx={{ backgroundColor: DARK_BLUE }}></StyledTableCell>
              <StyledTableCell header align="center" sx={{ color: '#fff', backgroundColor: DARK_BLUE, fontWeight: 'bold' }}>NET PAYABLE</StyledTableCell>
              <StyledTableCell header sx={{ color: '#fff', backgroundColor: DARK_BLUE, fontWeight: 'bold' }}>{formatNum(netPayable)}</StyledTableCell>
            </TableRow>

          </TableBody>
        </Table>
      </TableContainer>

      <MaintenanceModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        details={maintenanceDetails}
        setDetails={setMaintenanceDetails}
      />
    </Box>
  );
});

export default ProductionWagesTable;
