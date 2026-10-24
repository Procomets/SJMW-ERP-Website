import React, { useState, useEffect, useMemo } from 'react';
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
  FormControlLabel,
  Switch,
  MenuItem,
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
  Percent,
} from 'lucide-react';
import type {
  ProformaInvoice,
  ProformaInvoiceFormData,
  ProformaInvoiceItem,
} from '../types/proformaInvoice.types';
import { getEmptyProformaInvoiceForm } from '../types/proformaInvoice.types';
import { computeInvoiceTotals } from '../services/proformaInvoice.service';
import { fetchVendors } from '../../vendorMaster/services/vendorMaster.service';
import type { VendorMaster } from '../../vendorMaster/types/vendorMaster.types';

interface Props {
  initialData?: ProformaInvoice | null;
  onSave: (formData: ProformaInvoiceFormData, andGeneratePdf: boolean) => Promise<void>;
  onCancelEdit?: () => void;
  nextInvoiceNoSuggestion?: string;
  isSaving: boolean;
  onPreview: (draft: ProformaInvoice) => void;
}

export const ProformaInvoiceForm: React.FC<Props> = ({
  initialData,
  onSave,
  onCancelEdit,
  nextInvoiceNoSuggestion,
  isSaving,
  onPreview,
}) => {
  const [formData, setFormData] = useState<ProformaInvoiceFormData>(getEmptyProformaInvoiceForm());
  const [vendors, setVendors] = useState<VendorMaster[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<VendorMaster | null>(null);
  const [loadingVendors, setLoadingVendors] = useState<boolean>(true);
  const [formError, setFormError] = useState<string>('');

  // Fetch vendors/customers from Vendor Master
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
        console.error('Error fetching vendors for proforma invoice form', err);
      } finally {
        if (isMounted) setLoadingVendors(false);
      }
    };
    loadVendors();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync initialData or suggestion
  useEffect(() => {
    if (initialData) {
      setFormData({
        invoiceNo: initialData.invoiceNo,
        date: initialData.date,
        eWayBillNo: initialData.eWayBillNo || '',
        deliveryNote: initialData.deliveryNote || '',
        modeTermsOfPayment: initialData.modeTermsOfPayment || 'IMMEDIATE',
        referenceNoAndDate: initialData.referenceNoAndDate || '',
        otherReferences: initialData.otherReferences || '',
        buyerOrderNo: initialData.buyerOrderNo || '',
        buyerOrderDate: initialData.buyerOrderDate || '',
        dispatchDocNo: initialData.dispatchDocNo || '',
        deliveryNoteDate: initialData.deliveryNoteDate || '',
        dispatchedThrough: initialData.dispatchedThrough || '',
        destination: initialData.destination || '',
        termsOfDelivery: initialData.termsOfDelivery || '',
        customerId: initialData.customerId || '',
        sameAsConsignee: true,
        consignee: { ...initialData.consignee },
        buyer: { ...initialData.buyer },
        items: initialData.items.map((it) => ({ ...it })),
        isInterstate: initialData.isInterstate || false,
        taxRatePercent: initialData.taxRatePercent || 18,
      });

      const matched = vendors.find(
        (v) =>
          v.id === initialData.customerId ||
          v.vendorName.toLowerCase() === (initialData.consignee?.name || '').toLowerCase()
      );
      if (matched) setSelectedCustomer(matched);
    } else {
      setFormData((prev) => ({
        ...getEmptyProformaInvoiceForm(),
        invoiceNo: nextInvoiceNoSuggestion || prev.invoiceNo || 'SJMW/PI/001/26-27',
      }));
      setSelectedCustomer(null);
    }
  }, [initialData, nextInvoiceNoSuggestion, vendors]);

  // When customer is selected from Vendor Master
  const handleCustomerSelect = (vendor: VendorMaster | null) => {
    setSelectedCustomer(vendor);
    if (!vendor) return;

    const addr = vendor.companyAddress;
    const parts = [
      addr?.addressLine1,
      addr?.addressLine2,
      addr?.city,
      addr?.district,
      addr?.state ? `${addr.state}${addr.pinCode ? ` - ${addr.pinCode}` : ''}` : addr?.pinCode,
    ].filter(Boolean);

    const formattedAddress = parts.join(', ');
    const stateCode = addr?.stateCode || (addr?.state?.toLowerCase().includes('tamil') ? '33' : '—');
    const isInterstate = stateCode !== '33' && stateCode !== '—';

    const partyData = {
      name: vendor.vendorName,
      address: formattedAddress,
      gstin: vendor.gstNumber || '',
      stateName: addr?.state || 'Tamil Nadu',
      stateCode: stateCode || '33',
    };

    setFormData((prev) => ({
      ...prev,
      customerId: vendor.id,
      consignee: { ...partyData },
      buyer: prev.sameAsConsignee ? { ...partyData } : prev.buyer,
      isInterstate,
    }));
  };

  // Line item modifications
  const handleItemChange = (index: number, field: keyof ProformaInvoiceItem, value: any) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const item = { ...newItems[index], [field]: value };

      if (field === 'quantity' || field === 'rate') {
        const rawQty = field === 'quantity' ? value : item.quantity;
        const rawRate = field === 'rate' ? value : item.rate;
        const qty = rawQty === '' ? 0 : Number(rawQty) || 0;
        const rate = rawRate === '' ? 0 : Number(rawRate) || 0;
        item.amount = Math.round(qty * rate * 100) / 100;
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
          slNo: prev.items.length + 1,
          description: '',
          hsnSac: prev.items[0]?.hsnSac || '76012010',
          quantity: 0,
          rate: 0,
          per: prev.items[0]?.per || 'KGS',
          amount: 0,
        },
      ],
    }));
  };

  const removeItemRow = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => {
      const filtered = prev.items.filter((_, i) => i !== index);
      const renumbered = filtered.map((it, i) => ({ ...it, slNo: i + 1 }));
      return { ...prev, items: renumbered };
    });
  };

  const computedTotals = useMemo(() => {
    return computeInvoiceTotals(formData);
  }, [formData.items, formData.taxRatePercent, formData.isInterstate]);

  const validateForm = (): boolean => {
    if (!formData.consignee.name.trim()) {
      setFormError('Please select or enter the Customer / Consignee Name.');
      return false;
    }
    if (!formData.invoiceNo.trim()) {
      setFormError('Please enter the Proforma Invoice Number.');
      return false;
    }
    if (!formData.date.trim()) {
      setFormError('Please enter the Invoice Date.');
      return false;
    }
    if (formData.items.length === 0 || !formData.items.some((it) => it.description.trim())) {
      setFormError('Please provide at least one item in the line items table.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSubmit = async (andGeneratePdf: boolean) => {
    if (!validateForm()) return;
    const sanitizedItems = formData.items.map((it, idx) => {
      const q = Number(it.quantity) || 0;
      const r = Number(it.rate) || 0;
      return {
        ...it,
        slNo: idx + 1,
        quantity: q,
        rate: r,
        amount: Math.round(q * r * 100) / 100,
      };
    });
    await onSave({ ...formData, items: sanitizedItems }, andGeneratePdf);
  };

  const handlePreview = () => {
    if (!formData.consignee.name.trim()) {
      setFormError('Please select a customer to preview.');
      return;
    }
    setFormError('');

    const sanitizedItems = formData.items.map((it, idx) => {
      const q = Number(it.quantity) || 0;
      const r = Number(it.rate) || 0;
      return {
        ...it,
        slNo: idx + 1,
        quantity: q,
        rate: r,
        amount: Math.round(q * r * 100) / 100,
      };
    });

    const draftInvoice: ProformaInvoice = {
      id: initialData?.id || 'draft',
      invoiceNo: formData.invoiceNo || 'SJMW/PI/DRAFT',
      date: formData.date,
      eWayBillNo: formData.eWayBillNo,
      deliveryNote: formData.deliveryNote,
      modeTermsOfPayment: formData.modeTermsOfPayment,
      referenceNoAndDate: formData.referenceNoAndDate,
      otherReferences: formData.otherReferences,
      buyerOrderNo: formData.buyerOrderNo,
      buyerOrderDate: formData.buyerOrderDate,
      dispatchDocNo: formData.dispatchDocNo,
      deliveryNoteDate: formData.deliveryNoteDate,
      dispatchedThrough: formData.dispatchedThrough,
      destination: formData.destination,
      termsOfDelivery: formData.termsOfDelivery,
      customerId: formData.customerId,
      consignee: { ...formData.consignee },
      buyer: formData.sameAsConsignee ? { ...formData.consignee } : { ...formData.buyer },
      items: sanitizedItems,
      isInterstate: formData.isInterstate,
      taxRatePercent: formData.taxRatePercent !== undefined ? formData.taxRatePercent : 18,
      ...computedTotals,
      createdBy: initialData?.createdBy || 'User',
      createdAt: initialData?.createdAt || ({} as any),
      updatedBy: 'User',
      updatedAt: ({} as any),
    };
    onPreview(draftInvoice);
  };

  const handleReset = () => {
    setFormData({
      ...getEmptyProformaInvoiceForm(),
      invoiceNo: nextInvoiceNoSuggestion || 'SJMW/PI/001/26-27',
    });
    setSelectedCustomer(null);
    setFormError('');
    if (onCancelEdit) onCancelEdit();
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
              {initialData ? 'Edit Proforma Invoice' : 'New Proforma Invoice'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Fill in customer shipping & billing details, order references, items, and tax breakdown.
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

        {/* Section 1: Customer Master Search & Consignee */}
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
              Customer Details (Consignee - Ship to)
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
            {/* Customer Search Autocomplete */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={vendors}
                getOptionLabel={(option) =>
                  `${option.vendorName} (${option.vendorCode || 'No Code'})`
                }
                value={selectedCustomer}
                onChange={(_, val) => handleCustomerSelect(val)}
                loading={loadingVendors}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search & Select Customer *"
                    placeholder="Search company name or code..."
                    size="small"
                  />
                )}
              />
            </Grid>

            {/* Consignee Name */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Consignee Name (Ship to) *"
                fullWidth
                size="small"
                value={formData.consignee.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    consignee: { ...formData.consignee, name: e.target.value },
                    buyer: formData.sameAsConsignee
                      ? { ...formData.buyer, name: e.target.value }
                      : formData.buyer,
                  })
                }
                placeholder="e.g. PIONEER INDUSTRIES & FOUNDRY"
              />
            </Grid>

            {/* Consignee GSTIN */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="GSTIN / UIN"
                fullWidth
                size="small"
                value={formData.consignee.gstin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    consignee: { ...formData.consignee, gstin: e.target.value },
                    buyer: formData.sameAsConsignee
                      ? { ...formData.buyer, gstin: e.target.value }
                      : formData.buyer,
                  })
                }
                placeholder="e.g. 33ALUPL5077H1ZN"
              />
            </Grid>

            {/* State & Code */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="State Name"
                fullWidth
                size="small"
                value={formData.consignee.stateName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    consignee: { ...formData.consignee, stateName: e.target.value },
                    buyer: formData.sameAsConsignee
                      ? { ...formData.buyer, stateName: e.target.value }
                      : formData.buyer,
                  })
                }
                placeholder="Tamil Nadu"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="State Code"
                fullWidth
                size="small"
                value={formData.consignee.stateCode}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    consignee: { ...formData.consignee, stateCode: val },
                    buyer: formData.sameAsConsignee
                      ? { ...formData.buyer, stateCode: val }
                      : formData.buyer,
                    isInterstate: val !== '33' && val.trim() !== '',
                  });
                }}
                placeholder="33"
                helperText={formData.isInterstate ? 'Interstate (IGST 18%)' : 'Intrastate (CGST 9% + SGST 9%)'}
              />
            </Grid>

            {/* Consignee Address */}
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Consignee Address (Ship to)"
                fullWidth
                size="small"
                multiline
                rows={2}
                value={formData.consignee.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    consignee: { ...formData.consignee, address: e.target.value },
                    buyer: formData.sameAsConsignee
                      ? { ...formData.buyer, address: e.target.value }
                      : formData.buyer,
                  })
                }
                placeholder="Street address, industrial area, city, pincode..."
              />
            </Grid>

            {/* Same As Consignee Switch */}
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.sameAsConsignee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sameAsConsignee: e.target.checked,
                        buyer: e.target.checked ? { ...formData.consignee } : formData.buyer,
                      })
                    }
                    color="primary"
                  />
                }
                label={<Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Buyer (Bill to) details are same as Consignee (Ship to)</Typography>}
              />
            </Grid>

            {/* Separate Buyer details if unchecked */}
            {!formData.sameAsConsignee && (
              <>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Buyer Name (Bill to) *"
                    fullWidth
                    size="small"
                    value={formData.buyer.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        buyer: { ...formData.buyer, name: e.target.value },
                      })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Buyer GSTIN"
                    fullWidth
                    size="small"
                    value={formData.buyer.gstin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        buyer: { ...formData.buyer, gstin: e.target.value },
                      })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Buyer State Code"
                    fullWidth
                    size="small"
                    value={formData.buyer.stateCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        buyer: { ...formData.buyer, stateCode: e.target.value },
                      })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Buyer Address (Bill to)"
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    value={formData.buyer.address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        buyer: { ...formData.buyer, address: e.target.value },
                      })
                    }
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Box>

        {/* Section 2: Invoice & Dispatch References */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', mb: 2 }}>
            Invoice & Dispatch Information
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Invoice No. *"
                fullWidth
                size="small"
                value={formData.invoiceNo}
                onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                placeholder="e.g. SJMW/PI/024/26-27"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Dated *"
                fullWidth
                size="small"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                placeholder="DD-MM-YYYY"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="e-Way Bill No."
                fullWidth
                size="small"
                value={formData.eWayBillNo}
                onChange={(e) => setFormData({ ...formData, eWayBillNo: e.target.value })}
                placeholder="Optional"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Mode/Terms of Payment"
                fullWidth
                size="small"
                value={formData.modeTermsOfPayment}
                onChange={(e) => setFormData({ ...formData, modeTermsOfPayment: e.target.value })}
                placeholder="IMMEDIATE"
              />
            </Grid>

            {/* Row 2 */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Reference No. & Date."
                fullWidth
                size="small"
                value={formData.referenceNoAndDate}
                onChange={(e) => setFormData({ ...formData, referenceNoAndDate: e.target.value })}
                placeholder="Ref details"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Other References"
                fullWidth
                size="small"
                value={formData.otherReferences}
                onChange={(e) => setFormData({ ...formData, otherReferences: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Buyer's Order No."
                fullWidth
                size="small"
                value={formData.buyerOrderNo}
                onChange={(e) => setFormData({ ...formData, buyerOrderNo: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Buyer Order Date"
                fullWidth
                size="small"
                value={formData.buyerOrderDate}
                onChange={(e) => setFormData({ ...formData, buyerOrderDate: e.target.value })}
              />
            </Grid>

            {/* Row 3 */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Dispatch Doc No."
                fullWidth
                size="small"
                value={formData.dispatchDocNo}
                onChange={(e) => setFormData({ ...formData, dispatchDocNo: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Delivery Note Date"
                fullWidth
                size="small"
                value={formData.deliveryNoteDate}
                onChange={(e) => setFormData({ ...formData, deliveryNoteDate: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Dispatched through"
                fullWidth
                size="small"
                value={formData.dispatchedThrough}
                onChange={(e) => setFormData({ ...formData, dispatchedThrough: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Destination"
                fullWidth
                size="small"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Terms of Delivery"
                fullWidth
                size="small"
                value={formData.termsOfDelivery}
                onChange={(e) => setFormData({ ...formData, termsOfDelivery: e.target.value })}
                placeholder="Terms of Delivery / Transport remarks"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Section 3: Line Items Table */}
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
              Description of Goods & Line Items
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
                  <TableCell sx={{ width: 50, fontWeight: 700, fontSize: '0.8rem', color: '#475569' }} align="center">
                    SL
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>
                    DESCRIPTION OF GOODS *
                  </TableCell>
                  <TableCell sx={{ width: 110, fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>
                    HSN/SAC
                  </TableCell>
                  <TableCell sx={{ width: 120, fontWeight: 700, fontSize: '0.8rem', color: '#475569' }} align="right">
                    QUANTITY *
                  </TableCell>
                  <TableCell sx={{ width: 80, fontWeight: 700, fontSize: '0.8rem', color: '#475569' }} align="center">
                    PER
                  </TableCell>
                  <TableCell sx={{ width: 120, fontWeight: 700, fontSize: '0.8rem', color: '#475569' }} align="right">
                    RATE *
                  </TableCell>
                  <TableCell sx={{ width: 130, fontWeight: 700, fontSize: '0.8rem', color: '#475569' }} align="right">
                    AMOUNT
                  </TableCell>
                  <TableCell sx={{ width: 45 }} align="center" />
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={item.id || index} hover>
                    <TableCell align="center" sx={{ fontWeight: 600, color: '#64748b' }}>
                      {item.slNo || index + 1}
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. UNWROUGHT ALUMINIUM ALLOY INGOTS LM25"
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
                    <TableCell>
                      <TextField
                        size="small"
                        value={item.hsnSac}
                        onChange={(e) => handleItemChange(index, 'hsnSac', e.target.value)}
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        sx={{
                          p: 0.5,
                          bgcolor: '#ffffff',
                          borderRadius: 1,
                          border: '1px solid #cbd5e1',
                          px: 1,
                          width: '100%',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        placeholder="0"
                        value={item.quantity === 0 ? '' : item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'quantity',
                            e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                          )
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
                    <TableCell align="center">
                      <TextField
                        size="small"
                        value={item.per}
                        onChange={(e) => handleItemChange(index, 'per', e.target.value)}
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        sx={{
                          p: 0.5,
                          bgcolor: '#ffffff',
                          borderRadius: 1,
                          border: '1px solid #cbd5e1',
                          px: 1,
                          width: '100%',
                          '& input': { textAlign: 'center' },
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        placeholder="0.00"
                        value={item.rate === 0 ? '' : item.rate}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'rate',
                            e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                          )
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
                      ₹{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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

          {/* Tax Calculation & Totals Box */}
          <Box
            sx={{
              mt: 2.5,
              p: 2,
              bgcolor: '#f8fafc',
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {/* Tax Settings */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isInterstate}
                    onChange={(e) => setFormData({ ...formData, isInterstate: e.target.checked })}
                    color="primary"
                  />
                }
                label={<Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{formData.isInterstate ? 'Interstate (IGST)' : 'Intrastate (CGST + SGST)'}</Typography>}
              />

              <TextField
                select
                size="small"
                label="GST Rate"
                value={formData.taxRatePercent}
                onChange={(e) => setFormData({ ...formData, taxRatePercent: Number(e.target.value) })}
                sx={{ width: 130 }}
              >
                <MenuItem value={18}>18% (Standard)</MenuItem>
                <MenuItem value={12}>12%</MenuItem>
                <MenuItem value={5}>5%</MenuItem>
                <MenuItem value={28}>28%</MenuItem>
              </TextField>
            </Box>

            {/* Computed Breakdown */}
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '0.82rem', color: '#64748b' }}>
                Taxable Value: <strong>₹{computedTotals.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </Typography>
              {!formData.isInterstate ? (
                <>
                  <Typography sx={{ fontSize: '0.82rem', color: '#64748b' }}>
                    CGST ({formData.taxRatePercent / 2}%): <strong>₹{computedTotals.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: '#64748b' }}>
                    SGST ({formData.taxRatePercent / 2}%): <strong>₹{computedTotals.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </Typography>
                </>
              ) : (
                <Typography sx={{ fontSize: '0.82rem', color: '#64748b' }}>
                  IGST ({formData.taxRatePercent}%): <strong>₹{computedTotals.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </Typography>
              )}
              <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#1565C0', mt: 0.5 }}>
                Grand Total: ₹{computedTotals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Box>
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
            {initialData ? 'Update Proforma Invoice' : 'Save to Firebase'}
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
