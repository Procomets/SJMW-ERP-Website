import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box, Typography, Button, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Tooltip, IconButton, Snackbar, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Card,
  useTheme, Tabs, Tab,
} from '@mui/material';
import {
  Save, Lock, Unlock, RefreshCw, Plus, Trash2,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import {
  loadOrCreateExpenseRegister,
  saveExpenseRegister,
  lockExpenseRegister,
  unlockExpenseRegister,
} from '../services/expenseRegister.service';
import { exportExpenseRegisterToExcel } from '../utils/expenseRegisterExport';
import { exportExpenseRegisterToPdf } from '../utils/expenseRegisterPdfExport';
import ExportExcelButton from '../../../components/common/ExportExcelButton';
import ExportPdfButton from '../../../components/common/ExportPdfButton';
import type {
  ExpenseRegisterDoc,
  ExpenseCategory,
  LabourEmployee,
} from '../types/expenseRegister.types';
import {
  FY_MONTHS,
  generateYearOptions,
  recalcAllTotals,
  fmtAmount,
  MONTH_NUMBER_MAP,
  getWeeksForMonth,
} from '../types/expenseRegister.types';
import { getAttendanceForMonth } from '../../attendance/services/attendanceService';
import { getEmployees } from '../../employeeMaster/services/employeeService';
import { YearlyExpenseSummary } from '../components/YearlyExpenseSummary';

// ─── Color constants matching Excel screenshot ──────────────────────────────
const HEADER_BG = '#1a2a5e';
const HEADER_BG_LIGHT = '#243b7f';
const TOTAL_COL_BG = '#f5c4a1';
const FOOTER_BG = '#d6e4f0';
const CATEGORY_BG = '#f8fafc';
const SUB_ROW_BG = '#ffffff';
const GRID_BORDER = '#c5cdd8';
const HOVER_BG = '#eef3fb';

// ─── Inline Editable Cell ───────────────────────────────────────────────────
interface EditableCellProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
  isTotalCol?: boolean;
  placeholder?: string;
}

const EditableCell = ({ value, onChange, disabled = false, isTotalCol = false, placeholder }: EditableCellProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (disabled) return;
    setDraft(value ? String(value) : '');
    setEditing(true);
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const parsed = parseFloat(draft) || 0;
    if (parsed !== value) onChange(parsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          height: '100%',
          border: '2px solid #1565C0',
          borderRadius: 2,
          outline: 'none',
          textAlign: 'right',
          fontSize: '0.82rem',
          fontWeight: 600,
          padding: '4px 8px',
          background: '#e8f0fe',
          boxSizing: 'border-box',
          fontFamily: '"Inter", sans-serif',
        }}
      />
    );
  }

  return (
    <Box
      onClick={handleClick}
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        px: 1,
        cursor: disabled ? 'default' : 'cell',
        backgroundColor: isTotalCol ? TOTAL_COL_BG : 'transparent',
        '&:hover': disabled ? {} : { backgroundColor: isTotalCol ? '#f0b88e' : HOVER_BG },
        transition: 'background-color 0.15s ease',
        minHeight: 34,
      }}
    >
      <Typography
        sx={{
          fontSize: '0.82rem',
          fontWeight: value ? 600 : 400,
          color: value ? '#1e293b' : '#94a3b8',
          fontFamily: '"Inter", monospace',
        }}
      >
        {value ? fmtAmount(value) : (placeholder || '—')}
      </Typography>
    </Box>
  );
};

// ─── Read-only display cell ─────────────────────────────────────────────────
const DisplayCell = ({ value, isTotalCol = false, bold = false }: { value: number; isTotalCol?: boolean; bold?: boolean }) => (
  <Box
    sx={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      px: 1,
      backgroundColor: isTotalCol ? TOTAL_COL_BG : 'transparent',
      minHeight: 34,
    }}
  >
    <Typography
      sx={{
        fontSize: '0.82rem',
        fontWeight: bold ? 700 : 600,
        color: '#1e293b',
        fontFamily: '"Inter", monospace',
      }}
    >
      {fmtAmount(value)}
    </Typography>
  </Box>
);

// ─── Main Page Component ────────────────────────────────────────────────────
interface Props {
  accountsMode?: boolean;
}

const MonthlyExpenseRegisterPage = ({ accountsMode = false }: Props) => {
  const theme = useTheme();
  const { profile, user } = useAuth();
  const isAdmin = profile?.role?.toLowerCase() === 'admin';

  // Year / Month selection
  const yearOptions = generateYearOptions();
  const [selectedYear, setSelectedYear] = useState(yearOptions[yearOptions.length - 2] || yearOptions[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(FY_MONTHS[0]);
  const [activeTab, setActiveTab] = useState(0);

  // Data state
  const [register, setRegister] = useState<ExpenseRegisterDoc | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // UI state
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false, message: '', severity: 'info',
  });
  const [addLabourOpen, setAddLabourOpen] = useState(false);
  const [newLabourName, setNewLabourName] = useState('');

  const isLocked = register?.status === 'Locked';
  const isEditable = !isLocked && (isAdmin || !accountsMode || register?.editable !== false);

  // ─── Load register ──────────────────────────────────────────────────
  const handleLoad = useCallback(async () => {
    setLoading(true);
    try {
      const createdBy = profile?.name || user?.displayName || 'System';
      const doc = await loadOrCreateExpenseRegister(selectedYear, selectedMonth, createdBy);

      let updatedCategories = doc.expenseCategories || [];
      
      if (doc.status !== 'Locked') {
        const monthNum = MONTH_NUMBER_MAP[selectedMonth] || 1;
        const actualYear = monthNum >= 4 ? parseInt(selectedYear) : parseInt(selectedYear) + 1;
        const monthYearStr = `${actualYear}-${monthNum.toString().padStart(2, '0')}`;

        const [attendanceRecords, employees] = await Promise.all([
          getAttendanceForMonth(monthYearStr),
          getEmployees()
        ]);

        const labourIds = new Set(employees.filter(e => e.employeeType === 'Labour').map(e => e.employeeId));

        const monthWeeks = getWeeksForMonth(selectedYear, selectedMonth);
        const weeklyPresentCounts: Record<string, number> = {
          week1: 0, week2: 0, week3: 0, week4: 0, week5: 0, week6: 0
        };

        attendanceRecords.forEach(record => {
          if (labourIds.has(record.employeeId)) {
            let value = 0;
            if (record.status === 'Present') value = 1;
            else if (record.status === 'P/N') value = 2;

            if (value > 0) {
              const day = parseInt(record.date.split('-')[2]);
              const foundWeek = monthWeeks.find(w => day >= w.startDay && day <= w.endDay);
              if (foundWeek) {
                weeklyPresentCounts[foundWeek.key] = (weeklyPresentCounts[foundWeek.key] || 0) + value;
              }
            }
          }
        });

        updatedCategories = updatedCategories.map(cat => {
          if (cat.categoryId === 'EXP002') {
            return {
              ...cat,
              weeklyPresent: {
                week1: weeklyPresentCounts.week1 || 0,
                week2: weeklyPresentCounts.week2 || 0,
                week3: weeklyPresentCounts.week3 || 0,
                week4: weeklyPresentCounts.week4 || 0,
                week5: weeklyPresentCounts.week5 || 0,
                week6: weeklyPresentCounts.week6 || 0,
              }
            };
          }
          return cat;
        });
      }

      setRegister(doc);
      const { categories: recalced } = recalcAllTotals(updatedCategories);
      setCategories(recalced);
      setLoaded(true);
      setSnackbar({ open: true, message: `Loaded ${selectedMonth} ${selectedYear}`, severity: 'success' });
    } catch (err: any) {
      console.error('Failed to load register:', err);
      setSnackbar({ open: true, message: `Error: ${err.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, profile, user]);

  // ─── Recalculate and update state ──────────────────────────────────
  const updateCategories_unused = useCallback((updated: ExpenseCategory[]) => {
    const { categories: recalced } = recalcAllTotals(updated);
    setCategories(recalced);
  }, []);

  type WeekKey = 'week1' | 'week2' | 'week3' | 'week4' | 'week5' | 'week6';

  // ─── Update a standard category weekly amount ─────────────────────
  const updateWeeklyAmount = useCallback((catId: string, week: WeekKey, value: number) => {
    setCategories((prev) => {
      const updated = prev.map((cat) => {
        if (cat.categoryId !== catId) return cat;
        return {
          ...cat,
          weeklyAmounts: {
            ...cat.weeklyAmounts!,
            [week]: value,
          },
        };
      });
      const { categories: recalced } = recalcAllTotals(updated);
      return recalced;
    });
  }, []);

  // ─── Update food expense present count ────────────────────────────
  const updateFoodPresent = useCallback((week: WeekKey, value: number) => {
    setCategories((prev) => {
      const updated = prev.map((cat) => {
        if (cat.categoryId !== 'EXP002') return cat;
        return {
          ...cat,
          weeklyPresent: {
            ...cat.weeklyPresent!,
            [week]: value,
          },
        };
      });
      const { categories: recalced } = recalcAllTotals(updated);
      return recalced;
    });
  }, []);

  // ─── Update food rate ─────────────────────────────────────────────
  const updateFoodRate = useCallback((rate: number) => {
    setCategories((prev) => {
      const updated = prev.map((cat) => {
        if (cat.categoryId !== 'EXP002') return cat;
        return { ...cat, foodRate: rate };
      });
      const { categories: recalced } = recalcAllTotals(updated);
      return recalced;
    });
  }, []);

  // ─── Update employee weekly amount ────────────────────────────────
  const updateEmployeeWeek = useCallback((empId: string, week: WeekKey, value: number) => {
    setCategories((prev) => {
      const updated = prev.map((cat) => {
        if (cat.categoryId !== 'EXP003') return cat;
        return {
          ...cat,
          employees: cat.employees?.map((emp) =>
            emp.employeeId === empId ? { ...emp, [week]: value } : emp,
          ),
        };
      });
      const { categories: recalced } = recalcAllTotals(updated);
      return recalced;
    });
  }, []);

  // ─── Add labour employee ──────────────────────────────────────────
  const handleAddLabour = useCallback(() => {
    if (!newLabourName.trim()) return;
    const empId = `EMP${Date.now()}`;
    const newEmp: LabourEmployee = {
      employeeId: empId,
      employeeName: newLabourName.trim(),
      week1: 0, week2: 0, week3: 0, week4: 0, week5: 0, week6: 0, monthlyTotal: 0,
    };
    setCategories((prev) => {
      const updated = prev.map((cat) => {
        if (cat.categoryId !== 'EXP003') return cat;
        return { ...cat, employees: [...(cat.employees || []), newEmp] };
      });
      return updated;
    });
    setNewLabourName('');
    setAddLabourOpen(false);
  }, [newLabourName]);

  // ─── Remove labour employee ───────────────────────────────────────
  const removeLabour = useCallback((empId: string) => {
    setCategories((prev) => {
      const updated = prev.map((cat) => {
        if (cat.categoryId !== 'EXP003') return cat;
        return {
          ...cat,
          employees: cat.employees?.filter((emp) => emp.employeeId !== empId),
        };
      });
      const { categories: recalced } = recalcAllTotals(updated);
      return recalced;
    });
  }, []);

  // ─── Update fuel sub-category ─────────────────────────────────────
  const updateSubCategoryWeek = useCallback((subName: string, week: WeekKey, value: number) => {
    setCategories((prev) => {
      const updated = prev.map((cat) => {
        if (cat.categoryId !== 'EXP004') return cat;
        return {
          ...cat,
          subCategories: cat.subCategories?.map((sub) =>
            sub.name === subName ? { ...sub, [week]: value } : sub,
          ),
        };
      });
      const { categories: recalced } = recalcAllTotals(updated);
      return recalced;
    });
  }, []);

  // ─── Save ─────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!register) return;
    setSaving(true);
    try {
      await saveExpenseRegister(selectedYear, selectedMonth, {
        ...register,
        expenseCategories: categories,
      });
      setSnackbar({ open: true, message: 'Saved successfully!', severity: 'success' });
    } catch (err: any) {
      console.error('Save failed:', err);
      setSnackbar({ open: true, message: `Save failed: ${err.message}`, severity: 'error' });
    } finally {
      setSaving(false);
    }
  }, [register, categories, selectedYear, selectedMonth]);

  // ─── Lock / Unlock ────────────────────────────────────────────────
  const handleToggleLock = useCallback(async () => {
    if (!register) return;
    try {
      if (isLocked) {
        await unlockExpenseRegister(selectedYear, selectedMonth);
        setRegister((prev) => prev ? { ...prev, status: 'Open', editable: true, lockedBy: '' } : prev);
        setSnackbar({ open: true, message: 'Month unlocked', severity: 'info' });
      } else {
        const lockedBy = profile?.name || user?.displayName || 'Admin';
        await lockExpenseRegister(selectedYear, selectedMonth, lockedBy);
        setRegister((prev) => prev ? { ...prev, status: 'Locked', editable: false, lockedBy } : prev);
        setSnackbar({ open: true, message: 'Month locked', severity: 'info' });
      }
    } catch (err: any) {
      console.error('Lock toggle failed:', err);
      setSnackbar({ open: true, message: `Error: ${err.message}`, severity: 'error' });
    }
  }, [register, isLocked, selectedYear, selectedMonth, profile, user]);

  // ─── Export ───────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    if (!register) return;
    try {
      await exportExpenseRegisterToExcel({ ...register, expenseCategories: categories });
      setSnackbar({ open: true, message: 'Excel exported!', severity: 'success' });
    } catch (err: any) {
      console.error('Export failed:', err);
      setSnackbar({ open: true, message: `Export failed: ${err.message}`, severity: 'error' });
    }
  }, [register, categories]);

  // ─── Export PDF ───────────────────────────────────────────────────────
  const handleExportPdf = useCallback(async () => {
    if (!register) return;
    try {
      await exportExpenseRegisterToPdf({ ...register, expenseCategories: categories });
      setSnackbar({ open: true, message: 'PDF exported!', severity: 'success' });
    } catch (err: any) {
      console.error('PDF export failed:', err);
      setSnackbar({ open: true, message: `PDF export failed: ${err.message}`, severity: 'error' });
    }
  }, [register, categories]);

  // Calculate totals for display
  const { weeklyTotals, grandTotal } = recalcAllTotals(categories);

  // Dynamic weeks helper for selected month
  const weeks = getWeeksForMonth(selectedYear, selectedMonth);

  // ─── Table cell style helpers ─────────────────────────────────────
  const cellSx = {
    borderRight: `1px solid ${GRID_BORDER}`,
    borderBottom: `1px solid ${GRID_BORDER}`,
    padding: 0,
  };

  const headerCellSx = {
    ...cellSx,
    backgroundColor: HEADER_BG,
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.78rem',
    textAlign: 'center' as const,
    padding: '8px 6px',
    letterSpacing: 0.3,
  };

  let sNo = 0;

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 0.5 }}>
          Monthly Expense Register
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
          Track and manage weekly expenses across all categories
        </Typography>

        <Tabs 
          value={activeTab} 
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            minHeight: 36,
            '& .MuiTab-root': { minHeight: 36, fontWeight: 600, textTransform: 'none', fontSize: '0.9rem' },
          }}
        >
          <Tab label="Register" />
          <Tab label="History" />
        </Tabs>
      </Box>

      {/* ─── Top Toolbar ─────────────────────────────────────────────── */}
      <Card sx={{
        mb: 3, p: 2, borderRadius: 1,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid #e2e8f0',
      }}>
        <Box sx={{
          display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center',
        }}>
          {/* Year */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              label="Year"
              onChange={(e) => { setSelectedYear(e.target.value); setLoaded(false); }}
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Month - Only in Register Tab */}
          {activeTab === 0 && (
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                label="Month"
                onChange={(e) => { setSelectedMonth(e.target.value); setLoaded(false); }}
              >
                {FY_MONTHS.map((m) => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Load - Only in Register Tab */}
          {activeTab === 0 && (
            <Button
              variant="contained"
              onClick={handleLoad}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshCw size={16} />}
              sx={{
                borderRadius: 2, fontWeight: 600, textTransform: 'none',
                background: 'linear-gradient(135deg, #1565C0, #1976D2)',
                boxShadow: '0 2px 8px rgba(21,101,192,0.3)',
                '&:hover': { background: 'linear-gradient(135deg, #0D47A1, #1565C0)' },
              }}
            >
              Load
            </Button>
          )}

          <Box sx={{ flex: 1 }} />

          {/* Save */}
          {activeTab === 0 && loaded && (
            <Button
              variant="contained"
              color="success"
              onClick={handleSave}
              disabled={saving || !isEditable}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
              sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          )}

          {/* Lock / Unlock (Admin only) */}
          {activeTab === 0 && loaded && isAdmin && (
            <Tooltip title={isLocked ? 'Unlock Month' : 'Lock Month'}>
              <Button
                variant="outlined"
                onClick={handleToggleLock}
                startIcon={isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                sx={{
                  borderRadius: 2, fontWeight: 600, textTransform: 'none',
                  borderColor: isLocked ? '#d32f2f' : '#ed6c02',
                  color: isLocked ? '#d32f2f' : '#ed6c02',
                  '&:hover': {
                    borderColor: isLocked ? '#b71c1c' : '#e65100',
                    backgroundColor: isLocked ? '#ffebee' : '#fff3e0',
                  },
                }}
              >
                {isLocked ? 'Unlock' : 'Lock'}
              </Button>
            </Tooltip>
          )}

          {/* Export Excel */}
          {activeTab === 0 && loaded && !accountsMode && (
            <ExportExcelButton onClick={handleExport} sx={{ minWidth: 0, p: '6px 12px' }} />
          )}

          {/* Export PDF */}
          {activeTab === 0 && loaded && (
            <ExportPdfButton onClick={handleExportPdf} sx={{ minWidth: 0, p: '6px 12px' }} />
          )}
        </Box>

        {/* Status badge */}
        {activeTab === 0 && loaded && register && (
          <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              px: 1.5, py: 0.3, borderRadius: 1.5, fontSize: '0.68rem', fontWeight: 700,
              letterSpacing: 0.5, textTransform: 'uppercase',
              backgroundColor: isLocked ? '#ffebee' : '#e8f5e9',
              color: isLocked ? '#c62828' : '#2e7d32',
              border: `1px solid ${isLocked ? '#ef9a9a' : '#a5d6a7'}`,
            }}>
              {isLocked ? '🔒 Locked' : '🟢 Open'}
            </Box>
            {isLocked && register.lockedBy && (
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Locked by {register.lockedBy}
              </Typography>
            )}
          </Box>
        )}
      </Card>

      {/* ─── Loading state ───────────────────────────────────────────── */}
      {activeTab === 0 && loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* ─── Empty state ─────────────────────────────────────────────── */}
      {activeTab === 0 && !loading && !loaded && (
        <Card sx={{
          py: 8, textAlign: 'center', borderRadius: 1,
          border: '2px dashed #cbd5e1',
          backgroundColor: '#f8fafc',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <FileSpreadsheet size={48} color="#94a3b8" />
          </Box>
          <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600 }}>
            Select Year & Month, then click Load
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
            The expense register will load or create automatically
          </Typography>
        </Card>
      )}

      {/* ─── Spreadsheet Table ───────────────────────────────────────── */}
      {activeTab === 0 && loaded && !loading && (
        <Card sx={{
          borderRadius: 1, overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
        }}>
          {/* Title banner */}
          <Box sx={{
            background: `linear-gradient(135deg, ${HEADER_BG}, ${HEADER_BG_LIGHT})`,
            px: 3, py: 1.5, textAlign: 'center',
          }}>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', letterSpacing: 0.5 }}>
              Sri Jothi Moulding Works
            </Typography>
            <Typography sx={{ color: '#93c5fd', fontWeight: 600, fontSize: '0.8rem', mt: 0.3 }}>
              Weekly Expenses For {selectedYear}
            </Typography>
            <Typography sx={{ color: '#bfdbfe', fontWeight: 600, fontSize: '0.75rem', mt: 0.2 }}>
              {selectedMonth}
            </Typography>
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: 780,
              fontFamily: '"Inter", sans-serif',
            }}>
              {/* Column header */}
              <thead>
                <tr>
                  <th style={{
                    ...headerCellSx, width: 56, borderLeft: `1px solid ${GRID_BORDER}`,
                    position: 'sticky', top: 0, zIndex: 2,
                  }}>
                    S.No
                  </th>
                  <th style={{
                    ...headerCellSx, width: 220, textAlign: 'left', paddingLeft: 12,
                    position: 'sticky', top: 0, zIndex: 2,
                  }}>
                    Particulars
                  </th>
                  {weeks.map((w) => (
                    <th key={w.key} style={{
                      ...headerCellSx, width: 115,
                      position: 'sticky', top: 0, zIndex: 2,
                    }}>
                      <div>{w.label}</div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 500, opacity: 0.85, marginTop: 2 }}>
                        ({w.dateRange})
                      </div>
                    </th>
                  ))}
                  <th style={{
                    ...headerCellSx, width: 130,
                    backgroundColor: '#7c3a14', color: '#fff',
                    position: 'sticky', top: 0, zIndex: 2,
                  }}>
                    Total For Month
                  </th>
                </tr>
              </thead>

              <tbody>
                {categories.map((cat) => {
                  // ─── Food Expenses (EXP002) ──────────────────────
                  if (cat.categoryId === 'EXP002') {
                    sNo++;
                    const present = cat.weeklyPresent || { week1: 0, week2: 0, week3: 0, week4: 0, week5: 0 };
                    const wa = cat.weeklyAmounts || { week1: 0, week2: 0, week3: 0, week4: 0, week5: 0 };
                    return (
                      <React.Fragment key={cat.categoryId}>
                        {/* Header row */}
                        <tr style={{ backgroundColor: CATEGORY_BG }}>
                          <td style={{ ...cellSx, textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', borderLeft: `1px solid ${GRID_BORDER}` }}>
                            {sNo}
                          </td>
                          <td style={{ ...cellSx, fontWeight: 700, fontSize: '0.82rem', padding: '8px 12px' }}>
                            Food Expenses For Labours
                          </td>
                          {weeks.map((w) => (
                            <td key={w.key} style={cellSx}>
                              <DisplayCell value={wa[w.key] || 0} />
                            </td>
                          ))}
                          <td style={cellSx}>
                            <DisplayCell value={cat.monthlyTotal || 0} isTotalCol bold />
                          </td>
                        </tr>
                        {/* Sub-row: present × rate */}
                        <tr style={{ backgroundColor: SUB_ROW_BG }}>
                          <td style={{ ...cellSx, borderLeft: `1px solid ${GRID_BORDER}` }}></td>
                          <td style={{ ...cellSx, padding: '4px 12px 4px 24px', fontSize: '0.78rem', color: '#64748b' }}>
                            No Of Present × {cat.foodRate || 130}
                            {isAdmin && (
                              <Tooltip title="Change food rate">
                                <input
                                  type="number"
                                  value={cat.foodRate || 130}
                                  onChange={(e) => updateFoodRate(parseFloat(e.target.value) || 0)}
                                  disabled={!isEditable}
                                  style={{
                                    width: 50, marginLeft: 8, border: '1px solid #cbd5e1', borderRadius: 3,
                                    padding: '1px 4px', fontSize: '0.72rem', textAlign: 'center',
                                    background: isEditable ? '#fff' : '#f1f5f9',
                                  }}
                                />
                              </Tooltip>
                            )}
                          </td>
                          {weeks.map((w) => (
                            <td key={w.key} style={cellSx}>
                              <EditableCell
                                value={present[w.key] || 0}
                                onChange={(v) => updateFoodPresent(w.key, v)}
                                disabled={!isEditable}
                                placeholder="0"
                              />
                            </td>
                          ))}
                          <td style={cellSx}></td>
                        </tr>
                      </React.Fragment>
                    );
                  }

                  // ─── Labour Wages (EXP003) ───────────────────────
                  if (cat.categoryId === 'EXP003') {
                    sNo++;
                    return (
                      <React.Fragment key={cat.categoryId}>
                        {/* Header row */}
                        <tr style={{ backgroundColor: CATEGORY_BG }}>
                          <td style={{ ...cellSx, textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', borderLeft: `1px solid ${GRID_BORDER}` }}>
                            {sNo}
                          </td>
                          <td style={{ ...cellSx, fontWeight: 700, fontSize: '0.82rem', padding: '8px 12px' }}>
                            Labour Wages (900 Rs per day)
                            {isEditable && isAdmin && (
                              <Tooltip title="Add Labour">
                                <IconButton
                                  size="small"
                                  onClick={() => setAddLabourOpen(true)}
                                  sx={{ ml: 1, color: '#1565C0' }}
                                >
                                  <Plus size={14} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </td>
                          {weeks.map((w) => (
                            <td key={w.key} style={cellSx}></td>
                          ))}
                          <td style={cellSx}>
                            <DisplayCell value={cat.monthlyTotal || 0} isTotalCol bold />
                          </td>
                        </tr>
                        {/* Employee sub-rows */}
                        {cat.employees?.map((emp) => (
                          <tr key={emp.employeeId} style={{ backgroundColor: SUB_ROW_BG }}>
                            <td style={{ ...cellSx, borderLeft: `1px solid ${GRID_BORDER}` }}></td>
                            <td style={{ ...cellSx, padding: '4px 12px 4px 24px', fontSize: '0.8rem', color: '#475569' }}>
                              {emp.employeeName}
                              {isEditable && isAdmin && (
                                <Tooltip title="Remove">
                                  <IconButton
                                    size="small"
                                    onClick={() => removeLabour(emp.employeeId)}
                                    sx={{ ml: 0.5, color: '#ef4444', opacity: 0.6, '&:hover': { opacity: 1 } }}
                                  >
                                    <Trash2 size={12} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </td>
                            {weeks.map((w) => (
                              <td key={w.key} style={cellSx}>
                                <EditableCell
                                  value={emp[w.key] || 0}
                                  onChange={(v) => updateEmployeeWeek(emp.employeeId, w.key, v)}
                                  disabled={!isEditable}
                                />
                              </td>
                            ))}
                            <td style={cellSx}>
                              <DisplayCell value={emp.monthlyTotal} isTotalCol />
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  }

                  // ─── Fuel Expenses (EXP004) ──────────────────────
                  if (cat.categoryId === 'EXP004') {
                    sNo++;
                    return (
                      <React.Fragment key={cat.categoryId}>
                        {/* Header row */}
                        <tr style={{ backgroundColor: CATEGORY_BG }}>
                          <td style={{ ...cellSx, textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', borderLeft: `1px solid ${GRID_BORDER}` }}>
                            {sNo}
                          </td>
                          <td style={{ ...cellSx, fontWeight: 700, fontSize: '0.82rem', padding: '8px 12px' }}>
                            Fuel Expenses
                          </td>
                          {weeks.map((w) => (
                            <td key={w.key} style={cellSx}></td>
                          ))}
                          <td style={cellSx}>
                            <DisplayCell value={cat.monthlyTotal || 0} isTotalCol bold />
                          </td>
                        </tr>
                        {/* Sub-category rows */}
                        {cat.subCategories?.map((sub) => (
                          <tr key={sub.name} style={{ backgroundColor: SUB_ROW_BG }}>
                            <td style={{ ...cellSx, borderLeft: `1px solid ${GRID_BORDER}` }}></td>
                            <td style={{ ...cellSx, padding: '4px 12px 4px 24px', fontSize: '0.8rem', color: '#475569' }}>
                              {sub.name}
                            </td>
                            {weeks.map((w) => (
                              <td key={w.key} style={cellSx}>
                                <EditableCell
                                  value={sub[w.key] || 0}
                                  onChange={(v) => updateSubCategoryWeek(sub.name, w.key, v)}
                                  disabled={!isEditable}
                                />
                              </td>
                            ))}
                            <td style={cellSx}>
                              <DisplayCell value={sub.monthlyTotal} isTotalCol />
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  }

                  // ─── Standard single-row categories ──────────────
                  sNo++;
                  const wa = cat.weeklyAmounts || { week1: 0, week2: 0, week3: 0, week4: 0, week5: 0 };
                  const displayName = cat.categoryId === 'EXP006'
                    ? 'Fastag (Toll Expenses)'
                    : cat.categoryName;

                  return (
                    <tr key={cat.categoryId} style={{ backgroundColor: CATEGORY_BG }}>
                      <td style={{ ...cellSx, textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', borderLeft: `1px solid ${GRID_BORDER}` }}>
                        {sNo}
                      </td>
                      <td style={{ ...cellSx, fontWeight: 700, fontSize: '0.82rem', padding: '8px 12px' }}>
                        {displayName}
                      </td>
                      {weeks.map((w) => (
                        <td key={w.key} style={cellSx}>
                          <EditableCell
                            value={wa[w.key] || 0}
                            onChange={(v) => updateWeeklyAmount(cat.categoryId, w.key, v)}
                            disabled={!isEditable}
                          />
                        </td>
                      ))}
                      <td style={cellSx}>
                        <DisplayCell value={cat.monthlyTotal || 0} isTotalCol bold />
                      </td>
                    </tr>
                  );
                })}

                {/* ─── Weekly Totals Row ────────────────────────────── */}
                <tr style={{ backgroundColor: FOOTER_BG }}>
                  <td
                    colSpan={2}
                    style={{
                      ...cellSx,
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      padding: '10px 12px',
                      color: '#1e293b',
                      borderLeft: `1px solid ${GRID_BORDER}`,
                      letterSpacing: 0.5,
                    }}
                  >
                    TOTAL
                  </td>
                  {weeks.map((w) => (
                    <td key={w.key} style={{ ...cellSx, padding: 0 }}>
                      <Box sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                        px: 1, py: 1, backgroundColor: FOOTER_BG,
                      }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b', fontFamily: '"Inter", monospace' }}>
                          {fmtAmount(weeklyTotals[w.key] || 0)}
                        </Typography>
                      </Box>
                    </td>
                  ))}
                  <td style={{ ...cellSx, padding: 0 }}>
                    <Box sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                      px: 1, py: 1, backgroundColor: TOTAL_COL_BG,
                    }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#7c2d12', fontFamily: '"Inter", monospace' }}>
                        {fmtAmount(grandTotal)}
                      </Typography>
                    </Box>
                  </td>
                </tr>

                {/* ─── Grand Total Row ─────────────────────────────── */}
                <tr style={{ backgroundColor: FOOTER_BG }}>
                  <td
                    colSpan={2 + weeks.length}
                    style={{
                      ...cellSx,
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      padding: '10px 12px',
                      color: '#1565C0',
                      borderLeft: `1px solid ${GRID_BORDER}`,
                    }}
                  >
                    Grand Total
                  </td>
                  <td style={{ ...cellSx, padding: 0 }}>
                    <Box sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      px: 1, py: 1, backgroundColor: TOTAL_COL_BG,
                    }}>
                      <Typography sx={{
                        fontWeight: 900, fontSize: '1rem', color: '#7c2d12',
                        fontFamily: '"Inter", monospace',
                      }}>
                        ₹ {fmtAmount(grandTotal)}
                      </Typography>
                    </Box>
                  </td>
                </tr>
              </tbody>
            </table>
          </Box>
        </Card>
      )}

      {/* ─── Yearly Summary Table (History Tab) ──────────────────────── */}
      {activeTab === 1 && (
        <YearlyExpenseSummary year={selectedYear} />
      )}

      {/* ─── Add Labour Dialog ───────────────────────────────────────── */}
      <Dialog open={addLabourOpen} onClose={() => setAddLabourOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Labour Employee</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Employee Name"
            value={newLabourName}
            onChange={(e) => setNewLabourName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddLabour(); }}
            sx={{ mt: 1 }}
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddLabourOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddLabour}
            disabled={!newLabourName.trim()}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Snackbar ───────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          variant="filled"
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MonthlyExpenseRegisterPage;
