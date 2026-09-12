import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import { X } from 'lucide-react';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import type { TooltipProps } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import { fetchExpenseRegistersByYear } from '../services/expenseRegister.service';
import type { ExpenseRegisterDoc } from '../types/expenseRegister.types';
import { fmtAmount, getWeeksForMonth } from '../types/expenseRegister.types';

interface YearlyExpenseSummaryProps {
  year: string;
}

const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: 'rgba(0, 0, 0, 0.87)',
    boxShadow: theme.shadows[4],
    fontSize: 13,
    maxWidth: 400,
    border: '1px solid #e2e8f0',
    padding: '16px',
    borderRadius: '8px',
  },
}));

export const YearlyExpenseSummary: React.FC<YearlyExpenseSummaryProps> = ({ year }) => {
  const [data, setData] = useState<ExpenseRegisterDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<ExpenseRegisterDoc | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const results = await fetchExpenseRegistersByYear(year);
        if (mounted) setData(results);
      } catch (error) {
        console.error('Failed to load yearly summary:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [year]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Card sx={{
        mt: 4, mb: 3, py: 8, textAlign: 'center', borderRadius: 1,
        border: '2px dashed #cbd5e1', backgroundColor: '#f8fafc',
      }}>
        <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600 }}>
          No historical data found for {year}
        </Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
          Create expense registers for this year to see them listed here.
        </Typography>
      </Card>
    );
  }

  const modalWeeks = selectedDoc ? getWeeksForMonth(selectedDoc.year, selectedDoc.month) : [];

  return (
    <Card sx={{
      mt: 4, mb: 3, borderRadius: 1, overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0',
    }}>
      <Box sx={{
        background: `linear-gradient(135deg, #1a2a5e, #243b7f)`,
        px: 3, py: 1.5, textAlign: 'center',
      }}>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}>
          Yearly Expense Summary ({year})
        </Typography>
      </Box>
      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>S.No</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Year</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Week 1</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Week 2</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Week 3</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Week 4</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Week 5</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Week 6</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#f5c4a1' }}>Total Spending</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((doc, index) => {
              const hoverContent = (
                <Box sx={{ minWidth: 250 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, borderBottom: '1px solid #e2e8f0', pb: 0.5 }}>
                    {doc.month} {doc.year} Breakdown
                  </Typography>
                  <Table size="small" sx={{ '& td, & th': { borderBottom: 'none', py: 0.5, px: 0 } }}>
                    <TableBody>
                      {(doc.expenseCategories || []).map(cat => (
                        <TableRow key={cat.categoryId}>
                          <TableCell sx={{ fontSize: '0.75rem', color: '#475569' }}>
                            {cat.categoryName}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            {fmtAmount(cat.monthlyTotal || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              );

              return (
                <TableRow key={doc.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <LightTooltip title={hoverContent} placement="right" arrow>
                      <Typography 
                        onClick={() => setSelectedDoc(doc)}
                        sx={{ cursor: 'pointer', fontWeight: 600, color: '#1976D2', textDecoration: 'underline dashed', textUnderlineOffset: 4 }}
                      >
                        {doc.month}
                      </Typography>
                    </LightTooltip>
                  </TableCell>
                  <TableCell>{doc.year}</TableCell>
                  <TableCell align="right">{fmtAmount(doc.weeklyTotals?.week1 || 0)}</TableCell>
                  <TableCell align="right">{fmtAmount(doc.weeklyTotals?.week2 || 0)}</TableCell>
                  <TableCell align="right">{fmtAmount(doc.weeklyTotals?.week3 || 0)}</TableCell>
                  <TableCell align="right">{fmtAmount(doc.weeklyTotals?.week4 || 0)}</TableCell>
                  <TableCell align="right">{fmtAmount(doc.weeklyTotals?.week5 || 0)}</TableCell>
                  <TableCell align="right">{fmtAmount(doc.weeklyTotals?.week6 || 0)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: 'rgba(245, 196, 161, 0.3)' }}>
                    {fmtAmount(doc.grandTotal || 0)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ─── Full Report Dialog ───────────────────────────────────────── */}
      <Dialog 
        open={!!selectedDoc} 
        onClose={() => setSelectedDoc(null)} 
        maxWidth="lg" 
        fullWidth
        sx={{ "& .MuiDialog-paper": { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: '#1a2a5e', color: '#fff', pb: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
            Expense Report - {selectedDoc?.month} {selectedDoc?.year}
          </Typography>
          <IconButton onClick={() => setSelectedDoc(null)} sx={{ color: '#fff' }}>
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, backgroundColor: '#f8fafc' }}>
          {selectedDoc && (
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#e2e8f0' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>S.No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    {modalWeeks.map((w) => (
                      <TableCell key={w.key} align="right" sx={{ fontWeight: 700 }}>
                        <div>{w.label}</div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 500, opacity: 0.85 }}>({w.dateRange})</div>
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#f5c4a1' }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(selectedDoc.expenseCategories || []).map((cat, index) => {
                    const wa = cat.weeklyAmounts || {};
                    return (
                      <TableRow key={cat.categoryId} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#334155' }}>{cat.categoryName}</TableCell>
                        {modalWeeks.map((w) => (
                          <TableCell key={w.key} align="right">{fmtAmount((wa as any)[w.key] || 0)}</TableCell>
                        ))}
                        <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: 'rgba(245, 196, 161, 0.3)' }}>
                          {fmtAmount(cat.monthlyTotal || 0)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {/* Grand Total Row */}
                  <TableRow sx={{ backgroundColor: '#d6e4f0' }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 800, textAlign: 'center' }}>GRAND TOTAL</TableCell>
                    {modalWeeks.map((w) => (
                      <TableCell key={w.key} align="right" sx={{ fontWeight: 800 }}>
                        {fmtAmount((selectedDoc.weeklyTotals as any)?.[w.key] || 0)}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#7c2d12', backgroundColor: '#f5c4a1' }}>
                      ₹ {fmtAmount(selectedDoc.grandTotal || 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
