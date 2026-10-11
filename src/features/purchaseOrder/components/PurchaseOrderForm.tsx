import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Autocomplete,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Divider,
  Alert,
  Tooltip,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Plus,
  Trash2,
  FileDown,
  Eye,
  RotateCcw,
  Building2,
  Save,
  CheckCircle2,
} from 'lucide-react';
import type {
  PurchaseOrder,
  PurchaseOrderFormData,
  PurchaseOrderItem,
} from '../types/purchaseOrder.types';
import { getEmptyPurchaseOrderForm } from '../types/purchaseOrder.types';
import { fetchVendors } from '../../vendorMaster/services/vendorMaster.service';
import type { VendorMaster } from '../../vendorMaster/types/vendorMaster.types';
import { downloadPurchaseOrderPdf } from '../utils/purchaseOrderPdf';

interface Props {
  initialData?: PurchaseOrder | null;
  onSave: (formData: PurchaseOrderFormData, andGeneratePdf: boolean) => Promise<void>;
  onCancelEdit?: () => void;
  nextPoNumberSuggestion?: string;
  isSaving: boolean;
  onPreview: (draftPo: PurchaseOrder) => void;
}

export const PurchaseOrderForm: React.FC<Props> = ({
  initialData,
  onSave,
  onCancelEdit,
  nextPoNumberSuggestion,
  isSaving,
  onPreview,
}) => {
  const [formData, setFormData] = useState<PurchaseOrderFormData>(getEmptyPurchaseOrderForm());
  const [vendors, setVendors] = useState<VendorMaster[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorMaster | null>(null);
  const [loadingVendors, setLoadingVendors] = useState<boolean>(true);
  const [formError, setFormError] = useState<string>('');

  // Load vendors list from Vendor Master
  useEffect(() => {
    let isMounted = true;
    const loadVendors = async () => {
      try {
        setLoadingVendors(true);
        const list = await fetchVendors();
        if (isMounted) {
          setVendors(list);
        }
      } catch (err) {
        console.error('Error fetching vendors for PO form', err);
      } finally {
        if (isMounted) setLoadingVendors(false);
      }
    };
    loadVendors();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync with initialData or PO number suggestion
  useEffect(() => {
    if (initialData) {
      setFormData({
        poNumber: initialData.poNumber,
        date: initialData.date,
        vendorId: initialData.vendorId,
        vendorName: initialData.vendorName,
        vendorGst: initialData.vendorGst,
        vendorAddress: initialData.vendorAddress,
        quotationRef: initialData.quotationRef,
        items: initialData.items.map((it) => ({ ...it })),
        terms: { ...initialData.terms },
      });
      // Try to find matching vendor in list
      const matched = vendors.find(
        (v) => v.id === initialData.vendorId || v.vendorName.toLowerCase() === initialData.vendorName.toLowerCase()
      );
      if (matched) setSelectedVendor(matched);
    } else {
      setFormData((prev) => ({
        ...getEmptyPurchaseOrderForm(),
        poNumber: nextPoNumberSuggestion || prev.poNumber || 'SJMW/024/26-27',
      }));
      setSelectedVendor(null);
    }
  }, [initialData, nextPoNumberSuggestion, vendors]);

  // When vendor is selected from Vendor Master
  const handleVendorSelect = (vendor: VendorMaster | null) => {
    setSelectedVendor(vendor);
    if (!vendor) {
      setFormData((prev) => ({
        ...prev,
        vendorId: '',
        vendorName: '',
        vendorGst: '',
        vendorAddress: '',
      }));
      return;
    }

    // Format address from vendor's companyAddress
    const addr = vendor.companyAddress;
    const parts = [
      addr?.addressLine1,
      addr?.addressLine2,
      addr?.city,
      addr?.district,
      addr?.state ? `${addr.state}${addr.pinCode ? ` - ${addr.pinCode}` : ''}` : addr?.pinCode,
    ].filter(Boolean);

    const formattedAddress = parts.join(', ');

    setFormData((prev) => ({
      ...prev,
      vendorId: vendor.id,
      vendorName: vendor.vendorName,
      vendorGst: vendor.gstNumber || '',
      vendorAddress: formattedAddress,
    }));
  };

  // Item modifications
  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const item = { ...newItems[index], [field]: value };

      if (field === 'quantity' || field === 'rate') {
        const qty = field === 'quantity' ? Number(value) || 0 : Number(item.quantity) || 0;
        const rate = field === 'rate' ? Number(value) || 0 : Number(item.rate) || 0;
        item.amount = qty * rate;
      }

      newItems[index] = item;
      return { ...prev, items: newItems };
    });
  };

  const addItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: String(Date.now()),
          siNo: prev.items.length + 1,
          description: '',
          quantity: 1,
          rate: 0,
          amount: 0,
        },
      ],
    }));
  };

  const removeItemRow = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => {
      const filtered = prev.items.filter((_, i) => i !== index);
      const renumbered = filtered.map((it, i) => ({ ...it, siNo: i + 1 }));
      return { ...prev, items: renumbered };
    });
  };

  const totalCalculatedAmount = formData.items.reduce(
    (sum, it) => sum + (Number(it.amount) || 0),
    0
  );

  const validateForm = (): boolean => {
    if (!formData.vendorName.trim()) {
      setFormError('Please select or enter the Company / Vendor Name.');
      return false;
    }
    if (!formData.poNumber.trim()) {
      setFormError('Please enter a Purchase Order Number.');
      return false;
    }
    if (!formData.date.trim()) {
      setFormError('Please enter the Purchase Order Date.');
      return false;
    }
    if (formData.items.length === 0 || !formData.items.some((it) => it.description.trim())) {
      setFormError('Please provide at least one item description in the table.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSubmit = async (andGeneratePdf: boolean) => {
    if (!validateForm()) return;
    await onSave(formData, andGeneratePdf);
  };

  const handlePreview = () => {
    if (!formData.vendorName.trim()) {
      setFormError('Please select a company to preview.');
      return;
    }
    setFormError('');
    const draftPo: PurchaseOrder = {
      id: initialData?.id || 'draft',
      poNumber: formData.poNumber || 'SJMW/DRAFT',
      date: formData.date,
      vendorId: formData.vendorId,
      vendorName: formData.vendorName,
      vendorGst: formData.vendorGst,
      vendorAddress: formData.vendorAddress,
      quotationRef: formData.quotationRef,
      items: formData.items.map((it, idx) => ({
        ...it,
        siNo: idx + 1,
        amount: (Number(it.quantity) || 0) * (Number(it.rate) || 0),
      })),
      totalAmount: totalCalculatedAmount,
      terms: formData.terms,
      createdBy: initialData?.createdBy || 'User',
      createdAt: initialData?.createdAt || ({} as any),
      updatedBy: 'User',
      updatedAt: ({} as any),
    };
    onPreview(draftPo);
  };

  const handleReset = () => {
    setFormData({
      ...getEmptyPurchaseOrderForm(),
      poNumber: nextPoNumberSuggestion || 'SJMW/024/26-27',
    });
    setSelectedVendor(null);
    setFormError('');
    if (onCancelEdit) onCancelEdit();
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: '1px solid #e2e8f0',
        overflow: 'visible',
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header Bar */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
              {initialData ? 'Edit Purchase Order' : 'Generate New Purchase Order'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Fill in the order details, verify vendor GST & address, and create the PO document.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleReset}
              startIcon={<RotateCcw size={16} />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {initialData ? 'Cancel Edit' : 'Reset Form'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={handlePreview}
              startIcon={<Eye size={16} />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Preview PDF
            </Button>
          </Box>
        </Box>

        {formError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setFormError('')}>
            {formError}
          </Alert>
        )}

        {/* Section 1: Vendor Selection & Master Details */}
        <Box
          sx={{
            p: 2.5,
            mb: 3,
            bgcolor: '#f8fafc',
            borderRadius: 2.5,
            border: '1px solid #e2e8f0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Building2 size={18} color="#1565C0" />
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
              Vendor Master Details
            </Typography>
            <Chip
              label="Auto-Fetched From Vendor Master"
              size="small"
              sx={{
                bgcolor: '#eff6ff',
                color: '#1d4ed8',
                fontWeight: 700,
                fontSize: '0.7rem',
                height: 22,
              }}
            />
          </Box>

          <Grid container spacing={2}>
            {/* Vendor Select Dropdown */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={vendors}
                getOptionLabel={(option) =>
                  `${option.vendorName} (${option.vendorCode || 'No Code'})`
                }
                value={selectedVendor}
                onChange={(_, val) => handleVendorSelect(val)}
                loading={loadingVendors}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Company / Vendor *"
                    placeholder="Search vendor name or code..."
                    size="small"
                  />
                )}
              />
            </Grid>

            {/* Company Name Editable Display */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Company Name (On PDF) *"
                fullWidth
                size="small"
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                placeholder="e.g. OSWAL MINERALS PRIVATE LIMITED"
                helperText="Company name as printed on the Purchase Order"
              />
            </Grid>

            {/* Fetched GST Number */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Vendor GST No."
                fullWidth
                size="small"
                value={formData.vendorGst}
                onChange={(e) => setFormData({ ...formData, vendorGst: e.target.value })}
                placeholder="e.g. 29AACCM6499G1ZX"
                helperText="Fetched from Vendor Master (Editable)"
                InputProps={{
                  startAdornment: formData.vendorGst ? (
                    <CheckCircle2 size={16} color="#16a34a" style={{ marginRight: 6 }} />
                  ) : undefined,
                }}
              />
            </Grid>

            {/* Fetched Company Address */}
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                label="Company Address (Fetched from Master)"
                fullWidth
                size="small"
                multiline
                rows={2}
                value={formData.vendorAddress}
                onChange={(e) => setFormData({ ...formData, vendorAddress: e.target.value })}
                placeholder="Address line, city, state, pincode..."
                helperText="Fetched address will appear under the company name in the PDF TO section"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Section 2: PO Header Metadata */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', mb: 2 }}>
            Purchase Order Information
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Purchase Order No. *"
                fullWidth
                size="small"
                value={formData.poNumber}
                onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                placeholder="e.g. SJMW/023/26-27"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Date *"
                fullWidth
                size="small"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                placeholder="DD/MM/YYYY"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Your Quotation Ref"
                fullWidth
                size="small"
                value={formData.quotationRef}
                onChange={(e) => setFormData({ ...formData, quotationRef: e.target.value })}
                placeholder="e.g. By Telephonic"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Section 3: Items Table */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1.5,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
              Line Items
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Plus size={16} />}
              onClick={addItemRow}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Add Item Row
            </Button>
          </Box>

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 2, overflow: 'hidden' }}
          >
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell
                    sx={{ width: 60, fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}
                    align="center"
                  >
                    SI.NO
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}
                  >
                    DESCRIPTION *
                  </TableCell>
                  <TableCell
                    sx={{ width: 140, fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}
                    align="right"
                  >
                    QUANTITY *
                  </TableCell>
                  <TableCell
                    sx={{ width: 140, fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}
                    align="right"
                  >
                    RATE / UNIT *
                  </TableCell>
                  <TableCell
                    sx={{ width: 140, fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}
                    align="right"
                  >
                    AMOUNT
                  </TableCell>
                  <TableCell sx={{ width: 50 }} align="center" />
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={item.id || index} hover>
                    <TableCell align="center" sx={{ fontWeight: 600, color: '#64748b' }}>
                      {item.siNo || index + 1}
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. Silicone 2202"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        sx={{
                          p: 0.5,
                          bgcolor: '#ffffff',
                          borderRadius: 1,
                          border: '1px solid #cbd5e1',
                          px: 1,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        sx={{
                          p: 0.5,
                          bgcolor: '#ffffff',
                          borderRadius: 1,
                          border: '1px solid #cbd5e1',
                          px: 1,
                          width: '100%',
                          '& input': { textAlign: 'right' },
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={item.rate}
                        onChange={(e) =>
                          handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)
                        }
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        sx={{
                          p: 0.5,
                          bgcolor: '#ffffff',
                          borderRadius: 1,
                          border: '1px solid #cbd5e1',
                          px: 1,
                          width: '100%',
                          '& input': { textAlign: 'right' },
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      R{Number(item.amount || 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Remove row">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={formData.items.length <= 1}
                            onClick={() => removeItemRow(index)}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Table Footer Total Amount */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              mt: 1.5,
              gap: 2,
            }}
          >
            <Typography sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.9rem' }}>
              Total Order Value:
            </Typography>
            <Typography
              sx={{
                fontWeight: 800,
                color: '#1565C0',
                fontSize: '1.25rem',
                fontFamily: 'monospace',
              }}
            >
              R{totalCalculatedAmount.toLocaleString('en-IN')}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 4: Terms & Conditions */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', mb: 2 }}>
            Terms & Conditions
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Payment Terms"
                fullWidth
                size="small"
                value={formData.terms.paymentTerms}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    terms: { ...formData.terms, paymentTerms: e.target.value },
                  })
                }
                placeholder="45 Days"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="GST Tax"
                fullWidth
                size="small"
                value={formData.terms.gstTax}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    terms: { ...formData.terms, gstTax: e.target.value },
                  })
                }
                placeholder="18% Extra"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Delivery"
                fullWidth
                size="small"
                value={formData.terms.delivery}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    terms: { ...formData.terms, delivery: e.target.value },
                  })
                }
                placeholder="IMMEDIATE."
              />
            </Grid>
          </Grid>
        </Box>

        {/* Submit Actions */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            pt: 2,
            borderTop: '1px solid #f1f5f9',
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="outlined"
            color="primary"
            disabled={isSaving}
            onClick={() => handleSubmit(false)}
            startIcon={isSaving ? <CircularProgress size={16} /> : <Save size={18} />}
            sx={{ fontWeight: 700, textTransform: 'none', px: 3, py: 1 }}
          >
            {initialData ? 'Update PO Only' : 'Save PO to Firebase'}
          </Button>

          <Button
            variant="contained"
            disabled={isSaving}
            onClick={() => handleSubmit(true)}
            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <FileDown size={18} />}
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              px: 3,
              py: 1,
              bgcolor: '#1565C0',
              '&:hover': { bgcolor: '#0d47a1' },
            }}
          >
            {initialData ? 'Update & Download PDF' : 'Save & Download PDF'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
