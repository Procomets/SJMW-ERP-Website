import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Tooltip,
} from '@mui/material';
import type { Employee } from '../../employeeMaster/types/employee';
import type { AttendanceRecord, AttendanceStatus } from '../types/attendance';
import { useAuth } from '../../../context/AuthContext';
import { format, getDaysInMonth, isSunday, isToday } from 'date-fns';

interface AttendanceTableProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  currentMonth: Date; // A date object representing the selected month (usually 1st of month)
  isSettingsBlocked: boolean;
  onToggleAttendance: (employeeId: string, dateStr: string, currentStatus: AttendanceStatus | null) => Promise<void>;
  searchQuery: string;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  employees,
  attendanceRecords,
  currentMonth,
  isSettingsBlocked,
  onToggleAttendance,
  searchQuery,
}) => {
  const { profile } = useAuth();
  const role = profile?.role?.toLowerCase() || '';
  const isAdmin = role.includes('admin');
  const isAccountsManager = role.includes('accounts manager') || role.includes('account manager');

  // Number of days in the selected month
  const daysInMonth = getDaysInMonth(currentMonth);

  // Array of day numbers [1, 2, ..., 31]
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Pre-compute Sundays for working days calculation
  const sundaysCount = useMemo(() => {
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      if (isSunday(d)) count++;
    }
    return count;
  }, [currentMonth, daysInMonth]);

  const totalWorkingDays = daysInMonth - sundaysCount;

  // Filter employees
  const filteredEmployees = employees.filter(emp =>
    emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCellClick = (empId: string, day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = format(d, 'yyyy-MM-dd');
    const isTodayDate = isToday(d);

    if (!isAdmin) {
      if (isSettingsBlocked) {
        alert('Attendance is currently blocked by Admin.');
        return;
      }
      if (isAccountsManager && !isTodayDate) {
        alert('Accounts Manager can only mark attendance for today.');
        return;
      }
      if (!isAccountsManager && !isTodayDate) {
        alert('You can only mark attendance for today.');
        return;
      }
    }

    // Find current status
    const record = attendanceRecords.find(r => r.employeeId === empId && r.date === dateStr);
    const currentStatus = record ? record.status : null;
    onToggleAttendance(empId, dateStr, currentStatus);
  };

  return (
    <TableContainer component={Paper} sx={{ maxHeight: '70vh', overflow: 'auto' }}>
      <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ minWidth: 50, fontWeight: 'bold' }}>S.No</TableCell>
            <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>Employee Name</TableCell>
            {daysArray.map(day => {
              const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const isSun = isSunday(d);
              const isTod = isToday(d);
              return (
                <TableCell
                  key={day}
                  align="center"
                  sx={{
                    minWidth: 40,
                    fontWeight: 'bold',
                    p: 0.5,
                    backgroundColor: isTod ? '#e0f7fa' : isSun ? '#ffebee' : 'inherit',
                    borderRight: '1px solid #e0e0e0',
                  }}
                >
                  {day}
                </TableCell>
              );
            })}
            <TableCell align="center" sx={{ minWidth: 100, fontWeight: 'bold' }}>
              Working / Present
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredEmployees.map((emp, index) => {
            let presentCount = 0;

            return (
              <TableRow key={emp.id} hover>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: "500" }}>{emp.fullName}</Typography>
                  <Typography variant="caption" color="textSecondary">{emp.employeeCode}</Typography>
                </TableCell>

                {daysArray.map(day => {
                  const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const dateStr = format(d, 'yyyy-MM-dd');
                  const record = attendanceRecords.find(r => r.employeeId === emp.employeeId && r.date === dateStr);
                  
                  if (record?.status === 'Present' || record?.status === 'N') {
                    presentCount++;
                  } else if (record?.status === 'P/N') {
                    presentCount += 2;
                  }

                  const isSun = isSunday(d);
                  const isTod = isToday(d);

                  let bgColor = 'inherit';
                  let textColor = 'inherit';
                  let text = '-';

                  if (record?.status === 'Present') {
                    bgColor = '#e8f5e9'; // Greenish
                    textColor = '#2e7d32';
                    text = 'P';
                  } else if (record?.status === 'Absent') {
                    bgColor = '#ffebee'; // Reddish
                    textColor = '#c62828';
                    text = 'AB';
                  } else if (record?.status === 'P/N') {
                    bgColor = '#e3f2fd'; // Blueish
                    textColor = '#1565c0';
                    text = 'P/N';
                  } else if (record?.status === 'N') {
                    bgColor = '#ede7f6'; // Light purple
                    textColor = '#4527a0';
                    text = 'N';
                  } else if (isTod) {
                    bgColor = '#e0f7fa'; // cyan light for today if unmarked
                  } else if (isSun) {
                    bgColor = '#fff3e0'; // orange light for sunday if unmarked
                  }

                  const isClickable = isAdmin || (isTod && !isSettingsBlocked);

                  return (
                    <TableCell
                      key={day}
                      align="center"
                      onClick={() => handleCellClick(emp.employeeId, day)}
                      sx={{
                        p: 0,
                        backgroundColor: bgColor,
                        borderRight: '1px solid #e0e0e0',
                        cursor: isClickable ? 'pointer' : 'default',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          backgroundColor: isClickable ? '#bdbdbd' : bgColor,
                        },
                      }}
                    >
                      <Tooltip title={isClickable ? 'Click to toggle' : 'View only'}>
                        <Box sx={{ width: '100%', height: '100%', minHeight: 35, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="body2" sx={{ color: textColor, fontWeight: record ? 'bold' : 'normal' }}>
                            {text}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                  );
                })}
                <TableCell align="center">
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {totalWorkingDays} / <Box component="span" sx={{ color: '#2e7d32' }}>{presentCount}</Box>
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
          {filteredEmployees.length === 0 && (
            <TableRow>
              <TableCell colSpan={daysInMonth + 3} align="center">
                No employees found matching the criteria.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AttendanceTable;
