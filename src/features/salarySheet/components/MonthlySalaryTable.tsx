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
} from '@mui/material';
import { getDaysInMonth, isSunday } from 'date-fns';
import type { Employee } from '../../employeeMaster/types/employee';
import type { AttendanceRecord } from '../../attendance/types/attendance';
import type { SalaryRecord } from '../types/salarySheet';
import { Save } from 'lucide-react';
import { exportMonthlySalaryToExcel } from '../utils/salarySheetExport';
import { exportMonthlySalaryToPdf } from '../utils/salarySheetPdfExport';

export interface SalaryTableRef {
  exportExcel: () => void;
  exportPdf: () => void;
}

interface MonthlySalaryTableProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  salaryRecords: SalaryRecord[];
  currentMonth: Date; // 1st of the selected month
  monthYearStr: string;
  onSaveRecord: (record: Omit<SalaryRecord, 'id' | 'updatedAt'>) => Promise<void>;
}

const MonthlySalaryTable = React.forwardRef<SalaryTableRef, MonthlySalaryTableProps>(({
  employees,
  attendanceRecords,
  salaryRecords,
  currentMonth,
  monthYearStr,
  onSaveRecord,
}, ref) => {
  // Local state for editable fields to avoid lag
  const [editableRows, setEditableRows] = useState<Record<string, Partial<SalaryRecord>>>({});

  // Initialize state when props change
  useEffect(() => {
    const stateMap: Record<string, Partial<SalaryRecord>> = {};
    employees.forEach(emp => {
      const record = salaryRecords.find(r => r.employeeId === emp.employeeId && (r.period === 'monthly' || !r.period));
      stateMap[emp.employeeId] = {
        asOnDateSalary: record?.asOnDateSalary || 0,
        hike: record?.hike || 0,
        pf: record?.pf || 0,
        esi: record?.esi || 0,
        salaryAdvance: record?.salaryAdvance || 0,
        lop: record?.lop || 0,
        remark: record?.remark || '',
      };
    });
    setEditableRows(stateMap);
  }, [employees, salaryRecords]);

  React.useImperativeHandle(ref, () => ({
    exportExcel: () => {
      exportMonthlySalaryToExcel(employees, attendanceRecords, currentMonth, editableRows);
    },
    exportPdf: () => {
      exportMonthlySalaryToPdf(employees, attendanceRecords, currentMonth, editableRows);
    }
  }), [employees, attendanceRecords, currentMonth, editableRows]);

  const handleInputChange = (employeeId: string, field: keyof SalaryRecord, value: string) => {
    setEditableRows(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: field === 'remark' ? value : (parseFloat(value) || 0)
      }
    }));
  };

  const handleSave = (employeeId: string) => {
    const data = editableRows[employeeId];
    onSaveRecord({
      employeeId,
      monthYear: monthYearStr,
      asOnDateSalary: data.asOnDateSalary || 0,
      hike: data.hike || 0,
      pf: data.pf || 0,
      esi: data.esi || 0,
      salaryAdvance: data.salaryAdvance || 0,
      lop: data.lop || 0,
      remark: data.remark || '',
      updatedBy: '' // Handled by parent
    });
  };

  // Calculate working days
  const daysInMonth = getDaysInMonth(currentMonth);
  let sundaysCount = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    if (isSunday(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))) {
      sundaysCount++;
    }
  }
  const noOfDays = daysInMonth - sundaysCount;

  // Header styles
  const headerStyle = {
    backgroundColor: '#002060', // Dark Blue from Excel
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

  // Compute Totals
  let totalSalary = 0;
  let totalGross = 0;
  let totalBasic = 0;
  let totalHRA = 0;
  let totalSA = 0;
  let totalMA = 0;
  let totalCA = 0;
  let totalPF = 0;
  let totalESI = 0;
  let totalAdvance = 0;
  let totalLOP = 0;
  let totalNet = 0;

  return (
    <TableContainer component={Paper} sx={{ maxHeight: '75vh', overflow: 'auto', mt: 2 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell colSpan={26} align="center" sx={{ backgroundColor: '#002060', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem', py: 1 }}>
              Sri Jothi Moulding Works
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={26} align="center" sx={{ backgroundColor: '#002060', color: '#fff', fontWeight: 'bold', fontSize: '1rem', py: 0.5 }}>
              Salary Sheet For The Month Of {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={headerStyle}>S NO</TableCell>
            <TableCell sx={headerStyle}>Name</TableCell>
            <TableCell sx={headerStyle}>Designation</TableCell>
            <TableCell sx={headerStyle}>DOJ</TableCell>
            <TableCell sx={headerStyle}>Hike</TableCell>
            <TableCell sx={{...headerStyle, backgroundColor: '#001a4d'}}>Salary</TableCell>
            <TableCell sx={headerStyle}>No Of<br/>Days</TableCell>
            <TableCell sx={headerStyle}>Per day<br/>Pay</TableCell>
            <TableCell sx={headerStyle}>No Of<br/>Present</TableCell>
            <TableCell sx={{...headerStyle, backgroundColor: '#001a4d'}}>Gross<br/>Salary</TableCell>
            <TableCell sx={headerStyle}>Basic<br/>50%</TableCell>
            <TableCell sx={headerStyle}>HRA<br/>20%</TableCell>
            <TableCell sx={headerStyle}>SA<br/>20%</TableCell>
            <TableCell sx={headerStyle}>MA<br/>4%</TableCell>
            <TableCell sx={headerStyle}>CA<br/>6%</TableCell>
            <TableCell sx={headerStyle}>PF</TableCell>
            <TableCell sx={headerStyle}>ESI</TableCell>
            <TableCell sx={headerStyle}>Salary<br/>Advance</TableCell>
            <TableCell sx={headerStyle}>No Of<br/>Leave</TableCell>
            <TableCell sx={headerStyle}>LOP</TableCell>
            <TableCell sx={{...headerStyle, backgroundColor: '#001a4d'}}>Net<br/>Salary</TableCell>
            <TableCell sx={headerStyle}>A/c No</TableCell>
            <TableCell sx={headerStyle}>IFSC Code</TableCell>
            <TableCell sx={headerStyle}>Branch</TableCell>
            <TableCell sx={headerStyle}>Remark</TableCell>
            <TableCell sx={headerStyle}>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {employees.map((emp, index) => {
            const rowState = editableRows[emp.employeeId] || {};
            
            const salary = (parseFloat(String(emp.monthlyIncome || 0)) || 0) + (rowState.hike || 0);
            const perDayPay = noOfDays > 0 ? (salary / noOfDays) : 0;
            
            // Calc Present & 2 Days Paid Leave
            const empAtt = attendanceRecords.filter(r => r.employeeId === emp.employeeId);
            const noOfPresent = empAtt.filter(r => r.status === 'Present' || r.status === 'N').length;
            const noOfLeave = Math.max(0, noOfDays - noOfPresent);
            const paidLeave = Math.min(noOfLeave, 2);
            const paidDays = Math.min(noOfDays, noOfPresent + paidLeave);
            
            const grossSalary = paidDays === noOfDays ? salary : (perDayPay * paidDays);
            const basic = grossSalary * 0.5;
            const hra = grossSalary * 0.2;
            const sa = grossSalary * 0.2;
            const ma = grossSalary * 0.04;
            const ca = grossSalary * 0.06;

            const pf = rowState.pf || 0;
            const esi = rowState.esi || 0;
            const advance = rowState.salaryAdvance || 0;
            const lop = rowState.lop || 0;

            const netSalary = grossSalary - pf - esi - advance - lop;

            // Accumulate
            totalSalary += salary;
            totalGross += grossSalary;
            totalBasic += basic;
            totalHRA += hra;
            totalSA += sa;
            totalMA += ma;
            totalCA += ca;
            totalPF += pf;
            totalESI += esi;
            totalAdvance += advance;
            totalLOP += lop;
            totalNet += netSalary;

            return (
              <TableRow key={emp.employeeId} hover>
                <TableCell align="center" sx={cellStyle}>{index + 1}</TableCell>
                <TableCell sx={cellStyle}>{emp.fullName}</TableCell>
                <TableCell sx={cellStyle}>{emp.designation}</TableCell>
                <TableCell sx={cellStyle}>{emp.dateOfJoining}</TableCell>
                
                <TableCell sx={cellStyle}>
                  <TextField size="small" variant="outlined" sx={inputStyle} value={rowState.hike ?? ''} onChange={e => handleInputChange(emp.employeeId, 'hike', e.target.value)} />
                </TableCell>

                <TableCell align="right" sx={{...cellStyle, backgroundColor: '#c5e0b4', fontWeight: 'bold'}}>{salary.toFixed(0)}</TableCell>
                <TableCell align="center" sx={cellStyle}>{noOfDays}</TableCell>
                <TableCell align="right" sx={cellStyle}>{perDayPay.toFixed(0)}</TableCell>
                <TableCell align="center" sx={cellStyle}>{noOfPresent}</TableCell>
                
                <TableCell align="right" sx={{...cellStyle, backgroundColor: '#c5e0b4', fontWeight: 'bold'}}>{grossSalary.toFixed(0)}</TableCell>
                
                <TableCell align="right" sx={cellStyle}>{basic.toFixed(0)}</TableCell>
                <TableCell align="right" sx={cellStyle}>{hra.toFixed(0)}</TableCell>
                <TableCell align="right" sx={cellStyle}>{sa.toFixed(0)}</TableCell>
                <TableCell align="right" sx={cellStyle}>{ma.toFixed(0)}</TableCell>
                <TableCell align="right" sx={cellStyle}>{ca.toFixed(0)}</TableCell>
                
                <TableCell sx={cellStyle}>
                  <TextField size="small" variant="outlined" sx={inputStyle} value={rowState.pf ?? ''} onChange={e => handleInputChange(emp.employeeId, 'pf', e.target.value)} />
                </TableCell>
                <TableCell sx={cellStyle}>
                  <TextField size="small" variant="outlined" sx={inputStyle} value={rowState.esi ?? ''} onChange={e => handleInputChange(emp.employeeId, 'esi', e.target.value)} />
                </TableCell>
                <TableCell sx={cellStyle}>
                  <TextField size="small" variant="outlined" sx={inputStyle} value={rowState.salaryAdvance ?? ''} onChange={e => handleInputChange(emp.employeeId, 'salaryAdvance', e.target.value)} />
                </TableCell>
                
                <TableCell align="center" sx={cellStyle}>{noOfLeave}</TableCell>
                
                <TableCell sx={cellStyle}>
                  <TextField size="small" variant="outlined" sx={inputStyle} value={rowState.lop ?? ''} onChange={e => handleInputChange(emp.employeeId, 'lop', e.target.value)} />
                </TableCell>

                <TableCell align="right" sx={{...cellStyle, backgroundColor: '#f8cbad', fontWeight: 'bold'}}>{netSalary.toFixed(0)}</TableCell>
                
                <TableCell sx={cellStyle}>{emp.accountNumber}</TableCell>
                <TableCell sx={cellStyle}>{emp.ifscCode}</TableCell>
                <TableCell sx={cellStyle}>{emp.bankBranch}</TableCell>
                
                <TableCell sx={cellStyle}>
                  <TextField size="small" variant="outlined" sx={{ '& .MuiInputBase-input': { p: '4px 6px', fontSize: '0.8rem', width: '120px' } }} value={rowState.remark ?? ''} onChange={e => handleInputChange(emp.employeeId, 'remark', e.target.value)} />
                </TableCell>

                <TableCell sx={cellStyle}>
                  <Button size="small" variant="contained" color="primary" onClick={() => handleSave(emp.employeeId)} sx={{ minWidth: 40, p: 0.5 }}>
                    <Save size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}

          {/* TOTALS ROW */}
          <TableRow sx={{ backgroundColor: '#002060' }}>
            <TableCell colSpan={5} align="center" sx={{ color: '#fff', fontWeight: 'bold', fontSize: '0.85rem' }}>TOTAL</TableCell>
            <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>{totalSalary.toFixed(0)}</TableCell>
            <TableCell align="center" sx={{ color: '#fff' }}></TableCell>
            <TableCell align="right" sx={{ color: '#fff' }}></TableCell>
            <TableCell align="center" sx={{ color: '#fff' }}></TableCell>
            <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>{totalGross.toFixed(0)}</TableCell>
            <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>{totalBasic.toFixed(0)}</TableCell>
            <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>{totalHRA.toFixed(0)}</TableCell>
            <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>{totalSA.toFixed(0)}</TableCell>
            <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>{totalMA.toFixed(0)}</TableCell>
            <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>{totalCA.toFixed(0)}</TableCell>
            <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>{totalPF.toFixed(0)}</TableCell>
            <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>{totalESI.toFixed(0)}</TableCell>
            <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>{totalAdvance.toFixed(0)}</TableCell>
            <TableCell align="center" sx={{ color: '#fff' }}></TableCell>
            <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>{totalLOP.toFixed(0)}</TableCell>
            <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>{totalNet.toFixed(0)}</TableCell>
            <TableCell colSpan={5}></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
});

export default MonthlySalaryTable;
