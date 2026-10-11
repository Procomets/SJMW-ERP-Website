import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Chip,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  FileDown,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  ReceiptText,
} from 'lucide-react';
import type { ProformaInvoice } from '../types/proformaInvoice.types';

interface Props {
  invoices: ProformaInvoice[];
  loading: boolean;
  canDelete: boolean; // false for accounts team
  onEdit: (invoice: ProformaInvoice) => void;
  onDelete: (invoice: ProformaInvoice) => void;
  onGeneratePdf: (invoice: ProformaInvoice) => void;
  onPreview: (invoice: ProformaInvoice) => void;
}

export const ProformaInvoiceHistory: React.FC<Props> = ({
  invoices,
  loading,
  canDelete,
  onEdit,
  onDelete,
  onGeneratePdf,
  onPreview,
}) => {
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ProformaInvoice | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (inv.invoiceNo || '').toLowerCase().includes(q) ||
      (inv.consignee?.name || '').toLowerCase().includes(q) ||
      (inv.buyer?.name || '').toLowerCase().includes(q) ||
      (inv.consignee?.gstin || '').toLowerCase().includes(q) ||
      (inv.date || '').toLowerCase().includes(q)
    );
  });

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete(deleteTarget);
      setDeleteTarget(null);
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: '1px solid #e2e8f0',
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header & Search */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2.5,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Proforma Invoice History
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Browse, regenerate PDF, edit, or manage previously issued proforma invoices.
            </Typography>
          </Box>

          <Box sx={{ width: { xs: '100%', sm: 300 } }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search by Invoice No, Customer, Date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color="#64748b" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>

        {/* Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={36} />
          </Box>
        ) : filteredInvoices.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#f8fafc', borderRadius: 2 }}>
            <ReceiptText size={40} color="#94a3b8" style={{ marginBottom: 8 }} />
            <Typography sx={{ fontWeight: 700, color: '#475569' }}>
              {search ? 'No matching Proforma Invoices found.' : 'No Proforma Invoices generated yet.'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
              Use the form to create and generate your first Proforma Invoice.
            </Typography>
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 2, overflowX: 'auto' }}
          >
            <Table size="medium">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>
                    INVOICE NO
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>
                    DATE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>
                    CUSTOMER & GST
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>
                    DESCRIPTION OF GOODS
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}
                    align="right"
                  >
                    TAXABLE
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}
                    align="right"
                  >
                    TOTAL AMOUNT
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}
                    align="center"
                  >
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices.map((inv) => (
                  <TableRow key={inv.id} hover>
                    {/* Invoice Number */}
                    <TableCell>
                      <Chip
                        label={inv.invoiceNo}
                        size="small"
                        sx={{
                          bgcolor: '#eff6ff',
                          color: '#1d4ed8',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          borderRadius: 1.5,
                        }}
                      />
                    </TableCell>

                    {/* Date */}
                    <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                      {inv.date}
                    </TableCell>

                    {/* Customer & GST */}
                    <TableCell>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                        {inv.consignee?.name || inv.buyer?.name || '—'}
                      </Typography>
                      {inv.consignee?.gstin && (
                        <Typography
                          variant="caption"
                          sx={{ color: '#64748b', fontFamily: 'monospace' }}
                        >
                          GST: {inv.consignee.gstin}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Goods description */}
                    <TableCell>
                      <Typography sx={{ fontSize: '0.85rem', color: '#334155' }}>
                        {inv.items?.[0]?.description || '—'}
                        {inv.items?.[0]?.quantity ? ` (${inv.items[0].quantity} ${inv.items[0].per || 'KGS'})` : ''}
                      </Typography>
                    </TableCell>

                    {/* Taxable Amount */}
                    <TableCell align="right">
                      <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                        ₹{Number(inv.subTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </TableCell>

                    {/* Grand Total */}
                    <TableCell align="right">
                      <Typography
                        sx={{
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          color: '#0f172a',
                          fontFamily: 'monospace',
                        }}
                      >
                        ₹{Number(inv.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {/* Preview PDF */}
                        <Tooltip title="Preview PDF">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => onPreview(inv)}
                          >
                            <Eye size={17} />
                          </IconButton>
                        </Tooltip>

                        {/* Download PDF */}
                        <Tooltip title="Generate & Download PDF">
                          <IconButton
                            size="small"
                            sx={{ color: '#d32f2f' }}
                            onClick={() => onGeneratePdf(inv)}
                          >
                            <FileDown size={17} />
                          </IconButton>
                        </Tooltip>

                        {/* Edit */}
                        <Tooltip title="Edit Proforma Invoice">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => onEdit(inv)}
                          >
                            <Edit2 size={17} />
                          </IconButton>
                        </Tooltip>

                        {/* Delete - Admin Only */}
                        {canDelete && (
                          <Tooltip title="Delete Proforma Invoice (Admin Only)">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteTarget(inv)}
                            >
                              <Trash2 size={17} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#dc2626' }}>
            <AlertTriangle size={20} /> Confirm Delete
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: '#334155' }}>
              Are you sure you want to delete Proforma Invoice{' '}
              <strong>{deleteTarget?.invoiceNo}</strong> for{' '}
              <strong>{deleteTarget?.consignee?.name}</strong>?
            </DialogContentText>
            <Typography variant="caption" sx={{ color: '#dc2626', mt: 1, display: 'block' }}>
              This action permanently removes the record from Firebase.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteTarget(null)} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="contained"
              color="error"
              sx={{ fontWeight: 700 }}
            >
              Delete Invoice
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};
