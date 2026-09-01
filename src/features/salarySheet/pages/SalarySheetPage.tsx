import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material';
import { format } from 'date-fns';
import { useAuth } from '../../../context/AuthContext';
import { getEmployees } from '../../employeeMaster/services/employeeService';
import { getAttendanceForMonth } from '../../attendance/services/attendanceService';
import { getSalaryRecordsForMonth, saveSalaryRecord, saveSalaryRecordsBatch } from '../services/salarySheetService';
import type { Employee } from '../../employeeMaster/types/employee';
import type { AttendanceRecord } from '../../attendance/types/attendance';
import type { SalaryRecord } from '../types/salarySheet';
import MonthlySalaryTable from '../components/MonthlySalaryTable';
import FifteenDaysSalaryTable from '../components/FifteenDaysSalaryTable';
import ExportExcelButton from '../../../components/common/ExportExcelButton';
import ExportPdfButton from '../../../components/common/ExportPdfButton';

const SalarySheetPage: React.FC = () => {
  const { user, profile } = useAuth();
  const role = profile?.role?.toLowerCase() || '';
  const isAccount = role.includes('account');
  const tableRef = React.useRef<any>(null);
  
  const [tabValue, setTabValue] = useState(0); // 0 = Monthly, 1 = 15 Days
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const monthYearStr = format(currentMonthDate, 'yyyy-MM');

  useEffect(() => {
    fetchData();
  }, [monthYearStr]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [emps, atts, sals] = await Promise.all([
        getEmployees(),
        getAttendanceForMonth(monthYearStr),
        getSalaryRecordsForMonth(monthYearStr)
      ]);
      const hasSalaryRecordIds = new Set(sals.map(s => s.employeeId));
      const hasAttendanceIds = new Set(atts.map(a => a.employeeId));
      
      const filteredEmps = emps.filter(e => 
        e.employmentStatus === 'Active' || 
        hasSalaryRecordIds.has(e.employeeId) || 
        hasAttendanceIds.has(e.employeeId)
      );
      setEmployees(filteredEmps);
      setAttendanceRecords(atts);
      setSalaryRecords(sals);
    } catch (error) {
      console.error('Failed to load salary sheet data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), parseInt(e.target.value), 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMonthDate(new Date(parseInt(e.target.value), currentMonthDate.getMonth(), 1));
  };

  const handleExport = () => {
    if (tableRef.current) {
      tableRef.current.exportExcel();
    }
  };

  const handleExportPdf = () => {
    if (tableRef.current) {
      tableRef.current.exportPdf();
    }
  };

  const handleSaveRecord = async (record: Omit<SalaryRecord, 'id' | 'updatedAt'>) => {
    try {
      await saveSalaryRecord(record, user?.email || 'unknown');
      // Refresh local salary records array without full reload
      setSalaryRecords(prev => {
        const existingIdx = prev.findIndex(r => 
          r.employeeId === record.employeeId && 
          r.monthYear === record.monthYear && 
          (r.period || 'monthly') === (record.period || 'monthly')
        );
        const newRecord = { ...record, updatedAt: new Date() as any }; // Mock timestamp for UI
        if (existingIdx >= 0) {
          const newArr = [...prev];
          newArr[existingIdx] = { ...newArr[existingIdx], ...newRecord };
          return newArr;
        }
        return [...prev, newRecord];
      });
      alert('Record saved successfully!');
    } catch (error) {
      console.error('Failed to save record', error);
      alert('Failed to save the record. Please try again.');
    }
  };

  const handleSaveAllRecords = async (records: Omit<SalaryRecord, 'id' | 'updatedAt'>[]) => {
    try {
      await saveSalaryRecordsBatch(records, user?.email || 'unknown');
      // Refresh local salary records
      setSalaryRecords(prev => {
        let newArr = [...prev];
        records.forEach(record => {
          const existingIdx = newArr.findIndex(r => 
            r.employeeId === record.employeeId && 
            r.monthYear === record.monthYear && 
            (r.period || 'monthly') === (record.period || 'monthly')
          );
          const newRecord = { ...record, updatedAt: new Date() as any };
          if (existingIdx >= 0) {
            newArr[existingIdx] = { ...newArr[existingIdx], ...newRecord };
          } else {
            newArr.push(newRecord);
          }
        });
        return newArr;
      });
      alert('All records saved successfully!');
    } catch (error) {
      console.error('Failed to save records', error);
      alert('Failed to save the records. Please try again.');
    }
  };

  // Generate year options
  const yearOptions = [];
  for (let i = 0; i < 10; i++) {
    const year = new Date().getFullYear() - 5 + i;
    yearOptions.push(year);
  }

  const monthlyEmployees = employees.filter(e => e.employeeType === 'Monthly Salary');
  const labourEmployees = employees.filter(e => e.employeeType === 'Labour');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Salary Sheet
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Month"
              value={currentMonthDate.getMonth()}
              onChange={handleMonthChange}
            >
              {Array.from({ length: 12 }, (_, i) => {
                const d = new Date(2000, i, 1);
                return (
                  <MenuItem key={i} value={i}>
                    {format(d, 'MMMM')}
                  </MenuItem>
                );
              })}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Year"
              value={currentMonthDate.getFullYear()}
              onChange={handleYearChange}
            >
              {yearOptions.map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}></Grid>
          {!isAccount && (
            <Grid size={{ xs: 12, sm: 2 }}>
              <ExportExcelButton
                fullWidth
                onClick={handleExport}
                sx={{ height: 40 }}
              >
                Export Excel
              </ExportExcelButton>
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: 2 }}>
            <ExportPdfButton
              fullWidth
              onClick={handleExportPdf}
              sx={{ height: 40 }}
            >
              Export PDF
            </ExportPdfButton>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
            <Tab label="Monthly Salary" />
            <Tab label="15 Days Wages" />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 2 }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>Loading data...</Box>
          ) : tabValue === 0 ? (
            <MonthlySalaryTable
              ref={tableRef}
              employees={monthlyEmployees}
              attendanceRecords={attendanceRecords}
              salaryRecords={salaryRecords}
              currentMonth={currentMonthDate}
              monthYearStr={monthYearStr}
              onSaveRecord={handleSaveRecord}
            />
          ) : (
            <FifteenDaysSalaryTable 
              ref={tableRef}
              employees={labourEmployees}
              attendanceRecords={attendanceRecords}
              salaryRecords={salaryRecords}
              currentMonth={currentMonthDate}
              monthYearStr={monthYearStr}
              onSaveRecord={handleSaveRecord}
              onSaveAllRecords={handleSaveAllRecords}
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default SalarySheetPage;
