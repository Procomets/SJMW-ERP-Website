import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip, Alert, MenuItem, Select, FormControl, InputLabel, InputAdornment
} from '@mui/material';
import { CheckCircle, Eye, AlertCircle, RefreshCw, Search, Filter, Edit, Trash2, X } from 'lucide-react';
import { fetchQualityControlEntries, approveQualityControl, deleteQualityControlEntry } from '../../qualityControl/services/qualityControl.service';
import type { QualityControlEntry } from '../../qualityControl/types/qualityControl.types';
import EditQCDialog from '../../qualityControl/components/EditQCDialog';
import { fetchFinishedGoods } from '../../finishedGoods/services/finishedGoods.service';
import { useAuth } from '../../../context/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { subscribeToLockStatus } from '../../../services/settings.service';

const PMQualityControlPage = () => {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<QualityControlEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [selectedQC, setSelectedQC] = useState<QualityControlEntry | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QualityControlEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [approvedHeats, setApprovedHeats] = useState<Set<string>>(new Set());
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isLocked, setIsLocked] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchQualityControlEntries();
      setEntries(data);
      const fgData = await fetchFinishedGoods();
      const approved = new Set(
        fgData
          .filter((fg) => fg.manuallyApproved === true)
          .map((fg) => fg.heatNo)
      );
      setApprovedHeats(approved);
    } catch (err) {
      console.error(err);
      setError('Failed to load quality control records.');
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

  const handleView = (qc: QualityControlEntry) => {
    setSelectedQC(qc);
    setViewDialogOpen(true);
  };

  const handleEdit = (qc: QualityControlEntry) => {
    setSelectedQC(qc);
    setEditDialogOpen(true);
  };

  const handleOpenApprove = (qc: QualityControlEntry) => {
    setSelectedQC(qc);
    setRemarks('');
    setApproveDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedQC || !profile) return;
    setProcessing(true);
    try {
      await approveQualityControl(selectedQC.id, profile.name, remarks);
      setApproveDialogOpen(false);
      setSelectedQC(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to approve Quality Control record.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteQualityControlEntry(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete QC record.');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    if (ts instanceof Timestamp) return ts.toDate().toLocaleDateString('en-IN');
    return new Date(ts).toLocaleDateString('en-IN');
  };

  const totalRecords = entries.length;
  const pendingRecords = entries.filter(e => e.supervisorSubmitted && !e.verified).length;
  const approvedRecords = entries.filter(e => e.verified).length;

  const filteredEntries = entries.filter((row) => {
    const searchMatch = !searchTerm || 
      row.heatNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.alloyType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.supervisorName?.toLowerCase().includes(searchTerm.toLowerCase());

    let statusMatch = true;
    if (statusFilter === 'Approved') {
      statusMatch = !!row.verified;
    } else if (statusFilter === 'Pending') {
      statusMatch = row.supervisorSubmitted && !row.verified;
    } else if (statusFilter === 'Draft') {
      statusMatch = !row.supervisorSubmitted;
    }

    let dateMatch = true;
    if (startDate || endDate) {
      const rowDateObj = row.date instanceof Timestamp ? row.date.toDate() : new Date(row.date);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (rowDateObj < start) dateMatch = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (rowDateObj > end) dateMatch = false;
      }
    }

    return searchMatch && statusMatch && dateMatch;
  });

  return (
    <Box className="space-y-6 text-slate-800 antialiased p-4 md:p-6">
      {/* Header */}
      <Box className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Typography className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Quality Control
          </Typography>
          <Typography className="text-sm text-slate-500 font-medium mt-1">
            Review and approve quality control records
          </Typography>
        </div>
        <Button
          onClick={loadData}
          disabled={loading}
          variant="outlined"
          startIcon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
          className="text-slate-700 border-slate-200 bg-white hover:bg-slate-50"
        >
          Refresh Data
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-blue-100 bg-blue-50/35 shadow-sm rounded-xl">
          <CardContent className="p-5">
            <Typography className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Records</Typography>
            <Typography className="text-2xl font-black text-blue-600 mt-1.5">{totalRecords}</Typography>
          </CardContent>
        </Card>
        <Card className="border border-amber-100 bg-amber-50/35 shadow-sm rounded-xl">
          <CardContent className="p-5">
            <Typography className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Approval</Typography>
            <Typography className="text-2xl font-black text-amber-600 mt-1.5">{pendingRecords}</Typography>
          </CardContent>
        </Card>
        <Card className="border border-emerald-100 bg-emerald-50/35 shadow-sm rounded-xl">
          <CardContent className="p-5">
            <Typography className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Approved Records</Typography>
            <Typography className="text-2xl font-black text-emerald-600 mt-1.5">{approvedRecords}</Typography>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-slate-200 shadow-sm rounded-xl">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center">
          <TextField
            size="small"
            placeholder="Search Heat No, Alloy, Supervisor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-1/3 bg-white"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} className="text-slate-400" />
                  </InputAdornment>
                ),
              }
            }}
          />
          <TextField
            type="date"
            size="small"
            label="Start Date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-1/6 bg-white"
          />
          <TextField
            type="date"
            size="small"
            label="End Date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full sm:w-1/6 bg-white"
          />
          <FormControl size="small" className="w-full sm:w-1/4 bg-white">
            <InputLabel id="status-filter-label" className="flex items-center gap-1">
              <Filter size={14} /> Status
            </InputLabel>
            <Select
              labelId="status-filter-label"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="All">All Records</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Draft">Draft</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Table */}
      <TableContainer component={Paper} className="shadow-sm border border-slate-200 rounded-xl">
        <Table>
          <TableHead className="bg-slate-50">
            <TableRow>
              <TableCell className="font-bold text-slate-600">Date</TableCell>
              <TableCell className="font-bold text-slate-600">Heat No</TableCell>
              <TableCell className="font-bold text-slate-600">Alloy</TableCell>
              <TableCell className="font-bold text-slate-600">Supervisor</TableCell>
              <TableCell className="font-bold text-slate-600">QC Status</TableCell>
              <TableCell className="font-bold text-slate-600">Approval Status</TableCell>
              <TableCell className="font-bold text-slate-600 text-center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : filteredEntries.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">No QC records found matching filters.</TableCell></TableRow>
            ) : (
              filteredEntries.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell className="font-bold text-blue-700">{row.heatNo}</TableCell>
                  <TableCell><Chip label={row.alloyType} size="small" className="bg-blue-50 text-blue-800 font-bold" /></TableCell>
                  <TableCell>{row.supervisorName}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.overallStatus || 'PENDING'} 
                      size="small" 
                      color={row.overallStatus === 'PASS' ? 'success' : row.overallStatus === 'FAIL' ? 'error' : 'default'} 
                    />
                  </TableCell>
                  <TableCell>
                    {row.verified ? (
                      <Chip label="Approved" size="small" color="success" icon={<CheckCircle size={14} />} />
                    ) : row.supervisorSubmitted ? (
                      <Chip label="Pending Approval" size="small" color="warning" icon={<AlertCircle size={14} />} />
                    ) : (
                      <Chip label="Draft" size="small" color="default" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Tooltip title="View Details">
                      <IconButton onClick={() => handleView(row)} size="small" className="text-blue-600">
                        <Eye size={18} />
                      </IconButton>
                    </Tooltip>
                    {!(isLocked && approvedHeats.has(row.heatNo)) && (
                      <>
                        <Tooltip title="Edit QC Entry">
                          <IconButton onClick={() => handleEdit(row)} size="small" className="text-amber-600">
                            <Edit size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete QC Entry">
                          <IconButton onClick={() => setDeleteTarget(row)} size="small" className="text-rose-600">
                            <Trash2 size={18} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {row.supervisorSubmitted && !row.verified && (
                      <Tooltip title="Approve QC">
                        <IconButton onClick={() => handleOpenApprove(row)} size="small" className="text-emerald-600">
                          <CheckCircle size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="font-bold text-slate-800">QC Details - {selectedQC?.heatNo}</DialogTitle>
        <DialogContent dividers>
          {selectedQC && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><Typography className="text-xs text-slate-500">Alloy</Typography><Typography className="font-bold">{selectedQC.alloyType}</Typography></div>
                <div><Typography className="text-xs text-slate-500">Furnace</Typography><Typography className="font-bold">{selectedQC.furnaceNo}</Typography></div>
                <div><Typography className="text-xs text-slate-500">Operator</Typography><Typography className="font-bold">{selectedQC.operatorName}</Typography></div>
                <div><Typography className="text-xs text-slate-500">Supervisor</Typography><Typography className="font-bold">{selectedQC.supervisorName}</Typography></div>
              </div>
              
              <Typography className="font-bold mt-4 mb-2 border-b pb-1">Element Analysis</Typography>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {selectedQC.elements?.map((el, i) => (
                  <Card key={i} className={`p-2 border ${el.status === 'PASS' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                    <Typography className="text-xs font-bold text-center">{el.element}</Typography>
                    <Typography className="text-lg font-black text-center">{el.observedValue} {el.unit}</Typography>
                    <Typography className="text-[9px] text-center text-slate-500">Range: {el.minValue} - {el.maxValue}</Typography>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="font-bold text-emerald-700">Approve Quality Control</DialogTitle>
        <DialogContent>
          <Typography className="mb-4">
            You are about to approve the QC record for Heat No <strong>{selectedQC?.heatNo}</strong>. 
            Once approved, this heat will be available for Cost Ledger entry.
          </Typography>
          <TextField
            label="Verification Remarks (Optional)"
            fullWidth
            multiline
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setApproveDialogOpen(false)} disabled={processing}>Cancel</Button>
          <Button onClick={handleApprove} variant="contained" color="success" disabled={processing} startIcon={processing ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}>
            Confirm Approval
          </Button>
        </DialogActions>
      </Dialog>

      <EditQCDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        qcEntry={selectedQC}
        onSave={loadData}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle className="font-bold flex items-center gap-2">
          <X className="text-rose-600" size={20} /> Delete QC Entry
        </DialogTitle>
        <DialogContent>
          <Typography className="text-slate-600 text-sm">
            Are you sure you want to delete the Quality Control entry for Heat No <strong>{deleteTarget?.heatNo}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PMQualityControlPage;
