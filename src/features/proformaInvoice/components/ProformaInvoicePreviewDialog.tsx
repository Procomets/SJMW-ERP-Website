import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { X, Download, Printer } from 'lucide-react';
import type { ProformaInvoice } from '../types/proformaInvoice.types';
import {
  downloadProformaInvoicePdf,
  getProformaInvoicePdfDataUri,
} from '../utils/proformaInvoicePdf';

interface Props {
  open: boolean;
  onClose: () => void;
  invoice: ProformaInvoice | null;
}

export const ProformaInvoicePreviewDialog: React.FC<Props> = ({ open, onClose, invoice }) => {
  if (!invoice) return null;

  let pdfDataUri = '';
  try {
    pdfDataUri = getProformaInvoicePdfDataUri(invoice);
  } catch (err) {
    console.error('Failed to generate preview PDF', err);
  }

  const handleDownload = () => {
    downloadProformaInvoicePdf(invoice);
  };

  const handlePrint = () => {
    const iframe = document.getElementById('pi-pdf-preview-frame') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } else {
      handleDownload();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1.5,
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
            Proforma Invoice Preview
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            {invoice.invoiceNo} &bull; {invoice.buyer?.name || invoice.consignee?.name}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, flex: 1, bgcolor: '#f1f5f9' }}>
        {pdfDataUri ? (
          <iframe
            id="pi-pdf-preview-frame"
            src={pdfDataUri}
            title="Proforma Invoice PDF Preview"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#525659',
            }}
          />
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error">Unable to generate PDF preview.</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid #e2e8f0', gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Close
        </Button>
        <Button
          onClick={handlePrint}
          variant="outlined"
          color="primary"
          startIcon={<Printer size={18} />}
        >
          Print
        </Button>
        <Button
          onClick={handleDownload}
          variant="contained"
          sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
          startIcon={<Download size={18} />}
        >
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};
