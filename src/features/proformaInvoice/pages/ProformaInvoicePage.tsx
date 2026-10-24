import React, { useState, useEffect, useMemo } from 'react';
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
  ReceiptText,
  History,
  FilePlus,
  Coins,
  FileCheck,
  Building,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import type {
  ProformaInvoice,
  ProformaInvoiceFormData,
} from '../types/proformaInvoice.types';
import {
  subscribeProformaInvoices,
  createProformaInvoice,
  updateProformaInvoice,
  deleteProformaInvoice,
  generateNextInvoiceNumber,
  computeInvoiceTotals,
} from '../services/proformaInvoice.service';
import { downloadProformaInvoicePdf } from '../utils/proformaInvoicePdf';
import { ProformaInvoiceForm } from '../components/ProformaInvoiceForm';
import { ProformaInvoiceHistory } from '../components/ProformaInvoiceHistory';
import { ProformaInvoicePreviewDialog } from '../components/ProformaInvoicePreviewDialog';

interface Props {
  accountsMode?: boolean;
}

export const ProformaInvoicePage: React.FC<Props> = ({ accountsMode = false }) => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [invoices, setInvoices] = useState<ProformaInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState<boolean>(true);
  const [editingInvoice, setEditingInvoice] = useState<ProformaInvoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<ProformaInvoice | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Notifications
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Role permissions: accounts team cannot delete
  const userRole = (profile?.role || '').toLowerCase();
  const isAccounts = accountsMode || userRole.includes('accounts');
  const canDelete = !isAccounts;

  // Real-time Firestore subscription
  useEffect(() => {
    setLoadingInvoices(true);
    const unsubscribe = subscribeProformaInvoices((list) => {
      setInvoices(list);
      setLoadingInvoices(false);
    });

    return () => unsubscribe();
  }, []);

  // Compute next suggestion
  const nextInvoiceSuggestion = useMemo(() => {
    return generateNextInvoiceNumber(invoices);
  }, [invoices]);

  // Overview metrics
  const totalInvoices = invoices.length;
  const totalValue = invoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
  const uniqueClients = new Set(
    invoices.map((inv) => inv.consignee?.name || inv.buyer?.name).filter(Boolean)
  ).size;

  // Handlers
  const handleSave = async (formData: ProformaInvoiceFormData, andGeneratePdf: boolean) => {
    try {
      setIsSaving(true);
      const creatorName = profile?.name || user?.email || (isAccounts ? 'Accounts Team' : 'Admin');

      const totals = computeInvoiceTotals(formData);
      const sanitizedItems = (formData.items || []).map((it, idx) => {
        const q = Number(it.quantity) || 0;
        const r = Number(it.rate) || 0;
        return {
          id: it.id || String(idx + 1),
          slNo: idx + 1,
          description: (it.description || '').trim(),
          hsnSac: (it.hsnSac || '76012010').trim(),
          quantity: q,
          rate: r,
          per: it.per || 'KGS',
          amount: Math.round(q * r * 100) / 100,
        };
      });

      let savedInvoice: ProformaInvoice;

      if (editingInvoice) {
        await updateProformaInvoice(editingInvoice.id, formData, creatorName);
        savedInvoice = {
          ...editingInvoice,
          ...formData,
          items: sanitizedItems,
          ...totals,
          updatedBy: creatorName,
        };
        setSnackbar({
          open: true,
          message: `Proforma Invoice ${formData.invoiceNo} updated successfully.`,
          severity: 'success',
        });
        setEditingInvoice(null);
      } else {
        const newId = await createProformaInvoice(formData, creatorName);
        savedInvoice = {
          id: newId,
          ...formData,
          items: sanitizedItems,
          ...totals,
          createdBy: creatorName,
          updatedBy: creatorName,
          createdAt: {} as any,
          updatedAt: {} as any,
        };
        setSnackbar({
          open: true,
          message: `Proforma Invoice ${formData.invoiceNo} created and saved to Firebase.`,
          severity: 'success',
        });
      }

      if (andGeneratePdf) {
        downloadProformaInvoicePdf(savedInvoice);
      }

      // Switch to history tab
      setActiveTab(1);
    } catch (err: any) {
      console.error('Error saving proforma invoice', err);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to save Proforma Invoice.',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (inv: ProformaInvoice) => {
    setEditingInvoice(inv);
    setActiveTab(0); // Switch to form
  };

  const handleDelete = async (inv: ProformaInvoice) => {
    if (!canDelete) {
      setSnackbar({
        open: true,
        message: 'Accounts team is not permitted to delete proforma invoices.',
        severity: 'error',
      });
      return;
    }

    try {
      await deleteProformaInvoice(inv.id);
      setSnackbar({
        open: true,
        message: `Proforma Invoice ${inv.invoiceNo} deleted successfully.`,
        severity: 'success',
      });
    } catch (err: any) {
      console.error('Error deleting proforma invoice', err);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to delete Proforma Invoice.',
        severity: 'error',
      });
    }
  };

  const handleGeneratePdf = (inv: ProformaInvoice) => {
    downloadProformaInvoicePdf(inv);
    setSnackbar({
      open: true,
      message: `Downloaded PDF for ${inv.invoiceNo}.`,
      severity: 'info',
    });
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Title Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <ReceiptText size={28} color="#1565C0" />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Proforma Invoice Management
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Generate formal GST-compliant Sri Jothi Moulding Works Proforma Invoices with live PDF layout, customer master integration, and complete billing history.
        </Typography>
      </Box>

      {/* Metric Cards */}
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
                  Total Generated Invoices
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {totalInvoices}
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
                  Total Invoiced Value
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  ₹ {totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
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
                  Active Billed Clients
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {uniqueClients}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => {
            setActiveTab(val);
            if (val === 1 && editingInvoice) {
              setEditingInvoice(null);
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
            label={editingInvoice ? `Edit Invoice (${editingInvoice.invoiceNo})` : 'New Proforma Invoice'}
          />
          <Tab
            icon={<History size={18} />}
            iconPosition="start"
            label={`Invoice History (${invoices.length})`}
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {activeTab === 0 && (
        <ProformaInvoiceForm
          initialData={editingInvoice}
          nextInvoiceNoSuggestion={nextInvoiceSuggestion}
          onSave={handleSave}
          onCancelEdit={() => setEditingInvoice(null)}
          isSaving={isSaving}
          onPreview={(draft) => setPreviewInvoice(draft)}
        />
      )}

      {activeTab === 1 && (
        <ProformaInvoiceHistory
          invoices={invoices}
          loading={loadingInvoices}
          canDelete={canDelete}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onGeneratePdf={handleGeneratePdf}
          onPreview={(inv) => setPreviewInvoice(inv)}
        />
      )}

      {/* Preview Dialog */}
      <ProformaInvoicePreviewDialog
        open={Boolean(previewInvoice)}
        onClose={() => setPreviewInvoice(null)}
        invoice={previewInvoice}
      />

      {/* Snackbar */}
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

export default ProformaInvoicePage;
