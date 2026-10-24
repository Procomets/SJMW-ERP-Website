import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import { X, Download, Printer, Maximize2, Minimize2 } from 'lucide-react';
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
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

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

  const paperStyles = {
    borderRadius: isFullScreen ? 0 : 3,
    height: isFullScreen ? '100vh' : '92vh',
    maxHeight: isFullScreen ? '100vh' : '92vh',
    width: isFullScreen ? '100vw' : '96vw',
    maxWidth: isFullScreen ? '100vw' : '1350px',
    m: isFullScreen ? 0 : 2,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isFullScreen}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: paperStyles,
        },
      }}
      PaperProps={{
        sx: paperStyles,
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          py: 1.5,
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}>
            <IconButton size="small" onClick={() => setIsFullScreen((prev) => !prev)}>
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#525659',
          overflow: 'hidden',
          height: isFullScreen ? 'calc(100vh - 130px)' : 'calc(92vh - 130px)',
          minHeight: '600px',
        }}
      >
        {pdfDataUri ? (
          <iframe
            id="pi-pdf-preview-frame"
            src={pdfDataUri}
            title="Proforma Invoice PDF Preview"
            style={{
              width: '100%',
              height: '100%',
              flex: 1,
              minHeight: '600px',
              border: 'none',
              backgroundColor: '#525659',
              display: 'block',
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
