import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Grid, Chip, Divider,
} from '@mui/material';
import {
  X, Building2, MapPin, FileText, Phone, CreditCard,
  Calendar, User, Hash, Globe, Mail, Smartphone,
} from 'lucide-react';
import type { VendorMaster } from '../types/vendorMaster.types';

interface Props {
  open: boolean;
  onClose: () => void;
  vendor: VendorMaster | null;
}

const LabelValue = ({ label, value, mono }: { label: string; value?: string; mono?: boolean }) => (
  <Box>
    <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.25 }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: value ? '#1e293b' : '#cbd5e1', fontFamily: mono ? 'monospace' : undefined }}>
      {value || '—'}
    </Typography>
  </Box>
);

const SectionCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <Box sx={{ mb: 2.5 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      <Box sx={{ color: '#1565C0' }}>{icon}</Box>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.7 }}>{title}</Typography>
    </Box>
    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
      {children}
    </Box>
  </Box>
);

const formatDate = (ts: any) => {
  if (!ts) return '—';
  if (typeof ts.toDate === 'function') {
    return ts.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  return '…';
};

const categoryColors: Record<string, { bg: string; color: string; border: string }> = {
  Supplier: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  Customer: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  Both: { bg: '#fdf4ff', color: '#9333ea', border: '#e9d5ff' },
};

const statusColors: Record<string, { bg: string; color: string; border: string }> = {
  Active: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  Inactive: { bg: '#fef9c3', color: '#b45309', border: '#fde68a' },
  Blocked: { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
};

const VendorViewDialog = ({ open, onClose, vendor }: Props) => {
  if (!vendor) return null;

  const catStyle = categoryColors[vendor.vendorCategory] || categoryColors.Supplier;
  const stsStyle = statusColors[vendor.status] || statusColors.Active;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxHeight: '92vh' } }}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>
                {vendor.vendorName}
              </Typography>
              <Chip
                label={vendor.vendorCategory}
                size="small"
                sx={{ fontSize: '0.65rem', fontWeight: 700, bgcolor: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}` }}
              />
              <Chip
                label={vendor.status}
                size="small"
                sx={{ fontSize: '0.65rem', fontWeight: 700, bgcolor: stsStyle.bg, color: stsStyle.color, border: `1px solid ${stsStyle.border}` }}
              />
            </Box>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
              {vendor.vendorCode} · {vendor.vendorType}
            </Typography>
          </Box>
        </Box>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>
          <X size={20} />
        </button>
      </DialogTitle>

      <DialogContent sx={{ py: 2.5, px: 3, overflowY: 'auto' }}>
        {/* Company Address */}
        <SectionCard title="Company Address" icon={<MapPin size={14} />}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <LabelValue label="Address" value={[vendor.companyAddress.addressLine1, vendor.companyAddress.addressLine2].filter(Boolean).join(', ')} />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <LabelValue label="City" value={vendor.companyAddress.city} />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <LabelValue label="District" value={vendor.companyAddress.district} />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <LabelValue label="Pin Code" value={vendor.companyAddress.pinCode} mono />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <LabelValue label="State" value={vendor.companyAddress.state} />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <LabelValue label="State Code" value={vendor.companyAddress.stateCode} mono />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <LabelValue label="Country" value={vendor.companyAddress.country} />
            </Grid>
          </Grid>
        </SectionCard>

        {/* Compliance */}
        <SectionCard title="GST & Tax Compliance" icon={<FileText size={14} />}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 4 }}>
              <LabelValue label="GST Registration" value={vendor.gstRegistered ? 'Registered' : 'Unregistered'} />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <LabelValue label="GST Number" value={vendor.gstNumber} mono />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <LabelValue label="PAN Number" value={vendor.panNumber} mono />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <LabelValue label="TAN Number" value={vendor.tanNumber} mono />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <LabelValue label="MSME Number" value={vendor.msmeNumber} />
            </Grid>
            {vendor.vendorType === 'Proprietorship' && (
              <Grid size={{ xs: 4 }}>
                <LabelValue label="Aadhaar Number" value={vendor.aadhaarNumber ? vendor.aadhaarNumber.replace(/\d(?=\d{4})/g, '*') : undefined} mono />
              </Grid>
            )}
          </Grid>
        </SectionCard>

        {/* Contact */}
        <SectionCard title="Contact Information" icon={<Phone size={14} />}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <User size={12} color="#64748b" />
                <LabelValue label="Contact Person" value={vendor.contactPersonName} />
              </Box>
            </Grid>
            <Grid size={{ xs: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Smartphone size={12} color="#64748b" />
                <LabelValue label="Contact Number" value={vendor.contactNumber} mono />
              </Box>
            </Grid>
            <Grid size={{ xs: 3 }}>
              <LabelValue label="Alternate Contact" value={vendor.alternateContactNumber} mono />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Mail size={12} color="#64748b" />
                <LabelValue label="Email" value={vendor.email} />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Globe size={12} color="#64748b" />
                <LabelValue label="Website" value={vendor.website} />
              </Box>
            </Grid>
          </Grid>
        </SectionCard>

        {/* Bank Details */}
        {vendor.bankDetails && (vendor.bankDetails.bankName || vendor.bankDetails.accountNumber) && (
          <SectionCard title="Bank Account Details" icon={<CreditCard size={14} />}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <LabelValue label="Bank Name" value={vendor.bankDetails.bankName} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <LabelValue label="Branch Name" value={vendor.bankDetails.branchName} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <LabelValue label="Account Number" value={vendor.bankDetails.accountNumber ? '•••• ' + vendor.bankDetails.accountNumber.slice(-4) : undefined} mono />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <LabelValue label="IFSC Code" value={vendor.bankDetails.ifscCode} mono />
              </Grid>
            </Grid>
          </SectionCard>
        )}

        <Divider sx={{ my: 1 }} />

        {/* Audit Trail */}
        <SectionCard title="Audit Trail" icon={<Calendar size={14} />}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Hash size={11} color="#64748b" />
                <LabelValue label="Vendor Code" value={vendor.vendorCode} mono />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <LabelValue label="Created By" value={vendor.createdBy} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <LabelValue label="Created At" value={formatDate(vendor.createdAt)} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <LabelValue label="Last Updated By" value={vendor.updatedBy} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <LabelValue label="Last Updated At" value={formatDate(vendor.updatedAt)} />
            </Grid>
          </Grid>
        </SectionCard>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #e2e8f0', py: 2, px: 3, bgcolor: '#f8fafc' }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VendorViewDialog;
