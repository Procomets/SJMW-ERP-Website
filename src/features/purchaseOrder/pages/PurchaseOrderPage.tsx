import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  FileText,
  History,
  FilePlus,
  Coins,
  FileCheck,
  Building,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import type {
  PurchaseOrder,
  PurchaseOrderFormData,
} from '../types/purchaseOrder.types';
import {
  subscribePurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  generateNextPoNumber,
  calculatePurchaseOrderTotals,
} from '../services/purchaseOrder.service';
import { downloadPurchaseOrderPdf } from '../utils/purchaseOrderPdf';
import { PurchaseOrderForm } from '../components/PurchaseOrderForm';
import { PurchaseOrderHistory } from '../components/PurchaseOrderHistory';
import { PurchaseOrderPreviewDialog } from '../components/PurchaseOrderPreviewDialog';

interface Props {
  accountsMode?: boolean;
}

export const PurchaseOrderPage: React.FC<Props> = ({ accountsMode = false }) => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [previewOrder, setPreviewOrder] = useState<PurchaseOrder | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Notification state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Role detection: accounts team cannot delete
  const userRole = (profile?.role || '').toLowerCase();
  const isAccounts = accountsMode || userRole.includes('accounts');
  const canDelete = !isAccounts;

  // Real-time subscription to purchaseOrders collection
  useEffect(() => {
    setLoadingOrders(true);
    const unsubscribe = subscribePurchaseOrders((list) => {
      setOrders(list);
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, []);

  // Compute next PO sequence suggestion
  const nextPoSuggestion = useMemo(() => {
    return generateNextPoNumber(orders);
  }, [orders]);

  // Summary Metrics
  const totalPos = orders.length;
  const totalValue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const uniqueVendors = new Set(orders.map((o) => o.vendorName).filter(Boolean)).size;

  // Handlers
  const handleSave = async (formData: PurchaseOrderFormData, andGeneratePdf: boolean) => {
    try {
      setIsSaving(true);
      const creatorName = profile?.name || user?.email || (isAccounts ? 'Accounts Team' : 'Admin');
      const calc = calculatePurchaseOrderTotals(
        formData.items,
        formData.terms?.gstTax || '',
        formData.includeGstInTotal
      );

      let savedPoData: PurchaseOrder;

      if (editingOrder) {
        await updatePurchaseOrder(editingOrder.id, formData, creatorName);
        savedPoData = {
          ...editingOrder,
          ...formData,
          items: calc.items,
          subTotal: calc.subTotal,
          taxPercent: calc.taxPercent,
          taxAmount: calc.taxAmount,
          includeGstInTotal: calc.includeGstInTotal,
          totalAmount: calc.totalAmount,
          updatedBy: creatorName,
        };
        setSnackbar({
          open: true,
          message: `Purchase Order ${formData.poNumber} updated successfully.`,
          severity: 'success',
        });
        setEditingOrder(null);
      } else {
        const newId = await createPurchaseOrder(formData, creatorName);
        savedPoData = {
          id: newId,
          ...formData,
          items: calc.items,
          subTotal: calc.subTotal,
          taxPercent: calc.taxPercent,
          taxAmount: calc.taxAmount,
          includeGstInTotal: calc.includeGstInTotal,
          totalAmount: calc.totalAmount,
          createdBy: creatorName,
          updatedBy: creatorName,
          createdAt: {} as any,
          updatedAt: {} as any,
        };
        setSnackbar({
          open: true,
          message: `Purchase Order ${formData.poNumber} created and saved to Firebase.`,
          severity: 'success',
        });
      }

      if (andGeneratePdf) {
        downloadPurchaseOrderPdf(savedPoData);
      }

      // Switch to history tab to view generated PO
      setActiveTab(1);
    } catch (err: any) {
      console.error('Error saving purchase order', err);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to save Purchase Order. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setActiveTab(0); // Switch to form tab
  };

  const handleDelete = async (order: PurchaseOrder) => {
    if (!canDelete) {
      setSnackbar({
        open: true,
        message: 'Accounts team is not permitted to delete purchase orders.',
        severity: 'error',
      });
      return;
    }

    try {
      await deletePurchaseOrder(order.id);
      setSnackbar({
        open: true,
        message: `Purchase Order ${order.poNumber} deleted successfully.`,
        severity: 'success',
      });
    } catch (err: any) {
      console.error('Error deleting purchase order', err);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to delete Purchase Order.',
        severity: 'error',
      });
    }
  };

  const handleGeneratePdf = (order: PurchaseOrder) => {
    downloadPurchaseOrderPdf(order);
    setSnackbar({
      open: true,
      message: `Downloaded PDF for ${order.poNumber}.`,
      severity: 'info',
    });
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Page Title & Context Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <FileText size={28} color="#1565C0" />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Purchase Order Management
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Generate formal Sri Jothi Moulding Works purchase orders with exact PDF formatting, vendor master integration, and complete order history.
        </Typography>
      </Box>

      {/* Overview Metric Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: '#eff6ff',
                  color: '#1d4ed8',
                  display: 'flex',
                }}
              >
                <FileCheck size={24} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Total Generated POs
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {totalPos}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: '#f0fdf4',
                  color: '#15803d',
                  display: 'flex',
                }}
              >
                <Coins size={24} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Total Order Value
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  ₹ {totalValue.toLocaleString('en-IN')}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: '#faf5ff',
                  color: '#7e22ce',
                  display: 'flex',
                }}
              >
                <Building size={24} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Active Vendors
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {uniqueVendors}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => {
            setActiveTab(val);
            if (val === 1 && editingOrder) {
              setEditingOrder(null);
            }
          }}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              minHeight: 48,
            },
          }}
        >
          <Tab
            icon={<FilePlus size={18} />}
            iconPosition="start"
            label={editingOrder ? `Edit PO (${editingOrder.poNumber})` : 'New Purchase Order'}
          />
          <Tab
            icon={<History size={18} />}
            iconPosition="start"
            label={`PO History (${orders.length})`}
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {activeTab === 0 && (
        <PurchaseOrderForm
          initialData={editingOrder}
          nextPoNumberSuggestion={nextPoSuggestion}
          onSave={handleSave}
          onCancelEdit={() => {
            setEditingOrder(null);
          }}
          isSaving={isSaving}
          onPreview={(draft) => setPreviewOrder(draft)}
        />
      )}

      {activeTab === 1 && (
        <PurchaseOrderHistory
          orders={orders}
          loading={loadingOrders}
          canDelete={canDelete}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onGeneratePdf={handleGeneratePdf}
          onPreview={(order) => setPreviewOrder(order)}
        />
      )}

      {/* Preview Dialog */}
      <PurchaseOrderPreviewDialog
        open={Boolean(previewOrder)}
        onClose={() => setPreviewOrder(null)}
        purchaseOrder={previewOrder}
      />

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchaseOrderPage;
