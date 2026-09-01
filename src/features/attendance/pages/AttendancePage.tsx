import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Grid,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
} from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import { format } from 'date-fns';
import { getEmployees } from '../../employeeMaster/services/employeeService';
import type { Employee } from '../../employeeMaster/types/employee';
import {
  getAttendanceForMonth,
  markAttendance,
  getAttendanceSettings,
  updateAttendanceSettings,
} from '../services/attendanceService';
import type { AttendanceRecord, AttendanceStatus, AttendanceSettings } from '../types/attendance';
import AttendanceTable from '../components/AttendanceTable';
import EmployeeMonitor from '../components/EmployeeMonitor';
import ExportExcelButton from '../../../components/common/ExportExcelButton';
import ExportPdfButton from '../../../components/common/ExportPdfButton';
import { exportAttendanceToExcel } from '../utils/attendanceExport';
import { exportAttendanceToPdf } from '../utils/attendancePdfExport';

const AttendancePage: React.FC = () => {
  const { user, profile } = useAuth();
  const role = profile?.role?.toLowerCase() || '';
  const isAdmin = role.includes('admin');
  const isAccount = role.includes('account');

  const [tabValue, setTabValue] = useState(0); // 0 = Monthly, 1 = Labour
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<AttendanceSettings>({ isBlocked: false });
  const [accessStartTime, setAccessStartTime] = useState<string>('');
  const [accessEndTime, setAccessEndTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isTimeBlocked, setIsTimeBlocked] = useState(false);

  const monthYearStr = format(currentMonthDate, 'yyyy-MM');

  useEffect(() => {
    fetchData();
  }, [monthYearStr]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [emps, records, sets] = await Promise.all([
        getEmployees(),
        getAttendanceForMonth(monthYearStr),
        getAttendanceSettings(),
      ]);
      setEmployees(emps.filter(e => e.employmentStatus === 'Active')); // Only active employees
      setAttendanceRecords(records);
      setSettings(sets);
      if (sets.accessStartTime) setAccessStartTime(sets.accessStartTime);
      if (sets.accessEndTime) setAccessEndTime(sets.accessEndTime);
    } catch (error) {
      console.error('Failed to load attendance data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    if (isAdmin || !settings.accessStartTime || !settings.accessEndTime) {
      setIsTimeBlocked(false);
      return;
    }
    
    const checkTime = () => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      
      const start = settings.accessStartTime!;
      const end = settings.accessEndTime!;
      
      let blocked = false;
      if (start < end) {
        // Normal range, e.g., 09:00 to 17:00
        blocked = !(currentTimeStr >= start && currentTimeStr <= end);
      } else {
        // Overnight range, e.g., 23:00 to 06:00
        blocked = !(currentTimeStr >= start || currentTimeStr <= end);
      }
      
      setIsTimeBlocked(blocked);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [settings, isAdmin]);



  const handleToggleAttendance = async (employeeId: string, dateStr: string, currentStatus: AttendanceStatus | null) => {
    // Find if employee is Labour
    const emp = employees.find(e => e.employeeId === employeeId);
    const isLabour = emp?.employeeType === 'Labour';

    // Logic: null -> Present -> Absent -> P/N (only for Labour) / N (only for Monthly) -> null
    let nextStatus: AttendanceStatus | null = null;
    if (currentStatus === null) nextStatus = 'Present';
    else if (currentStatus === 'Present') nextStatus = 'Absent';
    else if (currentStatus === 'Absent') {
      nextStatus = isLabour ? 'P/N' : 'N';
    } else nextStatus = null;

    // Optimistic UI update
    setAttendanceRecords(prev => {
      if (nextStatus === null) {
        return prev.filter(r => !(r.employeeId === employeeId && r.date === dateStr));
      }
      
      const existingIdx = prev.findIndex(r => r.employeeId === employeeId && r.date === dateStr);
      if (existingIdx >= 0) {
        const newArr = [...prev];
        newArr[existingIdx] = { ...newArr[existingIdx], status: nextStatus };
        return newArr;
      }
      
      return [
        ...prev,
        {
          employeeId,
          date: dateStr,
          monthYear: monthYearStr,
          status: nextStatus,
          markedBy: user?.email || 'unknown',
          updatedAt: new Date(), // Mock timestamp for UI
        }
      ];
    });

    try {
      await markAttendance(employeeId, dateStr, monthYearStr, nextStatus, user?.email || 'unknown');
    } catch (error) {
      console.error('Failed to save attendance', error);
      alert('Failed to save attendance.');
      await fetchData(); // Revert on failure
    }
  };

  const handleBlockToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isBlocked = e.target.checked;
    setSettings(prev => ({ ...prev, isBlocked })); // Optimistic
    try {
      await updateAttendanceSettings(isBlocked, accessStartTime, accessEndTime);
    } catch (error) {
      console.error('Failed to update settings', error);
      setSettings(prev => ({ ...prev, isBlocked: !isBlocked })); // Revert
    }
  };

  const handleSaveTimings = async () => {
    try {
      await updateAttendanceSettings(settings.isBlocked, accessStartTime, accessEndTime);
      alert('Access timings saved successfully.');
      await fetchData();
    } catch (error) {
      console.error('Failed to save timings', error);
      alert('Failed to save timings.');
    }
  };

  // Handle individual month/year changes inline in the JSX


  const monthlyEmployees = employees.filter(e => e.employeeType === 'Monthly Salary');
  const labourEmployees = employees.filter(e => e.employeeType === 'Labour');

  const getFilteredEmployees = () => {
    const list = tabValue === 0 ? monthlyEmployees : labourEmployees;
    return list.filter(emp =>
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleExport = async () => {
    try {
      const filtered = getFilteredEmployees();
      await exportAttendanceToExcel({
        employees: filtered,
        attendanceRecords,
        currentMonth: currentMonthDate,
        tabName: tabValue === 0 ? 'Monthly Salary Employees' : 'Labour Workers',
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export to Excel.');
    }
  };

  const handleExportPdf = async () => {
    try {
      const filtered = getFilteredEmployees();
      await exportAttendanceToPdf({
        employees: filtered,
        attendanceRecords,
        currentMonth: currentMonthDate,
        tabName: tabValue === 0 ? 'Monthly Salary Employees' : 'Labour Workers',
      });
    } catch (error) {
      console.error('PDF Export failed:', error);
      alert('Failed to export to PDF.');
    }
  };

  if (isTimeBlocked) {
    return (
      <Box sx={{ p: 5, textAlign: 'center', mt: 10 }}>
        <Typography variant="h4" color="error" sx={{ fontWeight: "bold" }}>Access Denied</Typography>
        <Typography variant="h6" sx={{ mt: 2, color: '#475569' }}>
          The Attendance module is currently locked.
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, color: '#64748b' }}>
          You can only access it between {
            settings.accessStartTime 
              ? new Date(`2000-01-01T${settings.accessStartTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              : ''
          } and {
            settings.accessEndTime 
              ? new Date(`2000-01-01T${settings.accessEndTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              : ''
          }.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          Attendance Management
        </Typography>
        {isAdmin && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', p: 1, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#f8fafc' }}>
            <TextField
              label="Start Time"
              type="time"
              size="small"
              value={accessStartTime}
              onChange={(e) => setAccessStartTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } } as any}
              sx={{ width: 150, bgcolor: '#fff' }}
            />
            <TextField
              label="End Time"
              type="time"
              size="small"
              value={accessEndTime}
              onChange={(e) => setAccessEndTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } } as any}
              sx={{ width: 150, bgcolor: '#fff' }}
            />
            <Button variant="contained" onClick={handleSaveTimings} size="small" sx={{ height: 40, textTransform: 'none', fontWeight: 600 }}>
              Save Timings
            </Button>
            <Box sx={{ ml: 2, pl: 2, borderLeft: '1px solid #cbd5e1' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.isBlocked}
                    onChange={handleBlockToggle}
                    color="error"
                  />
                }
                label={
                  <Typography variant="body2" color={settings.isBlocked ? 'error' : 'textSecondary'} sx={{ fontWeight: "bold" }}>
                    {settings.isBlocked ? 'Attendance Locked' : 'Attendance Unlocked'}
                  </Typography>
                }
              />
            </Box>
          </Box>
        )}
      </Box>

      {tabValue !== 2 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Month"
                value={currentMonthDate.getMonth()}
                onChange={(e) => {
                  setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), parseInt(e.target.value), 1));
                }}
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
                onChange={(e) => {
                  setCurrentMonthDate(new Date(parseInt(e.target.value), currentMonthDate.getMonth(), 1));
                }}
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - 5 + i;
                  return (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Search Employee"
                placeholder="Name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Grid>
            {!isAccount && (
              <Grid size={{ xs: 12, sm: 2 }}>
                <ExportExcelButton
                  fullWidth
                  onClick={handleExport}
                  sx={{ height: 40 }}
                >
                  Excel
                </ExportExcelButton>
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 2 }}>
              <ExportPdfButton
                fullWidth
                onClick={handleExportPdf}
                sx={{ height: 40 }}
              >
                PDF
              </ExportPdfButton>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
            <Tab label="Monthly Salary Employees" />
            <Tab label="Labour Workers" />
            <Tab label="Employee Monitor" />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 0 }}>
          {tabValue === 2 ? (
            <EmployeeMonitor employees={employees} />
          ) : loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>Loading attendance data...</Box>
          ) : (
            <AttendanceTable
              employees={tabValue === 0 ? monthlyEmployees : labourEmployees}
              attendanceRecords={attendanceRecords}
              currentMonth={currentMonthDate}
              isSettingsBlocked={settings.isBlocked}
              onToggleAttendance={handleToggleAttendance}
              searchQuery={searchQuery}
            />
          )}
        </Box>
      </Paper>

    </Box>
  );
};

export default AttendancePage;
