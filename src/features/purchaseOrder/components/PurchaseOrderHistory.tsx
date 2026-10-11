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
  Building2,
  Receipt,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import type { PurchaseOrder } from '../types/purchaseOrder.types';

interface Props {
  orders: PurchaseOrder[];
  loading: boolean;
  canDelete: boolean; // false for accounts team
  onEdit: (order: PurchaseOrder) => void;
  onDelete: (order: PurchaseOrder) => void;
  onGeneratePdf: (order: PurchaseOrder) => void;
  onPreview: (order: PurchaseOrder) => void;
}

export const PurchaseOrderHistory: React.FC<Props> = ({
  orders,
  loading,
  canDelete,
  onEdit,
  onDelete,
  onGeneratePdf,
  onPreview,
}) => {
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (o.poNumber || '').toLowerCase().includes(q) ||
      (o.vendorName || '').toLowerCase().includes(q) ||
      (o.vendorGst || '').toLowerCase().includes(q) ||
      (o.date || '').toLowerCase().includes(q) ||
      (o.quotationRef || '').toLowerCase().includes(q)
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
              Purchase Order History
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Browse, regenerate PDF, edit, or manage previously issued purchase orders.
            </Typography>
          </Box>

          <Box sx={{ width: { xs: '100%', sm: 300 } }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search by PO No, Vendor, Date..."
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
        ) : filteredOrders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#f8fafc', borderRadius: 2 }}>
            <Receipt size={40} color="#94a3b8" style={{ marginBottom: 8 }} />
            <Typography sx={{ fontWeight: 700, color: '#475569' }}>
              {search ? 'No matching Purchase Orders found.' : 'No Purchase Orders generated yet.'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
              Use the form above to generate your first Purchase Order.
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
                    PO NUMBER
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>
                    DATE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>
                    VENDOR & GST
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>
                    ITEMS
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}
                    align="right"
                  >
                    AMOUNT
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>
                    REF
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
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    {/* PO Number */}
                    <TableCell>
                      <Chip
                        label={order.poNumber}
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
                      {order.date}
                    </TableCell>

                    {/* Vendor Name & GST */}
                    <TableCell>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                        {order.vendorName}
                      </Typography>
                      {order.vendorGst && (
                        <Typography
                          variant="caption"
                          sx={{ color: '#64748b', fontFamily: 'monospace' }}
                        >
                          GST: {order.vendorGst}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Items Summary */}
                    <TableCell>
                      <Typography sx={{ fontSize: '0.85rem', color: '#334155' }}>
                        {order.items?.[0]?.description || '—'}
                        {order.items?.length > 1 && (
                          <Chip
                            label={`+${order.items.length - 1} more`}
                            size="small"
                            sx={{ ml: 1, height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                          />
                        )}
                      </Typography>
                    </TableCell>

                    {/* Amount */}
                    <TableCell align="right">
                      <Typography
                        sx={{
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          color: '#0f172a',
                          fontFamily: 'monospace',
                        }}
                      >
                        R{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                      </Typography>
                    </TableCell>

                    {/* Quotation Ref */}
                    <TableCell sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {order.quotationRef || '—'}
                    </TableCell>

                    {/* Actions: Generate PDF, Edit, Delete (Admin only) */}
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {/* Preview / View PDF */}
                        <Tooltip title="Preview PDF">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => onPreview(order)}
                          >
                            <Eye size={17} />
                          </IconButton>
                        </Tooltip>

                        {/* Generate / Download PDF */}
                        <Tooltip title="Generate & Download PDF">
                          <IconButton
                            size="small"
                            sx={{ color: '#d32f2f' }}
                            onClick={() => onGeneratePdf(order)}
                          >
                            <FileDown size={17} />
                          </IconButton>
                        </Tooltip>

                        {/* Edit Option */}
                        <Tooltip title="Edit Purchase Order">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => onEdit(order)}
                          >
                            <Edit2 size={17} />
                          </IconButton>
                        </Tooltip>

                        {/* Delete Option - ONLY rendered if canDelete is true! Accounts team cannot see this! */}
                        {canDelete && (
                          <Tooltip title="Delete Purchase Order (Admin Only)">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteTarget(order)}
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
              Are you sure you want to delete Purchase Order{' '}
              <strong>{deleteTarget?.poNumber}</strong> for{' '}
              <strong>{deleteTarget?.vendorName}</strong>?
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
              Delete PO
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};
