import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { getDaysInMonth, isSunday, format } from 'date-fns';
import { Save } from 'lucide-react';
import type { Employee } from '../../employeeMaster/types/employee';
import type { AttendanceRecord } from '../../attendance/types/attendance';
import type { SalaryRecord } from '../types/salarySheet';
import { exportFifteenDaysSalaryToExcel } from '../utils/salarySheetExport';
import { exportFifteenDaysSalaryToPdf } from '../utils/salarySheetPdfExport';

export interface SalaryTableRef {
  exportExcel: () => void;
  exportPdf: () => void;
}

interface FifteenDaysSalaryTableProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  salaryRecords: SalaryRecord[];
  currentMonth: Date;
  monthYearStr: string;
  onSaveRecord: (record: Omit<SalaryRecord, 'id' | 'updatedAt'>) => Promise<void>;
  onSaveAllRecords: (records: Omit<SalaryRecord, 'id' | 'updatedAt'>[]) => Promise<void>;
}

type Period = 'first15' | 'next15';

const FifteenDaysSalaryTable = React.forwardRef<SalaryTableRef, FifteenDaysSalaryTableProps>(({
  employees,
  attendanceRecords,
  salaryRecords,
  currentMonth,
  monthYearStr,
  onSaveRecord,
  onSaveAllRecords,
}, ref) => {
  const [period, setPeriod] = useState<Period>('first15');
  const [editableRows, setEditableRows] = useState<Record<string, { previousHolding: number, holdingAmount: number }>>({});
  const [commissionRate, setCommissionRate] = useState<number>(0);

  // Initialize editable state
  useEffect(() => {
    const stateMap: Record<string, { previousHolding: number, holdingAmount: number }> = {};
    let initialCommissionRate = 0;
    
    employees.forEach(emp => {
      const record = salaryRecords.find(r => r.employeeId === emp.employeeId && r.period === period);
      
      // Look for the first valid commission rate
      if (record && record.commissionRate !== undefined && record.commissionRate !== null && initialCommissionRate === 0) {
        const parsedRate = parseFloat(String(record.commissionRate));
        if (!isNaN(parsedRate) && parsedRate > 0) {
          initialCommissionRate = parsedRate;
        }
      }
      
      stateMap[emp.employeeId] = {
        previousHolding: record?.previousHolding || 0,
        holdingAmount: record?.holdingAmount || 0,
      };
    });
    
    setEditableRows(stateMap);
    setCommissionRate(initialCommissionRate);
  }, [employees, salaryRecords, period]);

  React.useImperativeHandle(ref, () => ({
    exportExcel: () => {
      exportFifteenDaysSalaryToExcel(employees, attendanceRecords, currentMonth, period, editableRows, commissionRate);
    },
    exportPdf: () => {
      exportFifteenDaysSalaryToPdf(employees, attendanceRecords, currentMonth, period, editableRows, commissionRate);
    }
  }), [employees, attendanceRecords, currentMonth, period, editableRows, commissionRate]);

  const handlePeriodChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPeriod: Period | null,
  ) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod);
    }
  };

  const handleInputChange = (employeeId: string, field: 'previousHolding' | 'holdingAmount', value: string) => {
    setEditableRows(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const handleSave = (employeeId: string) => {
    const data = editableRows[employeeId];
    // We only update the 15-day specific fields, and keep the others default or 0
    // so it doesn't break the SalaryRecord type.
    // Calculate present count for commissionAmount
    let presentCount = 0;
    const startDay = period === 'first15' ? 1 : 16;
    const endDay = period === 'first15' ? 15 : getDaysInMonth(currentMonth);
    for (let i = startDay; i <= endDay; i++) {
      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const dateStr = format(dateObj, 'yyyy-MM-dd');
      const attRecord = attendanceRecords.find(r => r.employeeId === employeeId && r.date === dateStr);
      if (attRecord?.status === 'Present') {
        presentCount++;
      } else if (attRecord?.status === 'P/N') {
        presentCount += 2;
      }
    }
    
    onSaveRecord({
      employeeId,
      monthYear: monthYearStr,
      period: period,
      asOnDateSalary: 0,
      hike: 0,
      pf: 0,
      esi: 0,
      salaryAdvance: 0,
      lop: 0,
      remark: '',
      previousHolding: data.previousHolding || 0,
      holdingAmount: data.holdingAmount || 0,
      commissionRate: commissionRate,
      commissionAmount: presentCount * commissionRate,
      updatedBy: '' 
    });
  };

  const handleSaveAll = () => {
    const recordsToSave = employees.map(emp => {
      const data = editableRows[emp.employeeId] || { previousHolding: 0, holdingAmount: 0 };
      
      let presentCount = 0;
      const startDay = period === 'first15' ? 1 : 16;
      const endDay = period === 'first15' ? 15 : getDaysInMonth(currentMonth);
      for (let i = startDay; i <= endDay; i++) {
        const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
        const dateStr = format(dateObj, 'yyyy-MM-dd');
        const attRecord = attendanceRecords.find(r => r.employeeId === emp.employeeId && r.date === dateStr);
        if (attRecord?.status === 'Present') {
          presentCount++;
        } else if (attRecord?.status === 'P/N') {
          presentCount += 2;
        }
      }

      return {
        employeeId: emp.employeeId,
        monthYear: monthYearStr,
        period: period,
        asOnDateSalary: 0,
        hike: 0,
        pf: 0,
        esi: 0,
        salaryAdvance: 0,
        lop: 0,
        remark: '',
        previousHolding: data.previousHolding || 0,
        holdingAmount: data.holdingAmount || 0,
        commissionRate: commissionRate,
        commissionAmount: presentCount * commissionRate,
        updatedBy: '' 
      };
    });
    onSaveAllRecords(recordsToSave);
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const startDay = period === 'first15' ? 1 : 16;
  const endDay = period === 'first15' ? 15 : daysInMonth;
  
  const dates: Date[] = [];
  for (let i = startDay; i <= endDay; i++) {
    dates.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  // Header styles
  const headerStyle = {
    backgroundColor: '#002060',
    color: '#ffffff',
    fontWeight: 'bold',
    borderRight: '1px solid #4f4f4f',
    fontSize: '0.75rem',
    p: 1,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    textAlign: 'center' as const
  };

  const cellStyle = {
    p: 0.5,
    borderRight: '1px solid #e0e0e0',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap'
  };

  const inputStyle = {
    '& .MuiInputBase-input': { p: '4px 6px', fontSize: '0.8rem', width: '60px', textAlign: 'right' }
  };

  let totalNetAmount = 0;
  let totalPayableAmount = 0;
  let totalOverallPresent = 0;
  
  const dailyPresentCount = new Array(dates.length).fill(0);

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ToggleButtonGroup
          color="primary"
          value={period}
          exclusive
          onChange={handlePeriodChange}
          size="small"
        >
          <ToggleButton value="first15">First 15 Days (1-15)</ToggleButton>
          <ToggleButton value="next15">Next 15 Days (16-End)</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Per Person Commission Rate (Rs/day):</Typography>
          <TextField 
            size="small" 
            type="number"
            sx={{ width: 100 }}
            value={commissionRate === 0 ? '' : commissionRate}
            onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
          />
          <Button variant="contained" color="primary" onClick={handleSaveAll} startIcon={<Save size={18} />}>
            Save All
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: '75vh', overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell colSpan={dates.length + 7} align="center" sx={{ backgroundColor: '#002060', color: '#fff', fontWeight: 'bold', fontSize: '1rem', py: 1 }}>
                LABOUR WAGES {format(dates[0], 'dd-MM-yyyy')} To {format(dates[dates.length - 1], 'dd-MM-yyyy')}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={headerStyle}>S.NO.</TableCell>
              <TableCell sx={headerStyle}>NAME</TableCell>
              {dates.map((d, i) => (
                <TableCell key={i} sx={headerStyle}>{format(d, 'dd.MM.yy')}</TableCell>
              ))}
              <TableCell sx={headerStyle}>WAGES<br/>PER</TableCell>
              <TableCell sx={headerStyle}>WORKING<br/>DAYS</TableCell>
              <TableCell sx={headerStyle}>NET<br/>AMOUNT</TableCell>
              <TableCell sx={headerStyle}>HOLDING<br/>AMOUNT</TableCell>
              <TableCell sx={headerStyle}>PAYABLE<br/>AMOUNT</TableCell>
              <TableCell sx={headerStyle}>ACTION</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((emp, index) => {
              const rowState = editableRows[emp.employeeId] || { previousHolding: 0, holdingAmount: 0 };
              
              const wagesPer = parseFloat(String(emp.dailyWages || 0)) || 0;
              let presentCount = 0;

              const dateCells = dates.map((dateObj, dIndex) => {
                const dateStr = format(dateObj, 'yyyy-MM-dd');
                const attRecord = attendanceRecords.find(r => r.employeeId === emp.employeeId && r.date === dateStr);
                
                let cellValue = '';
                let bgColor = 'inherit';
                if (attRecord?.status === 'Present') {
                  cellValue = 'P';
                  presentCount++;
                  dailyPresentCount[dIndex]++;
                } else if (attRecord?.status === 'P/N') {
                  cellValue = 'P/N';
                  presentCount += 2;
                  dailyPresentCount[dIndex] += 2;
                } else if (isSunday(dateObj)) {
                  cellValue = 'Sunday';
                  bgColor = '#92d050'; // Green background for Sunday
                } else if (attRecord?.status === 'Absent') {
                  cellValue = 'A';
                }

                return (
                  <TableCell key={dIndex} align="center" sx={{ ...cellStyle, backgroundColor: bgColor, fontWeight: cellValue === 'Sunday' ? 'bold' : 'normal' }}>
                    {cellValue}
                  </TableCell>
                );
              });

              const netAmount = wagesPer * presentCount;
              const payableAmount = netAmount + (rowState.previousHolding || 0) - (rowState.holdingAmount || 0);

              totalNetAmount += netAmount;
              totalPayableAmount += payableAmount;
              totalOverallPresent += presentCount;

              return (
                <TableRow key={emp.employeeId} hover>
                  <TableCell align="center" sx={cellStyle}>{index + 1}</TableCell>
                  <TableCell sx={{ ...cellStyle, backgroundColor: '#f4b084' }}>{emp.fullName}</TableCell>
                  
                  {dateCells}

                  <TableCell align="right" sx={cellStyle}>{wagesPer.toFixed(2)}</TableCell>
                  <TableCell align="center" sx={cellStyle}>{presentCount}</TableCell>
                  <TableCell align="right" sx={{ ...cellStyle, backgroundColor: '#ffff00', fontWeight: 'bold' }}>
                    {netAmount.toFixed(2)}
                  </TableCell>
                  
                  <TableCell sx={cellStyle}>
                    <TextField 
                      size="small" 
                      variant="outlined" 
                      sx={inputStyle} 
                      value={(rowState.holdingAmount === 0 || rowState.holdingAmount === undefined) ? '' : rowState.holdingAmount} 
                      onChange={e => handleInputChange(emp.employeeId, 'holdingAmount', e.target.value)} 
                    />
                  </TableCell>
                  
                  <TableCell align="right" sx={{ ...cellStyle, backgroundColor: '#f4b084', fontWeight: 'bold' }}>
                    {payableAmount.toFixed(2)}
                  </TableCell>

                  <TableCell sx={cellStyle}>
                    <Button size="small" variant="contained" color="primary" onClick={() => handleSave(emp.employeeId)} sx={{ minWidth: 40, p: 0.5 }}>
                      <Save size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Footer Row 1 */}
            <TableRow>
              <TableCell colSpan={2} align="center" sx={{ backgroundColor: '#002060', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem' }}>
                NO.OF.P
              </TableCell>
              {dailyPresentCount.map((count, i) => (
                <TableCell key={i} align="center" sx={{ backgroundColor: '#002060', color: '#fff', fontWeight: 'bold' }}>
                  {count > 0 ? count : ''}
                </TableCell>
              ))}
              <TableCell align="center"></TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                {totalOverallPresent}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: '#000', backgroundColor: '#ffff00' }}>
                {totalNetAmount.toFixed(2)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                TOTAL
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                {totalPayableAmount.toFixed(2)}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
            
            {/* Footer Row 2 */}
            <TableRow>
              <TableCell colSpan={dates.length + 6} align="right" sx={{ fontWeight: 'bold' }}>
                Commission
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                {(totalOverallPresent * commissionRate).toFixed(2)}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>

            {/* Footer Row 3 */}
            <TableRow>
              <TableCell colSpan={dates.length + 6} align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem', p: 1 }}>
                TOTAL PAYABLE
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.2rem', p: 1, backgroundColor: '#f4b084' }}>
                {(totalPayableAmount + (totalOverallPresent * commissionRate)).toFixed(2)}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

export default FifteenDaysSalaryTable;
