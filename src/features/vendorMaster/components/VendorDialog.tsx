import { useState, useEffect } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, Divider,
  CircularProgress, MenuItem, Grid, FormControlLabel,
  Switch, Stepper, Step, StepLabel, Chip,
} from '@mui/material';
import { X, Building2, MapPin, FileText, Phone, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import type { VendorMaster, VendorMasterFormData } from '../types/vendorMaster.types';
import {
  getEmptyVendorForm,
  VENDOR_CATEGORIES,
  VENDOR_TYPES,
  INDIA_STATES,
} from '../types/vendorMaster.types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (form: VendorMasterFormData) => Promise<void>;
  editVendor?: VendorMaster | null;
}

const STEPS = [
  { label: 'Basic Info', icon: <Building2 size={14} /> },
  { label: 'Address', icon: <MapPin size={14} /> },
  { label: 'Compliance', icon: <FileText size={14} /> },
  { label: 'Contact', icon: <Phone size={14} /> },
  { label: 'Bank Details', icon: <CreditCard size={14} /> },
];

// Section heading helper
const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <Typography sx={{
    fontSize: '0.65rem', fontWeight: 700, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.5, mt: 0.5,
  }}>
    {children}
  </Typography>
);

const VendorDialog = ({ open, onClose, onSave, editVendor }: Props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [form, setForm] = useState<VendorMasterFormData>(getEmptyVendorForm());
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editVendor) {
      setForm({
        vendorName: editVendor.vendorName,
        vendorCategory: editVendor.vendorCategory,
        vendorType: editVendor.vendorType,
        companyAddress: { ...editVendor.companyAddress },
        gstRegistered: editVendor.gstRegistered,
        gstNumber: editVendor.gstNumber ?? '',
        panNumber: editVendor.panNumber ?? '',
        tanNumber: editVendor.tanNumber ?? '',
        msmeNumber: editVendor.msmeNumber ?? '',
        aadhaarNumber: editVendor.aadhaarNumber ?? '',
        contactPersonName: editVendor.contactPersonName ?? '',
        contactNumber: editVendor.contactNumber ?? '',
        alternateContactNumber: editVendor.alternateContactNumber ?? '',
        email: editVendor.email ?? '',
        website: editVendor.website ?? '',
        bankDetails: editVendor.bankDetails
          ? { ...editVendor.bankDetails }
          : { bankName: '', accountNumber: '', ifscCode: '', branchName: '' },
        status: editVendor.status,
      });
    } else {
      setForm(getEmptyVendorForm());
    }
    setStep(0);
    setError('');
  }, [editVendor, open]);

  const set = (key: keyof VendorMasterFormData, val: any) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const setAddress = (key: keyof VendorMasterFormData['companyAddress'], val: string) =>
    setForm((prev) => ({ ...prev, companyAddress: { ...prev.companyAddress, [key]: val } }));

  const setBank = (key: keyof VendorMasterFormData['bankDetails'], val: string) =>
    setForm((prev) => ({ ...prev, bankDetails: { ...prev.bankDetails, [key]: val } }));

  const handleStateChange = (stateName: string) => {
    const found = INDIA_STATES.find((s) => s.name === stateName);
    setForm((prev) => ({
      ...prev,
      companyAddress: {
        ...prev.companyAddress,
        state: stateName,
        stateCode: found?.code ?? '',
      },
    }));
  };

  // Validate per step
  const validateStep = (s: number): string => {
    if (s === 0) {
      if (!form.vendorName.trim()) return 'Vendor Name is required.';
    }
    if (s === 1) {
      if (!form.companyAddress.addressLine1.trim()) return 'Address Line 1 is required.';
      if (!form.companyAddress.city.trim()) return 'City is required.';
      if (!form.companyAddress.state) return 'State is required.';
      if (!form.companyAddress.pinCode.trim()) return 'Pin Code is required.';
      if (!/^\d{6}$/.test(form.companyAddress.pinCode.trim())) return 'Pin Code must be 6 digits.';
    }
    if (s === 2) {
      if (form.gstRegistered && !form.gstNumber?.trim()) return 'GST Number is required when GST Registered.';
      if (form.gstNumber?.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstNumber.trim()))
        return 'Invalid GST Number format.';
      if (form.panNumber?.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber.trim()))
        return 'Invalid PAN Number format. (e.g. ABCDE1234F)';
    }
    if (s === 3) {
      if (form.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
        return 'Invalid email address format.';
      if (form.contactNumber?.trim() && !/^[6-9]\d{9}$/.test(form.contactNumber.trim()))
        return 'Invalid contact number. Must be 10 digits starting with 6-9.';
    }
    if (s === 4) {
      if (form.bankDetails?.ifscCode?.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.bankDetails.ifscCode.trim()))
        return 'Invalid IFSC Code format. (e.g. SBIN0001234)';
    }
    return '';
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSave = async () => {
    // Validate all steps
    for (let i = 0; i < STEPS.length; i++) {
      const err = validateStep(i);
      if (err) { setStep(i); setError(err); return; }
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save vendor.');
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!editVendor;

  const categoryColors: Record<string, { bg: string; color: string; border: string }> = {
    Supplier: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    Customer: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    Both: { bg: '#fdf4ff', color: '#9333ea', border: '#e9d5ff' },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      slotProps={{ paper: { sx: { borderRadius: isMobile ? 0 : 3, maxHeight: isMobile ? '100vh' : '92vh' } } }}
    >
      {/* Header */}
      <DialogTitle sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #e2e8f0', py: 2, px: 3, bgcolor: '#f8fafc',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, bgcolor: '#1565C0', color: 'white', borderRadius: 1.5, display: 'flex' }}>
            <Building2 size={18} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>
              {isEdit ? 'Edit Vendor / Customer' : 'Add New Vendor / Customer'}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>
              {isEdit ? `Editing: ${editVendor?.vendorCode} · ${editVendor?.vendorName}` : 'Register a new entity in Vendor Master'}
            </Typography>
          </Box>
        </Box>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}
        >
          <X size={20} />
        </button>
      </DialogTitle>

      {/* Stepper */}
      <Box sx={{ px: 3, pt: 2.5, pb: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Stepper activeStep={step} alternativeLabel>
            {STEPS.map((s, i) => (
              <Step key={s.label} completed={i < step}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontSize: '0.7rem',
                      fontWeight: i === step ? 700 : 500,
                      color: i === step ? '#1565C0' : i < step ? '#15803d' : '#94a3b8',
                      mt: 0.5,
                    },
                    '& .MuiStepIcon-root': {
                      color: i < step ? '#15803d' : i === step ? '#1565C0' : '#e2e8f0',
                      width: 24, height: 24,
                    },
                    '& .MuiStepIcon-text': { fontSize: '0.6rem', fontWeight: 700 },
                  }}
                >
                  {s.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        <Box sx={{ display: { xs: 'block', sm: 'none' }, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1565C0' }}>
            Step {step + 1} of {STEPS.length}: {STEPS[step].label}
          </Typography>
        </Box>
      </Box>

      <DialogContent sx={{ py: 2.5, px: 3, overflowY: 'auto' }}>
        {/* Error banner */}
        {error && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 1.5 }}>
            <Typography sx={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 600 }}>⚠ {error}</Typography>
          </Box>
        )}

        {/* ────── STEP 0: Basic Info ────── */}
        {step === 0 && (
          <Box>
            <SectionHeading>Business Identity</SectionHeading>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Vendor / Company Name *"
                  size="small"
                  fullWidth
                  value={form.vendorName}
                  onChange={(e) => set('vendorName', e.target.value)}
                  placeholder="e.g. ABC Metals Pvt Ltd"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Vendor Category *"
                  size="small"
                  select
                  fullWidth
                  value={form.vendorCategory}
                  onChange={(e) => set('vendorCategory', e.target.value)}
                >
                  {VENDOR_CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                          width: 8, height: 8, borderRadius: '50%',
                          bgcolor: c === 'Supplier' ? '#1d4ed8' : c === 'Customer' ? '#15803d' : '#9333ea',
                        }} />
                        {c}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Vendor Type *"
                  size="small"
                  select
                  fullWidth
                  value={form.vendorType}
                  onChange={(e) => set('vendorType', e.target.value)}
                >
                  {VENDOR_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Preview category chip */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0', display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Role in ERP:</Typography>
                  <Chip
                    label={form.vendorCategory}
                    size="small"
                    sx={{
                      fontSize: '0.7rem', fontWeight: 700,
                      bgcolor: categoryColors[form.vendorCategory]?.bg,
                      color: categoryColors[form.vendorCategory]?.color,
                      border: `1px solid ${categoryColors[form.vendorCategory]?.border}`,
                    }}
                  />
                  <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    {form.vendorCategory === 'Supplier' && '· Supplies raw materials to company'}
                    {form.vendorCategory === 'Customer' && '· Purchases finished goods from company'}
                    {form.vendorCategory === 'Both' && '· Supplies raw materials AND purchases finished goods'}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Status"
                  size="small"
                  select
                  fullWidth
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                >
                  <MenuItem value="Active"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e' }} />Active</Box></MenuItem>
                  <MenuItem value="Inactive"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b' }} />Inactive</Box></MenuItem>
                  <MenuItem value="Blocked"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444' }} />Blocked</Box></MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* ────── STEP 1: Address ────── */}
        {step === 1 && (
          <Box>
            <SectionHeading>Company Address</SectionHeading>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Address Line 1 *"
                  size="small"
                  fullWidth
                  value={form.companyAddress.addressLine1}
                  onChange={(e) => setAddress('addressLine1', e.target.value)}
                  placeholder="Street / Building / Plot No."
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Address Line 2"
                  size="small"
                  fullWidth
                  value={form.companyAddress.addressLine2}
                  onChange={(e) => setAddress('addressLine2', e.target.value)}
                  placeholder="Area / Landmark"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="City *"
                  size="small"
                  fullWidth
                  value={form.companyAddress.city}
                  onChange={(e) => setAddress('city', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="District"
                  size="small"
                  fullWidth
                  value={form.companyAddress.district}
                  onChange={(e) => setAddress('district', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="State *"
                  size="small"
                  select
                  fullWidth
                  value={form.companyAddress.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                >
                  {INDIA_STATES.map((s) => (
                    <MenuItem key={s.code} value={s.name}>{s.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="State Code"
                  size="small"
                  fullWidth
                  value={form.companyAddress.stateCode}
                  slotProps={{ input: { readOnly: true } }}
                  sx={{ bgcolor: '#f8fafc' }}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="Pin Code *"
                  size="small"
                  fullWidth
                  value={form.companyAddress.pinCode}
                  onChange={(e) => setAddress('pinCode', e.target.value.replace(/\D/, ''))}
                  slotProps={{ htmlInput: { maxLength: 6 } }}
                  placeholder="6 digits"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Country"
                  size="small"
                  fullWidth
                  value={form.companyAddress.country}
                  onChange={(e) => setAddress('country', e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* ────── STEP 2: Compliance ────── */}
        {step === 2 && (
          <Box>
            <SectionHeading>GST & Tax Information</SectionHeading>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Box sx={{
                  p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  bgcolor: form.gstRegistered ? '#eff6ff' : '#f8fafc',
                  transition: 'all 0.2s',
                }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>GST Registration</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {form.gstRegistered ? 'Registered — GST Number is mandatory' : 'Unregistered — No GST Number required'}
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.gstRegistered}
                        onChange={(e) => set('gstRegistered', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={form.gstRegistered ? 'Registered' : 'Unregistered'}
                    labelPlacement="start"
                    sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.78rem', fontWeight: 600, color: form.gstRegistered ? '#1d4ed8' : '#64748b', mr: 1 } }}
                  />
                </Box>
              </Grid>

              {form.gstRegistered && (
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="GST Number *"
                    size="small"
                    fullWidth
                    value={form.gstNumber}
                    onChange={(e) => set('gstNumber', e.target.value.toUpperCase())}
                    placeholder="e.g. 33ABCDE1234F1Z5"
                    slotProps={{ htmlInput: { maxLength: 15, style: { textTransform: 'uppercase', fontFamily: 'monospace' } } }}
                    helperText="15 character GST Identification Number"
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="PAN Number"
                  size="small"
                  fullWidth
                  value={form.panNumber}
                  onChange={(e) => set('panNumber', e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  slotProps={{ htmlInput: { maxLength: 10, style: { textTransform: 'uppercase', fontFamily: 'monospace' } } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="TAN Number"
                  size="small"
                  fullWidth
                  value={form.tanNumber}
                  onChange={(e) => set('tanNumber', e.target.value.toUpperCase())}
                  placeholder="Optional"
                  slotProps={{ htmlInput: { style: { textTransform: 'uppercase', fontFamily: 'monospace' } } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="MSME Number"
                  size="small"
                  fullWidth
                  value={form.msmeNumber}
                  onChange={(e) => set('msmeNumber', e.target.value.toUpperCase())}
                  placeholder="Optional"
                />
              </Grid>

              {form.vendorType === 'Proprietorship' && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Aadhaar Number"
                    size="small"
                    fullWidth
                    value={form.aadhaarNumber}
                    onChange={(e) => set('aadhaarNumber', e.target.value.replace(/\D/, '').slice(0, 12))}
                    placeholder="12 digit Aadhaar"
                    slotProps={{ htmlInput: { maxLength: 12, style: { fontFamily: 'monospace' } } }}
                    helperText="Required for Proprietorship"
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* ────── STEP 3: Contact ────── */}
        {step === 3 && (
          <Box>
            <SectionHeading>Contact Information</SectionHeading>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Contact Person Name"
                  size="small"
                  fullWidth
                  value={form.contactPersonName}
                  onChange={(e) => set('contactPersonName', e.target.value)}
                  placeholder="Primary contact at this company"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Contact Number"
                  size="small"
                  fullWidth
                  value={form.contactNumber}
                  onChange={(e) => set('contactNumber', e.target.value.replace(/\D/, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  slotProps={{ htmlInput: { inputMode: 'numeric' as const, maxLength: 10 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Alternate Contact"
                  size="small"
                  fullWidth
                  value={form.alternateContactNumber}
                  onChange={(e) => set('alternateContactNumber', e.target.value.replace(/\D/, '').slice(0, 10))}
                  placeholder="Optional"
                  slotProps={{ htmlInput: { inputMode: 'numeric' as const, maxLength: 10 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Email Address"
                  size="small"
                  fullWidth
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="company@example.com"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Website"
                  size="small"
                  fullWidth
                  value={form.website}
                  onChange={(e) => set('website', e.target.value)}
                  placeholder="https://www.example.com"
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* ────── STEP 4: Bank Details ────── */}
        {step === 4 && (
          <Box>
            <SectionHeading>Bank Account Details (Optional)</SectionHeading>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Bank Name"
                  size="small"
                  fullWidth
                  value={form.bankDetails.bankName}
                  onChange={(e) => setBank('bankName', e.target.value)}
                  placeholder="e.g. State Bank of India"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Branch Name"
                  size="small"
                  fullWidth
                  value={form.bankDetails.branchName}
                  onChange={(e) => setBank('branchName', e.target.value)}
                  placeholder="e.g. Chennai Main Branch"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Account Number"
                  size="small"
                  fullWidth
                  value={form.bankDetails.accountNumber}
                  onChange={(e) => setBank('accountNumber', e.target.value.replace(/\D/, ''))}
                  placeholder="Bank account number"
                  slotProps={{ htmlInput: { style: { fontFamily: 'monospace' } } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="IFSC Code"
                  size="small"
                  fullWidth
                  value={form.bankDetails.ifscCode}
                  onChange={(e) => setBank('ifscCode', e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0001234"
                  slotProps={{ htmlInput: { maxLength: 11, style: { textTransform: 'uppercase' as const, fontFamily: 'monospace' } } }}
                  helperText="11-character IFSC code"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2.5 }} />

            {/* Summary preview on last step */}
            <SectionHeading>Summary Preview</SectionHeading>
            <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 1.5, border: '1px solid #bbf7d0' }}>
              <Grid container spacing={1}>
                {[
                  { label: 'Name', value: form.vendorName },
                  { label: 'Category', value: form.vendorCategory },
                  { label: 'Type', value: form.vendorType },
                  { label: 'City', value: form.companyAddress.city },
                  { label: 'State', value: form.companyAddress.state },
                  { label: 'GST', value: form.gstRegistered ? (form.gstNumber || '—') : 'Unregistered' },
                  { label: 'PAN', value: form.panNumber || '—' },
                  { label: 'Contact', value: form.contactNumber || '—' },
                  { label: 'Email', value: form.email || '—' },
                  { label: 'Status', value: form.status },
                ].map((item) => (
                  <Grid key={item.label} size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Typography sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, minWidth: 60 }}>{item.label}:</Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#1e293b', fontWeight: 500, wordBreak: 'break-all' }}>{item.value || '—'}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{
        borderTop: '1px solid #e2e8f0', py: 2, px: 3,
        gap: 1, bgcolor: '#f8fafc', justifyContent: 'space-between',
      }}>
        <Button
          onClick={handleBack}
          disabled={step === 0 || saving}
          variant="outlined"
          startIcon={<ChevronLeft size={15} />}
          sx={{ borderRadius: 2, px: 2.5, fontWeight: 600 }}
        >
          Back
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            disabled={saving}
            sx={{ borderRadius: 2, px: 2.5 }}
          >
            Cancel
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              variant="contained"
              endIcon={<ChevronRight size={15} />}
              sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={saving}
              sx={{ borderRadius: 2, px: 4, fontWeight: 600, bgcolor: '#15803d', '&:hover': { bgcolor: '#166534' } }}
            >
              {saving ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={14} sx={{ color: 'white' }} />
                  Saving...
                </Box>
              ) : (isEdit ? 'Update Vendor' : 'Add Vendor')}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default VendorDialog;
