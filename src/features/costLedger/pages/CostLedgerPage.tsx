import { useState, useEffect, useMemo, Fragment } from 'react';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  Tooltip, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Skeleton, Select, MenuItem,
  FormControl, InputLabel, TextField, useTheme, useMediaQuery
} from '@mui/material';
import {
  Search, Plus, Edit, Trash2, RefreshCw, FileSpreadsheet,
  ArrowUpDown, ChevronLeft, ChevronRight, X, Maximize2, Minimize2
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import ExcelJS from 'exceljs';

import {
  fetchCostLedger,
  addCostEntry,
  updateCostEntry,
  deleteCostEntry,
  updateSoldPricePerKg,
} from '../services/costLedger.service';
import { subscribeToLockStatus } from '../../../services/settings.service';
import {
  type CostLedgerEntry,
  type CostLedgerFormData
} from '../types/costLedger.types';
import CostEntryDialog from '../components/CostEntryDialog';
import { useMaterials } from '../../../context/MaterialContext';
import { fetchFinishedGoods } from '../../finishedGoods/services/finishedGoods.service';
import { useAuth } from '../../../context/AuthContext';

// Formatting helpers
const fmtDate = (ts: Timestamp | undefined) => {
  if (!ts) return '—';
  return ts.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtMoney = (val: number | undefined) => {
  if (val === undefined || val === null) return '—';
  return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtQty = (val: number | undefined) => {
  if (val === undefined || val === null) return '—';
  return val.toLocaleString('en-IN');
};

interface Props {
  productionManager?: boolean;
}

const CostLedgerPage = ({ productionManager = false }: Props) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tableMaximized, setTableMaximized] = useState(false);
  const { getByModule, loading: materialsLoading } = useMaterials();
  const costMaterials = getByModule('costLedger');
  const { profile } = useAuth();
  const isAdmin = profile?.role?.toLowerCase() === 'admin';

  // Database state
  const [entries, setEntries] = useState<CostLedgerEntry[]>([]);
  const [approvedHeats, setApprovedHeats] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<CostLedgerEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CostLedgerEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isLocked, setIsLocked] = useState(true);

  // Admin-only inline sold price edit state
  const [editSoldPrice, setEditSoldPrice] = useState<{ id: string; value: string } | null>(null);
  const [savingSoldPrice, setSavingSoldPrice] = useState(false);

  // Filters State
  const [searchHeat, setSearchHeat] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [alloyFilter, setAlloyFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'serialNo', direction: 'desc' });

  // Combine loading states
  const isTableLoading = loading || materialsLoading;

  // Load ledger data
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchCostLedger();
      setEntries(data);
      const fgData = await fetchFinishedGoods();
      const approved = new Set(
        fgData
          .filter((fg) => fg.manuallyApproved === true)
          .map((fg) => fg.heatNo)
      );
      setApprovedHeats(approved);
    } catch (err) {
      console.error("Failed to load cost ledger data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToLockStatus((status) => {
      setIsLocked(status);
    });
    return () => unsubscribe();
  }, []);

  // Compute unique values for dropdown filters
  const uniqueAlloys = useMemo(() => Array.from(new Set(entries.map(e => e.alloyType).filter(Boolean))).sort(), [entries]);
  const uniqueEmployees = useMemo(() => Array.from(new Set(entries.map(e => e.employeeName).filter(Boolean))).sort(), [entries]);
  const uniqueRoles = useMemo(() => Array.from(new Set(entries.map(e => e.role).filter(Boolean))).sort(), [entries]);

  // Apply filters
  const filteredData = useMemo(() => {
    return entries.filter(e => {
      // Heat No search
      if (searchHeat && !e.heatNo.toLowerCase().includes(searchHeat.toLowerCase())) {
        return false;
      }
      // Date filters
      if (startDate || endDate) {
        const eDate = e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date);
        if (startDate && eDate < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (eDate > end) return false;
        }
      }
      // Alloy Type Filter
      if (alloyFilter && e.alloyType !== alloyFilter) {
        return false;
      }
      // Employee Filter
      if (employeeFilter && e.employeeName !== employeeFilter) {
        return false;
      }
      // Role Filter
      if (roleFilter && e.role !== roleFilter) {
        return false;
      }
      return true;
    });
  }, [entries, searchHeat, startDate, endDate, alloyFilter, employeeFilter, roleFilter]);

  // Apply Sorting
  const sortedData = useMemo(() => {
    const dataToSort = [...filteredData];
    if (sortConfig !== null) {
      dataToSort.sort((a, b) => {
        let aVal = (a as any)[sortConfig.key];
        let bVal = (b as any)[sortConfig.key];

        // Format dates correctly for comparison
        if (sortConfig.key === 'date') {
          aVal = a.date instanceof Timestamp ? a.date.seconds : new Date(a.date).getTime();
          bVal = b.date instanceof Timestamp ? b.date.seconds : new Date(b.date).getTime();
        }

        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return dataToSort;
  }, [filteredData, sortConfig]);

  // Apply Pagination
  const paginatedData = useMemo(() => {
    const offset = (currentPage - 1) * pageSize;
    return sortedData.slice(offset, offset + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchHeat, startDate, endDate, alloyFilter, employeeFilter, roleFilter, pageSize]);

  // Handle Header Click for Sorting
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    if (entries.length === 0) {
      return { totalCost: 0, avgMatCostPerKg: 0, avgProdCostPerKg: 0, avgSellPricePerKg: 0 };
    }
    const totalCost = entries.reduce((s, e) => s + (e.totalMaterialCost || 0), 0);
    const totalIngots = entries.reduce((s, e) => s + (e.goodIngotsKg || 0), 0);
    
    const avgMatCostPerKg = totalIngots > 0 ? totalCost / totalIngots : 0;
    
    const totalProdCost = entries.reduce((s, e) => s + (e.totalProductionCost || 0), 0);
    const avgProdCostPerKg = totalIngots > 0 ? totalProdCost / totalIngots : 0;
    
    const totalSellRev = entries.reduce((s, e) => s + ((e.sellingPricePerKg || 0) * (e.goodIngotsKg || 0)), 0);
    const avgSellPricePerKg = totalIngots > 0 ? totalSellRev / totalIngots : 0;

    return { totalCost, avgMatCostPerKg, avgProdCostPerKg, avgSellPricePerKg };
  }, [entries]);

  const totals = useMemo(() => {
    const result = {
      materials: {} as Record<string, { qty: number; amt: number; rateSum: number; rateCount: number }>,
      totalInputKg: 0,
      goodIngotsKg: 0,
      totalMaterialCost: 0,
      totalProductionCost: 0,
      averageEfficiency: 0,
      averageMatCostPerKg: 0,
      averageProductionCostPerKg: 0,
      averageSellingPricePerKg: 0,
      averageSoldPricePerKg: 0,
    };

    let effCount = 0;
    let matCostCount = 0;
    let prodCostCount = 0;
    let sellPriceCount = 0;
    let soldPriceCount = 0;

    filteredData.forEach(row => {
      costMaterials.forEach(f => {
        const mat = row.materials?.find(
          m => m.materialId === f.id || m.materialId === f.materialId || m.materialCode === f.materialCode
        );
        if (mat) {
          const qty = mat.weightKg ?? 0;
          const amt = mat.amount ?? (mat as any).totalCost ?? 0;
          const rate = (mat as any).rate ?? mat.ratePerKg ?? (mat as any).costPerKg ?? 0;
          if (!result.materials[f.id]) {
            result.materials[f.id] = { qty: 0, amt: 0, rateSum: 0, rateCount: 0 };
          }
          result.materials[f.id].qty += qty;
          result.materials[f.id].amt += amt;
          if (rate > 0 || qty > 0) {
            result.materials[f.id].rateSum += rate;
            result.materials[f.id].rateCount++;
          }
        }
      });
      result.totalInputKg += row.totalInputKg || 0;
      result.goodIngotsKg += row.goodIngotsKg || 0;
      result.totalMaterialCost += row.totalMaterialCost || 0;
      result.totalProductionCost += row.totalProductionCost || 0;

      if (row.efficiencyPercentage !== undefined) {
        result.averageEfficiency += row.efficiencyPercentage;
        effCount++;
      }
      if (row.materialCostPerKg !== undefined) {
        result.averageMatCostPerKg += row.materialCostPerKg;
        matCostCount++;
      }
      if (row.totalProductionCostPerKg !== undefined) {
        result.averageProductionCostPerKg += row.totalProductionCostPerKg;
        prodCostCount++;
      }
      if (row.sellingPricePerKg !== undefined) {
        result.averageSellingPricePerKg += row.sellingPricePerKg;
        sellPriceCount++;
      }
      if (row.soldPricePerKg !== undefined) {
        result.averageSoldPricePerKg += row.soldPricePerKg;
        soldPriceCount++;
      }
    });

    if (effCount > 0) result.averageEfficiency /= effCount;
    if (matCostCount > 0) result.averageMatCostPerKg /= matCostCount;
    if (prodCostCount > 0) result.averageProductionCostPerKg /= prodCostCount;
    if (sellPriceCount > 0) result.averageSellingPricePerKg /= sellPriceCount;
    if (soldPriceCount > 0) result.averageSoldPricePerKg /= soldPriceCount;

    return result;
  }, [filteredData, costMaterials]);

  // Open entry modal
  const openAddEntry = () => {
    setEditEntry(null);
    setDialogOpen(true);
  };

  const openEditEntry = (e: CostLedgerEntry) => {
    setEditEntry(e);
    setDialogOpen(true);
  };

  // Save changes
  const handleSave = async (formData: CostLedgerFormData) => {
    if (isLocked && approvedHeats.has(formData.heatNo.trim())) {
      alert(`Heat ${formData.heatNo} is already approved to Finished Goods and cannot be modified.`);
      return;
    }
    if (editEntry) {
      await updateCostEntry(editEntry.id, formData);
    } else {
      const nextSerial = entries.length > 0
        ? Math.max(...entries.map(e => e.serialNo)) + 1
        : 1;
      await addCostEntry(formData, nextSerial);
    }
    await loadData();
  };

  // Delete cost entry
  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (isLocked && approvedHeats.has(deleteTarget.heatNo)) {
      alert(`Heat ${deleteTarget.heatNo} is already approved to Finished Goods and cannot be deleted.`);
      return;
    }
    setDeleting(true);
    try {
      await deleteCostEntry(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  // Admin: save sold price for a row
  const handleSaveSoldPrice = async () => {
    if (!editSoldPrice) return;
    const val = parseFloat(editSoldPrice.value);
    if (isNaN(val) || val < 0) return;
    setSavingSoldPrice(true);
    try {
      await updateSoldPricePerKg(editSoldPrice.id, val);
      setEntries((prev) =>
        prev.map((e) => e.id === editSoldPrice.id ? { ...e, soldPricePerKg: val } : e)
      );
      setEditSoldPrice(null);
    } catch (err) {
      console.error('Failed to save sold price', err);
    } finally {
      setSavingSoldPrice(false);
    }
  };

  // Exports
  const handleExportExcel = async () => {
    if (filteredData.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cost Ledger');

    // Define columns
    const columns: any[] = [
      { header: 'SI No', key: 'serialNo', width: 10 },
      { header: 'Heat No', key: 'heatNo', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Alloy Type', key: 'alloyType', width: 15 },
      { header: 'Employee Name', key: 'employeeName', width: 20 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Notified', key: 'notified', width: 10 }
    ];

    costMaterials.forEach(f => {
      columns.push({ header: f.materialCode, key: `${f.materialCode}_qty`, width: 12 });
      columns.push({ header: `${f.materialCode} Rate (₹)`, key: `${f.materialCode}_rate`, width: 12 });
      columns.push({ header: `${f.materialCode} Amount (₹)`, key: `${f.materialCode}_amt`, width: 15 });
    });

    columns.push(
      { header: 'Total Input (Kg)', key: 'totalInput', width: 15 },
      { header: 'Good Ingots (Kg)', key: 'goodIngots', width: 15 },
      { header: 'Yield %', key: 'efficiency', width: 12 },
      { header: 'Total Material Cost (₹)', key: 'totalMatCost', width: 20 },
      { header: 'Mat Cost/Kg (₹)', key: 'matCostPerKg', width: 15 },
      { header: 'Labor Cost/Kg (₹)', key: 'laborCostPerKg', width: 15 },
      { header: 'Total Prod Cost (₹)', key: 'totalProdCost', width: 20 },
      { header: 'Prod Cost/Kg (₹)', key: 'prodCostPerKg', width: 15 }
    );

    if (!productionManager) {
      columns.push(
        { header: 'Selling Margin %', key: 'margin', width: 15 },
        { header: 'Selling Price/Kg (₹)', key: 'sellingPrice', width: 20 }
      );
      if (isAdmin) {
        columns.push({ header: 'Sold Price/Kg (₹)', key: 'soldPrice', width: 20 });
      }
    }

    worksheet.columns = columns;

    // Apply header styles
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFADD8E6' } // Light blue
      };
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Add data rows
    filteredData.forEach((row, idx) => {
      const rowData: any = {
        serialNo: idx + 1,
        heatNo: row.heatNo,
        date: row.date instanceof Timestamp ? row.date.toDate().toLocaleDateString('en-IN') : String(row.date),
        alloyType: row.alloyType,
        employeeName: row.employeeName || '—',
        role: row.role || '—',
        notified: row.notified ? 'Yes' : 'No',
      };

      costMaterials.forEach(f => {
        const mat = row.materials?.find(
          m => m.materialId === f.id || m.materialId === f.materialId || m.materialCode === f.materialCode
        );
        rowData[`${f.materialCode}_qty`] = mat ? (mat.weightKg ?? 0) : 0;
        rowData[`${f.materialCode}_rate`] = mat ? (mat.ratePerKg ?? (mat as any).costPerKg ?? (mat as any).rate ?? 0) : 0;
        rowData[`${f.materialCode}_amt`] = mat ? (mat.amount ?? (mat as any).totalCost ?? 0) : 0;
      });

      rowData.totalInput = row.totalInputKg || 0;
      rowData.goodIngots = row.goodIngotsKg || 0;
      rowData.efficiency = row.efficiencyPercentage || 0;
      rowData.totalMatCost = row.totalMaterialCost || 0;
      rowData.matCostPerKg = row.materialCostPerKg || 0;
      rowData.laborCostPerKg = row.laborCostPerKg || 0;
      rowData.totalProdCost = row.totalProductionCost || 0;
      rowData.prodCostPerKg = row.totalProductionCostPerKg || 0;

      if (!productionManager) {
        rowData.margin = row.marginPercentage || 0;
        rowData.sellingPrice = row.sellingPricePerKg || 0;
        if (isAdmin) {
          rowData.soldPrice = row.soldPricePerKg !== undefined ? row.soldPricePerKg : '';
        }
      }

      worksheet.addRow(rowData);
    });

    // Add Total Row
    const totalRowData: any = {
      serialNo: 'Total',
      totalInput: totals.totalInputKg,
      goodIngots: totals.goodIngotsKg,
      efficiency: totals.averageEfficiency,
      totalMatCost: totals.totalMaterialCost,
      matCostPerKg: totals.averageMatCostPerKg,
      laborCostPerKg: '',
      totalProdCost: totals.totalProductionCost,
      prodCostPerKg: totals.averageProductionCostPerKg,
    };

    costMaterials.forEach(f => {
      const t = totals.materials[f.id] || { qty: 0, amt: 0, rateSum: 0, rateCount: 0 };
      const avgRate = t.rateCount > 0 ? t.rateSum / t.rateCount : 0;
      totalRowData[`${f.materialCode}_qty`] = t.qty;
      totalRowData[`${f.materialCode}_rate`] = avgRate;
      totalRowData[`${f.materialCode}_amt`] = t.amt;
    });

    if (!productionManager) {
      totalRowData.margin = '';
      totalRowData.sellingPrice = totals.averageSellingPricePerKg;
      if (isAdmin) {
        totalRowData.soldPrice = totals.averageSoldPricePerKg;
      }
    }

    const totalRow = worksheet.addRow(totalRowData);

    // Style Total Row
    totalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' } // Yellow
      };
      if (colNumber > 6) {
        cell.alignment = { horizontal: 'right' };
      }
    });

    // Generate filename based on date range
    let minDate: Date | null = null;
    let maxDate: Date | null = null;
    filteredData.forEach(row => {
      const d = row.date instanceof Timestamp ? row.date.toDate() : (row.date ? new Date(row.date) : null);
      if (d) {
        if (!minDate || d < minDate) minDate = d;
        if (!maxDate || d > maxDate) maxDate = d;
      }
    });
    const formatDateForFile = (d: Date | null) => {
      if (!d) return '';
      return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
    };
    const dateRangeStr = (minDate && maxDate) 
      ? ` (${formatDateForFile(minDate)} to ${formatDateForFile(maxDate)})` 
      : '';
    const fileName = `Cost Ledger${dateRangeStr}.xlsx`;

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <Box className="space-y-6 text-slate-800 antialiased">
      {/* ── Page Header ── */}
      <Box className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Typography className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Cost Ledger
          </Typography>
          <Typography className="text-sm text-slate-500 font-medium mt-1">
            Material Cost Analysis and Production Cost Tracking
          </Typography>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Tooltip title="Refresh Ledger">
              <IconButton onClick={loadData} disabled={loading} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg p-2.5">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </IconButton>
            </Tooltip>
          </div>
          <Button
            onClick={handleExportExcel}
            variant="outlined"
            startIcon={<FileSpreadsheet size={16} />}
            className="text-emerald-700 border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-200 font-semibold px-4 rounded-lg h-10 text-xs w-full sm:w-auto"
          >
            Export Excel
          </Button>
          <Button
            onClick={openAddEntry}
            variant="contained"
            startIcon={<Plus size={16} />}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 rounded-lg h-10 text-xs shadow-md shadow-blue-500/20 w-full sm:w-auto"
          >
            Add Cost Entry
          </Button>
        </div>
      </Box>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Material Cost', value: fmtMoney(kpis.totalCost), desc: 'Aggregated scrap metal cost', color: 'text-amber-600', border: 'border-amber-100', bg: 'bg-amber-50/35' },
          { label: 'Avg Mat Cost / Kg', value: `${fmtMoney(kpis.avgMatCostPerKg)}/Kg`, desc: 'Average metal cost per Ingot Kg', color: 'text-orange-600', border: 'border-orange-100', bg: 'bg-orange-50/35' },
          { label: 'Avg Prod Cost / Kg', value: `${fmtMoney(kpis.avgProdCostPerKg)}/Kg`, desc: 'Average operational cost per Kg', color: 'text-blue-600', border: 'border-blue-100', bg: 'bg-blue-50/35' },
          ...(!productionManager ? [{ label: 'Avg Sell Price / Kg', value: `${fmtMoney(kpis.avgSellPricePerKg)}/Kg`, desc: 'Average selling price per Kg', color: 'text-emerald-600', border: 'border-emerald-100', bg: 'bg-emerald-50/35' }] : []),
        ].map((kpi, idx) => (
          <Card key={idx} className={`border ${kpi.border} ${kpi.bg} shadow-sm rounded-xl`}>
            <CardContent className="p-5">
              <Typography className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</Typography>
              <Typography className={`text-2xl font-black ${kpi.color} mt-1.5 tracking-tight`}>{kpi.value}</Typography>
              <Typography className="text-xs text-slate-500 mt-1">{kpi.desc}</Typography>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filtering Toolbar ── */}
      <Card className="border border-slate-200 shadow-sm rounded-xl bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Search size={14} className="text-slate-400" /> Filter & Search Registry
              </span>
              {(searchHeat || startDate || endDate || alloyFilter || employeeFilter || roleFilter) && (
                <button
                  onClick={() => {
                    setSearchHeat('');
                    setStartDate('');
                    setEndDate('');
                    setAlloyFilter('');
                    setEmployeeFilter('');
                    setRoleFilter('');
                  }}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Heat Number Search */}
              <TextField
                label="Search Heat Number"
                placeholder="e.g. H-2026-001"
                size="small"
                value={searchHeat}
                onChange={(e) => setSearchHeat(e.target.value)}
                fullWidth
              />

              {/* Start Date */}
              <TextField
                label="Start Date"
                type="date"
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    style: { background: 'white' },
                    onClick: (e) => {
                      try {
                        (e.target as any).showPicker?.();
                      } catch (err) {}
                    }
                  }
                }}
              />

              {/* End Date */}
              <TextField
                label="End Date"
                type="date"
                size="small"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    style: { background: 'white' },
                    onClick: (e) => {
                      try {
                        (e.target as any).showPicker?.();
                      } catch (err) {}
                    }
                  }
                }}
              />

              {/* Alloy Type Dropdown */}
              <FormControl size="small" fullWidth>
                <InputLabel>Alloy Type</InputLabel>
                <Select
                  value={alloyFilter}
                  label="Alloy Type"
                  onChange={(e) => setAlloyFilter(e.target.value)}
                >
                  <MenuItem value=""><em>All Alloys</em></MenuItem>
                  {uniqueAlloys.map(alloy => (
                    <MenuItem key={alloy} value={alloy}>{alloy}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Employee Dropdown */}
              <FormControl size="small" fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={employeeFilter}
                  label="Employee"
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                >
                  <MenuItem value=""><em>All Employees</em></MenuItem>
                  {uniqueEmployees.map(emp => (
                    <MenuItem key={emp} value={emp}>{emp}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Role Dropdown */}
              <FormControl size="small" fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value=""><em>All Roles</em></MenuItem>
                  {uniqueRoles.map(role => (
                    <MenuItem key={role} value={role}>{role}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>
        </CardContent>
      </Card>

      {tableMaximized && (
        <div
          onClick={() => setTableMaximized(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1290,
          }}
        />
      )}

      {/* ── Main Spreadsheet Table ── */}
      <style>{`
        .cost-grid-table th,
        .cost-grid-table td {
          border-bottom: 1px solid ${isDark ? '#4a5568' : '#cbd5e1'} !important;
          border-right: 1px solid ${isDark ? '#4a5568' : '#cbd5e1'} !important;
        }
        .cost-grid-table th:last-child,
        .cost-grid-table td:last-child {
          border-right: none !important;
        }
      `}</style>
      <div 
        className="border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden"
        style={tableMaximized ? {
          position: 'fixed',
          top: '5vh',
          left: '5vw',
          width: '90vw',
          height: '90vh',
          zIndex: 1300,
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          backgroundColor: isDark ? '#161b27' : '#fff',
          borderColor: isDark ? '#2d3748' : '#e2e8f0',
        } : {
          backgroundColor: isDark ? '#161b27' : '#fff',
          borderColor: isDark ? '#2d3748' : '#e2e8f0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: isDark ? '1px solid #2d3748' : '1px solid #e2e8f0', backgroundColor: isDark ? '#1a2130' : '#f8fafc' }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {tableMaximized ? 'Cost Ledger Spreadsheet (Expanded View)' : 'Cost Ledger Spreadsheet'}
          </Typography>
          <Tooltip title={tableMaximized ? "Close / Minimize" : "Maximize Table"}>
            <IconButton size="small" onClick={() => setTableMaximized(!tableMaximized)} sx={{ color: 'text.secondary' }}>
              {tableMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </IconButton>
          </Tooltip>
        </div>
        <div 
          className="overflow-x-auto w-full scrollbar-thin"
          style={{ maxHeight: tableMaximized ? 'calc(90vh - 55px)' : '600px' }}
        >
          <table className="min-w-full divide-y divide-slate-200 border-collapse text-left cost-grid-table">
            <thead className="bg-slate-100 sticky top-0 z-30 shadow-sm text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              {/* Header row 1: Section Labels */}
              <tr>
                <th className="px-3 py-2 text-center border-b border-r border-slate-200 sticky left-0 z-40 bg-slate-100 w-12"></th>
                <th className="px-4 py-2 text-center border-b border-r border-slate-200 sticky left-12 z-40 bg-slate-100 w-28"></th>
                <th colSpan={3} className="px-4 py-1.5 text-center border-b border-r border-slate-200 bg-slate-100/80 font-extrabold text-slate-600">
                  General Info
                </th>
                {costMaterials.map(f => (
                  <th key={f.id} colSpan={3} className="px-4 py-1.5 text-center border-b border-r border-slate-200 bg-blue-50/50 text-blue-900 font-extrabold tracking-normal">
                    {f.materialCode}
                  </th>
                ))}
                <th colSpan={3} className="px-4 py-1.5 text-center border-b border-r border-slate-200 bg-emerald-50 text-emerald-950 font-extrabold">
                  Production Section
                </th>
                <th colSpan={productionManager ? 5 : (isAdmin ? 8 : 7)} className="px-4 py-1.5 text-center border-b border-r border-slate-200 bg-amber-50 text-amber-950 font-extrabold">
                  Cost Analysis Section
                </th>
                <th className="px-4 py-2 text-center border-b border-slate-200 bg-slate-100 z-30 w-24"></th>
              </tr>

              {/* Header row 2: Field Names */}
              <tr>
                <th
                  onClick={() => requestSort('serialNo')}
                  className="px-3 py-2 text-center border-b border-r border-slate-200 sticky left-0 z-40 bg-slate-100 w-12 cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    SI NO <ArrowUpDown size={10} />
                  </div>
                </th>
                <th
                  onClick={() => requestSort('heatNo')}
                  className="px-4 py-2 text-left border-b border-r border-slate-200 sticky left-12 z-40 bg-slate-100 w-28 cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    HEAT NO <ArrowUpDown size={10} />
                  </div>
                </th>

                {/* General columns */}
                <th onClick={() => requestSort('date')} className="px-4 py-2 border-b border-r border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors w-28">
                  <div className="flex items-center gap-1">Date <ArrowUpDown size={10} /></div>
                </th>
                <th onClick={() => requestSort('alloyType')} className="px-4 py-2 border-b border-r border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors w-28">
                  <div className="flex items-center gap-1">Alloy <ArrowUpDown size={10} /></div>
                </th>
                <th onClick={() => requestSort('employeeName')} className="px-4 py-2 border-b border-r border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors w-36">
                  <div className="flex items-center gap-1">Employee <ArrowUpDown size={10} /></div>
                </th>

                {/* Materials loops */}
                {costMaterials.map(f => (
                  <Fragment key={f.id}>
                    <th className="px-3 py-2 text-right border-b border-slate-200 bg-blue-50/20 font-bold w-20 text-[9px]">Qty (Kg)</th>
                    <th className="px-3 py-2 text-right border-b border-slate-200 bg-blue-50/20 font-bold w-20 text-[9px]">Rate (₹)</th>
                    <th className="px-3 py-2 text-right border-b border-r border-slate-200 bg-blue-50/20 font-bold w-24 text-[9px]">Amount (₹)</th>
                  </Fragment>
                ))}

                {/* Production totals */}
                <th className="px-4 py-2 border-b border-slate-200 bg-emerald-50/30 text-right w-24">Total Input</th>
                <th className="px-4 py-2 border-b border-slate-200 bg-emerald-50/30 text-right w-24">Good Output</th>
                <th className="px-4 py-2 border-b border-r border-slate-200 bg-emerald-50/30 text-right w-24">Yield %</th>

                {/* Cost Analysis */}
                <th className="px-4 py-2 border-b border-slate-200 bg-amber-50/30 text-right w-28">Material Cost</th>
                <th className="px-4 py-2 border-b border-slate-200 bg-amber-50/30 text-right w-24">Mat Cost/Kg</th>
                <th className="px-4 py-2 border-b border-slate-200 bg-amber-50/30 text-right w-24">Labor Cost/Kg</th>
                <th className="px-4 py-2 border-b border-slate-200 bg-amber-50/30 text-right w-28">Total Prod Cost</th>
                <th className={`px-4 py-2 border-b border-slate-200 bg-amber-50/30 text-right w-28 ${productionManager ? 'border-r' : ''}`}>Production Cost/Kg</th>
                {!productionManager && (
                  <>
                    <th className="px-4 py-2 border-b border-slate-200 bg-amber-50/30 text-right w-20">Margin %</th>
                    <th className={`px-4 py-2 border-b border-slate-200 bg-amber-50/30 text-right w-28 ${isAdmin ? '' : 'border-r'}`}>Sell Price/Kg</th>
                  </>
                )}
                {!productionManager && isAdmin && (
                  <th className="px-4 py-2 border-b border-r border-slate-200 bg-purple-50/50 text-right w-32 text-purple-800">
                    <span className="flex items-center justify-end gap-1">
                      Sold Price/Kg
                      <span className="text-[8px] bg-purple-200 text-purple-800 px-1 rounded font-bold">ADMIN</span>
                    </span>
                  </th>
                )}

                {/* Actions (Edit / Delete) */}
                <th className="px-4 py-2 border-b border-slate-200 text-center w-24 sticky right-0 bg-slate-100 shadow-[left_2px_0_4px_rgba(0,0,0,0.05)]">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-slate-200 text-xs">
              {isTableLoading ? (
                // Skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 sticky left-0 bg-white border-r border-slate-200 text-center"><Skeleton width={16} /></td>
                    <td className="px-3 py-2.5 sticky left-12 bg-white border-r border-slate-200 text-center"><Skeleton width={20} /></td>
                    <td className="px-4 py-2.5 sticky left-24 bg-white border-r border-slate-200 font-bold"><Skeleton width={60} /></td>
                    {Array.from({ length: 3 + (costMaterials.length * 3) + 3 + 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-2.5 border-r border-slate-100"><Skeleton width={40} /></td>
                    ))}
                    <td className="px-4 py-2.5 sticky right-0 bg-white text-center"><Skeleton width={50} /></td>
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={5 + (costMaterials.length * 3) + 3 + 6 + 1} className="px-4 py-12 text-center text-slate-400 font-medium bg-slate-50">
                    {searchHeat || alloyFilter || employeeFilter || startDate || endDate
                      ? "No records match the active search filters."
                      : "No cost entries recorded yet. Click 'Add Cost Entry' to get started."}
                  </td>
                </tr>
              ) : (
                // Ledger Records
                paginatedData.map((row, index) => {
                  const isEven = index % 2 === 0;
                  const rowBg = isEven
                    ? 'bg-white'
                    : 'bg-slate-50/30';

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-blue-50/20 transition-colors group ${rowBg}`}
                    >
                      {/* SI No */}
                      <td className={`px-3 py-2 text-center border-r border-slate-200 sticky left-0 z-20 font-mono text-slate-500 font-bold ${isEven ? 'bg-white' : 'bg-slate-50/70'} group-hover:bg-blue-50`}>
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* Heat No */}
                      <td className={`px-4 py-2 border-r border-slate-200 sticky left-12 z-20 font-bold text-blue-700 ${isEven ? 'bg-white' : 'bg-slate-50/70'} group-hover:bg-blue-50`}>
                        {row.heatNo}
                      </td>

                      {/* General Values */}
                      <td className="px-4 py-2 border-r border-slate-100 whitespace-nowrap">{fmtDate(row.date)}</td>
                      <td className="px-4 py-2 border-r border-slate-100">
                        <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          {row.alloyType}
                        </span>
                      </td>
                      <td className="px-4 py-2 border-r border-slate-100 whitespace-nowrap font-medium text-slate-700">{row.employeeName || '—'}</td>

                      {/* Materials Loops */}
                      {costMaterials.map(f => {
                        const mat = row.materials?.find(
                          m => m.materialId === f.id || m.materialId === f.materialId || m.materialCode === f.materialCode
                        );
                        const qty = mat ? (mat.weightKg ?? 0) : 0;
                        const rate = mat ? ((mat as any).rate ?? mat.ratePerKg ?? (mat as any).costPerKg ?? 0) : 0;
                        const amt = mat ? (mat.amount ?? (mat as any).totalCost ?? 0) : 0;

                        return (
                          <Fragment key={f.id}>
                            <td className="px-3 py-2 text-right border-slate-100 bg-slate-50/5 font-mono text-slate-600">{qty > 0 ? fmtQty(qty) : <span className="text-slate-300">—</span>}</td>
                            <td className="px-3 py-2 text-right border-slate-100 bg-slate-50/5 font-mono text-slate-500">{qty > 0 ? fmtMoney(rate) : <span className="text-slate-300">—</span>}</td>
                            <td className="px-3 py-2 text-right border-r border-slate-100 bg-blue-50/5 font-mono font-semibold text-slate-700">{qty > 0 ? fmtMoney(amt) : <span className="text-slate-300">—</span>}</td>
                          </Fragment>
                        );
                      })}

                      {/* Production Section */}
                      <td className="px-4 py-2 bg-emerald-50/5 font-mono text-right font-semibold text-slate-700">{fmtQty(row.totalInputKg)}</td>
                      <td className="px-4 py-2 bg-emerald-50/5 font-mono text-right font-bold text-emerald-800">{fmtQty(row.goodIngotsKg)}</td>
                      <td className="px-4 py-2 bg-emerald-50/5 border-r border-slate-200 font-mono text-right">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${row.efficiencyPercentage >= 90 ? 'bg-emerald-100 text-emerald-800' :
                          row.efficiencyPercentage >= 75 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                          {row.efficiencyPercentage.toFixed(2)}%
                        </span>
                      </td>

                      {/* Cost Analysis Section */}
                      <td className="px-4 py-2 bg-amber-50/5 font-mono text-right font-bold text-amber-700">{fmtMoney(row.totalMaterialCost)}</td>
                      <td className="px-4 py-2 bg-amber-50/5 font-mono text-right font-semibold text-slate-700">{fmtMoney(row.materialCostPerKg)}</td>
                      <td className="px-4 py-2 bg-amber-50/5 font-mono text-right font-semibold text-slate-700">{fmtMoney(row.laborCostPerKg)}</td>
                      <td className="px-4 py-2 bg-amber-50/5 font-mono text-right font-bold text-slate-700">{fmtMoney(row.totalProductionCost)}</td>
                      <td className={`px-4 py-2 bg-amber-50/5 font-mono text-right font-bold text-amber-850 ${productionManager ? 'border-r' : ''}`}>{fmtMoney(row.totalProductionCostPerKg)}</td>

                      {!productionManager && (
                        <>
                          <td className="px-4 py-2 bg-amber-50/5 font-mono text-right font-semibold text-slate-600">{row.marginPercentage}%</td>
                          <td className={`px-4 py-2 bg-amber-50/5 font-mono text-right font-black text-emerald-800 ${isAdmin ? '' : 'border-r border-slate-200'}`}>
                            {fmtMoney(row.sellingPricePerKg)}
                          </td>
                        </>
                      )}

                      {/* Admin-only: Sold Price per Kg inline edit */}
                      {!productionManager && isAdmin && (
                        <td className="px-3 py-1.5 bg-purple-50/20 border-r border-slate-200 text-right w-32">
                          {editSoldPrice?.id === row.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-[10px] text-slate-400 font-semibold">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                autoFocus
                                value={editSoldPrice.value}
                                onChange={(e) => setEditSoldPrice({ id: row.id, value: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveSoldPrice();
                                  if (e.key === 'Escape') setEditSoldPrice(null);
                                }}
                                className="w-20 px-1.5 py-0.5 text-right text-xs bg-white border border-purple-400 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                              />
                              <button
                                onClick={handleSaveSoldPrice}
                                disabled={savingSoldPrice}
                                className="text-emerald-600 hover:text-emerald-800 p-0.5"
                                title="Save"
                              >
                                {savingSoldPrice ? <span className="text-[9px]">...</span> : '✓'}
                              </button>
                              <button
                                onClick={() => setEditSoldPrice(null)}
                                className="text-slate-400 hover:text-slate-600 p-0.5"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5 group/sold">
                              <span className="font-mono font-bold text-purple-800">
                                {row.soldPricePerKg !== undefined ? fmtMoney(row.soldPricePerKg) : <span className="text-slate-300 font-normal">—</span>}
                              </span>
                              <Tooltip title="Set Sold Price per Kg (Admin)">
                                <button
                                  onClick={() => setEditSoldPrice({ id: row.id, value: row.soldPricePerKg !== undefined ? String(row.soldPricePerKg) : '' })}
                                  className="opacity-0 group-hover/sold:opacity-100 transition-opacity text-purple-400 hover:text-purple-700 p-0.5"
                                >
                                  <Edit size={11} />
                                </button>
                              </Tooltip>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Actions */}
                      <td className="px-4 py-2 text-center sticky right-0 bg-slate-50 border-l border-slate-200 flex items-center justify-center gap-1.5 shadow-[left_2px_0_4px_rgba(0,0,0,0.03)] h-[41px] min-h-[41px] w-24">
                        {isLocked && approvedHeats.has(row.heatNo) ? (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                            Locked
                          </span>
                        ) : (
                          <>
                            <Tooltip title="Edit Cost Entry">
                              <IconButton size="small" onClick={() => openEditEntry(row)} className="text-blue-600 hover:bg-blue-50 p-1">
                                <Edit size={14} />
                              </IconButton>
                            </Tooltip>
                            {!productionManager && (
                              <Tooltip title="Delete Cost Entry">
                                <IconButton size="small" onClick={() => setDeleteTarget(row)} className="text-red-500 hover:bg-red-50 p-1">
                                  <Trash2 size={14} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {!isTableLoading && filteredData.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 sticky bottom-0 z-20 border-t-2 border-slate-300">
                  <td colSpan={5} className="px-4 py-2 text-right font-bold text-slate-700 border-r border-slate-200">
                    Total
                  </td>
                  {costMaterials.map((f) => {
                    const t = totals.materials[f.id] || { qty: 0, amt: 0, rateSum: 0, rateCount: 0 };
                    const avgRate = t.rateCount > 0 ? t.rateSum / t.rateCount : 0;
                    return (
                      <Fragment key={f.id}>
                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-700 bg-slate-100">{t.qty > 0 ? fmtQty(t.qty) : <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-2 text-right font-mono bg-slate-100 border-r border-slate-200 font-bold text-slate-600">{avgRate > 0 ? fmtMoney(avgRate) : <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-blue-800 bg-blue-50/50 border-r border-slate-200">{t.amt > 0 ? fmtMoney(t.amt) : <span className="text-slate-300">—</span>}</td>
                      </Fragment>
                    );
                  })}
                  <td className="px-4 py-2 font-mono text-right font-bold text-slate-800 bg-emerald-50/30">{fmtQty(totals.totalInputKg)}</td>
                  <td className="px-4 py-2 font-mono text-right font-bold text-emerald-800 bg-emerald-50/30">{fmtQty(totals.goodIngotsKg)}</td>
                  <td className="px-4 py-2 font-mono text-right border-r border-slate-200 bg-emerald-50/30 font-bold text-emerald-700">{totals.averageEfficiency > 0 ? `${totals.averageEfficiency.toFixed(2)}%` : <span className="text-slate-300">—</span>}</td>

                  <td className="px-4 py-2 font-mono text-right font-bold text-amber-800 bg-amber-50/30">{fmtMoney(totals.totalMaterialCost)}</td>
                  <td className="px-4 py-2 font-mono text-right bg-amber-50/30 font-bold text-slate-700">{totals.averageMatCostPerKg > 0 ? fmtMoney(totals.averageMatCostPerKg) : <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-2 font-mono text-right bg-amber-50/30"></td>
                  <td className="px-4 py-2 font-mono text-right font-bold text-slate-800 bg-amber-50/30">{fmtMoney(totals.totalProductionCost)}</td>
                  <td className={`px-4 py-2 font-mono text-right bg-amber-50/30 font-bold text-amber-850 ${productionManager ? 'border-r border-slate-200' : ''}`}>{totals.averageProductionCostPerKg > 0 ? fmtMoney(totals.averageProductionCostPerKg) : <span className="text-slate-300">—</span>}</td>

                  {!productionManager && (
                    <>
                      <td className="px-4 py-2 font-mono text-right bg-amber-50/30"></td>
                      <td className={`px-4 py-2 font-mono text-right bg-amber-50/30 font-bold text-emerald-800 ${isAdmin ? '' : 'border-r border-slate-200'}`}>{totals.averageSellingPricePerKg > 0 ? fmtMoney(totals.averageSellingPricePerKg) : <span className="text-slate-300">—</span>}</td>
                    </>
                  )}
                  {!productionManager && isAdmin && (
                    <td className="px-3 py-1.5 bg-purple-50/20 border-r border-slate-200 font-mono text-right font-bold text-purple-800">{totals.averageSoldPricePerKg > 0 ? fmtMoney(totals.averageSoldPricePerKg) : <span className="text-slate-300">—</span>}</td>
                  )}
                  <td className="px-4 py-2 bg-slate-50 border-l border-slate-200 sticky right-0"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ── Table Footer (Pagination) ── */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {[10, 25, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>records</span>
            </div>
            <span>|</span>
            <span>Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} records</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="p-1.5 border border-slate-300 rounded bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-600 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              const isCurrent = p === currentPage;
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  disabled={loading}
                  className={`px-3 py-1.5 border rounded transition-colors ${isCurrent
                    ? 'bg-blue-600 border-blue-600 text-white font-bold'
                    : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-600'
                    }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || loading}
              className="p-1.5 border border-slate-300 rounded bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-600 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Dialog Form ── */}
      <CostEntryDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditEntry(null); }}
        onSave={handleSave}
        editEntry={editEntry}
        productionManager={productionManager}
        existingCostLedgerEntries={entries}
      />

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog 
        open={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        maxWidth="xs" 
        fullWidth
        fullScreen={isMobile}
        slotProps={{ paper: { className: isMobile ? "text-slate-800 m-0 w-full h-full" : "rounded-xl text-slate-800" } }}
      >
        <DialogTitle className="font-bold text-lg pb-1.5 flex items-center gap-1.5">
          <X className="text-red-500" size={20} /> Delete Cost Entry
        </DialogTitle>
        <DialogContent>
          <Typography className="text-sm text-slate-600">
            Are you sure you want to delete the Cost Ledger record for heat{' '}
            <strong className="text-slate-800">{deleteTarget?.heatNo}</strong>? This will permanently delete the entry from the registry and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions className="px-6 pb-4 pt-1 gap-2">
          <Button onClick={() => setDeleteTarget(null)} variant="outlined" className="text-slate-600 border-slate-300 hover:bg-slate-100 rounded-lg px-4" disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDelete} variant="contained" className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-5 font-semibold" disabled={deleting}>
            {deleting ? <CircularProgress size={16} className="text-white" /> : 'Delete Record'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CostLedgerPage;
