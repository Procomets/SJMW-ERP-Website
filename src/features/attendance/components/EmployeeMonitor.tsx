import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Collapse,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { ChevronDown, ChevronUp, FileText, Download } from 'lucide-react';
import { format, getDaysInMonth, isSunday } from 'date-fns';
import { exportEmployeeMonitorToPdf } from '../utils/employeeMonitorPdfExport';
import type { Employee } from '../../employeeMaster/types/employee';
import type { AttendanceRecord } from '../types/attendance';
import { getYearlyAttendanceForEmployee } from '../services/attendanceService';
import ExportPdfButton from '../../../components/common/ExportPdfButton';

interface EmployeeMonitorProps {
  employees: Employee[];
}

const MonthRow = ({ stat, records, selectedYear }: { stat: any, records: AttendanceRecord[], selectedYear: string }) => {
  const [open, setOpen] = useState(false);

  // Filter records specifically for this month
  const monthRecords = records.filter(r => r.monthYear === stat.monthStr);

  return (
    <React.Fragment>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </IconButton>
        </TableCell>
        <TableCell><strong>{stat.monthName}</strong></TableCell>
        <TableCell align="center">{stat.totalDays}</TableCell>
        <TableCell align="center">{stat.workingDays}</TableCell>
        <TableCell align="center">
          <Typography variant="body2" sx={{ fontWeight: "bold" }} color="success.main">
            {stat.presentDays}
          </Typography>
        </TableCell>
        <TableCell align="center">
          <Typography variant="body2" sx={{ fontWeight: "bold" }} sx={{ color: '#1565c0' }}>
            {stat.pnDays}
          </Typography>
        </TableCell>
        <TableCell align="center">
          <Typography variant="body2" sx={{ fontWeight: "bold" }} color="error.main">
            {stat.absentDays}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, backgroundColor: '#fff', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" gutterBottom component="div" color="primary">
                Date-wise Attendance ({stat.monthName} {selectedYear})
              </Typography>
              <Grid container spacing={1} sx={{ mt: 1 }}>
                {Array.from({ length: stat.totalDays }, (_, i) => i + 1).map(day => {
                  const d = new Date(parseInt(selectedYear), parseInt(stat.monthStr.split('-')[1]) - 1, day);
                  const dateStr = format(d, 'yyyy-MM-dd');
                  const record = monthRecords.find(r => r.date === dateStr);
                  const isSun = isSunday(d);

                  let bgColor = isSun ? '#ffebee' : '#f8fafc';
                  let textColor = 'textSecondary';
                  let text = '-';

                  if (record?.status === 'Present') {
                    bgColor = '#e8f5e9';
                    textColor = 'success.main';
                    text = 'P';
                  } else if (record?.status === 'Absent') {
                    bgColor = '#ffebee';
                    textColor = 'error.main';
                    text = 'AB';
                  } else if (record?.status === 'P/N') {
                    bgColor = '#e3f2fd';
                    textColor = '#1565c0';
                    text = 'P/N';
                  }

                  return (
                    <Grid key={day}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: bgColor,
                          border: '1px solid #cbd5e1',
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: "bold" }} sx={{ color: textColor }}>
                          {text}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.5, fontSize: '0.65rem' }}>
                        {day}
                      </Typography>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

const EmployeeMonitor: React.FC<EmployeeMonitorProps> = ({ employees }) => {
  const currentYear = new Date().getFullYear().toString();
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAadharModalOpen, setIsAadharModalOpen] = useState(false);

  const handleDownloadAadhar = async (url: string, employeeName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `Aadhar_${employeeName.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download image', error);
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    if (selectedEmployeeId && selectedYear) {
      fetchYearlyData();
    } else {
      setRecords([]);
    }
  }, [selectedEmployeeId, selectedYear]);

  const fetchYearlyData = async () => {
    try {
      setLoading(true);
      const data = await getYearlyAttendanceForEmployee(selectedEmployeeId, selectedYear);
      setRecords(data);
    } catch (error) {
      console.error('Failed to fetch yearly attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployee = employees.find(e => e.employeeId === selectedEmployeeId);

  // Generate Year Options
  const yearOptions = [];
  for (let y = parseInt(currentYear) - 2; y <= parseInt(currentYear) + 1; y++) {
    yearOptions.push(y.toString());
  }

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    if (!selectedEmployeeId || !selectedYear) return [];

    const stats = [];
    for (let m = 0; m < 12; m++) {
      const monthDate = new Date(parseInt(selectedYear), m, 1);
      const monthStr = format(monthDate, 'yyyy-MM');
      const monthName = format(monthDate, 'MMMM');
      const daysInMonth = getDaysInMonth(monthDate);

      let sundaysCount = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        if (isSunday(new Date(parseInt(selectedYear), m, d))) {
          sundaysCount++;
        }
      }

      const workingDays = daysInMonth - sundaysCount;
      
      const monthRecords = records.filter(r => r.monthYear === monthStr);
      const presentDays = monthRecords.filter(r => r.status === 'Present').length;
      const absentDays = monthRecords.filter(r => r.status === 'Absent').length;
      const pnDays = monthRecords.filter(r => r.status === 'P/N').length;

      stats.push({
        monthName,
        monthStr,
        totalDays: daysInMonth,
        workingDays,
        presentDays,
        pnDays,
        absentDays
      });
    }
    return stats;
  }, [records, selectedEmployeeId, selectedYear]);

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid    size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Select Employee"
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {employees.map(emp => (
              <MenuItem key={emp.employeeId} value={emp.employeeId}>
                {emp.employeeId} - {emp.fullName}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid    size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Select Year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {yearOptions.map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {selectedEmployee && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" gutterBottom color="primary.main" sx={{ fontWeight: "bold" }} sx={{ m: 0 }}>
              Employee Profile
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {selectedEmployee.aadharPhotoUrl && (
                <Button 
                  variant="outlined" 
                  onClick={() => setIsAadharModalOpen(true)}
                  sx={{ borderColor: '#1565c0', color: '#1565c0', '&:hover': { backgroundColor: '#e3f2fd', borderColor: '#1565c0' } }}
                >
                  View Aadhar
                </Button>
              )}
              <ExportPdfButton 
                onClick={() => exportEmployeeMonitorToPdf({
                  employee: selectedEmployee,
                  selectedYear,
                  monthlyStats
                })}
              >
                Export PDF
              </ExportPdfButton>
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            {/* Basic Info */}
            <Grid  size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>Basic Information</Typography>
              <Grid container spacing={2}>
                <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                  <Typography variant="caption" color="textSecondary">Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "500" }}>{selectedEmployee.fullName}</Typography>
                </Grid>
                <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                  <Typography variant="caption" color="textSecondary">Employee Code</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "500" }}>{selectedEmployee.employeeCode}</Typography>
                </Grid>
                <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                  <Typography variant="caption" color="textSecondary">Employee Type</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "500" }}>{selectedEmployee.employeeType}</Typography>
                </Grid>
                <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                  <Typography variant="caption" color="textSecondary">Status</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "500" }}>{selectedEmployee.employmentStatus}</Typography>
                </Grid>
                {selectedEmployee.gender && (
                  <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                    <Typography variant="caption" color="textSecondary">Gender</Typography>
                    <Typography variant="body2">{selectedEmployee.gender}</Typography>
                  </Grid>
                )}
                {selectedEmployee.dateOfBirth && (
                  <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                    <Typography variant="caption" color="textSecondary">Date of Birth</Typography>
                    <Typography variant="body2">{format(selectedEmployee.dateOfBirth.toDate(), 'dd MMM yyyy')}</Typography>
                  </Grid>
                )}
                {selectedEmployee.bloodGroup && (
                  <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                    <Typography variant="caption" color="textSecondary">Blood Group</Typography>
                    <Typography variant="body2">{selectedEmployee.bloodGroup}</Typography>
                  </Grid>
                )}
              </Grid>
            </Grid>

            {/* Contact & Address Info */}
            {(selectedEmployee.mobileNumber || selectedEmployee.alternateMobile || selectedEmployee.email || selectedEmployee.address || selectedEmployee.state || selectedEmployee.pincode) && (
              <>
                <Grid  size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid  size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>Contact & Location</Typography>
                  <Grid container spacing={2}>
                    {selectedEmployee.mobileNumber && (
                      <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                        <Typography variant="caption" color="textSecondary">Mobile</Typography>
                        <Typography variant="body2">{selectedEmployee.mobileNumber}</Typography>
                      </Grid>
                    )}
                    {selectedEmployee.alternateMobile && (
                      <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                        <Typography variant="caption" color="textSecondary">Alt. Mobile</Typography>
                        <Typography variant="body2">{selectedEmployee.alternateMobile}</Typography>
                      </Grid>
                    )}
                    {selectedEmployee.email && (
                      <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                        <Typography variant="caption" color="textSecondary">Email</Typography>
                        <Typography variant="body2">{selectedEmployee.email}</Typography>
                      </Grid>
                    )}
                    {selectedEmployee.address && (
                      <Grid    size={{ xs: 12, sm: 12, md: 3 }}>
                        <Typography variant="caption" color="textSecondary">Address</Typography>
                        <Typography variant="body2">{selectedEmployee.address}</Typography>
                      </Grid>
                    )}
                    {selectedEmployee.state && (
                      <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                        <Typography variant="caption" color="textSecondary">State</Typography>
                        <Typography variant="body2">{selectedEmployee.state}</Typography>
                      </Grid>
                    )}
                    {selectedEmployee.pincode && (
                      <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                        <Typography variant="caption" color="textSecondary">Pincode</Typography>
                        <Typography variant="body2">{selectedEmployee.pincode}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              </>
            )}

            {/* Employment & Identification */}
            <Grid  size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            <Grid  size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>Employment & ID</Typography>
              <Grid container spacing={2}>
                {selectedEmployee.department && (
                  <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                    <Typography variant="caption" color="textSecondary">Department</Typography>
                    <Typography variant="body2">{selectedEmployee.department}</Typography>
                  </Grid>
                )}
                {selectedEmployee.designation && (
                  <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                    <Typography variant="caption" color="textSecondary">Designation</Typography>
                    <Typography variant="body2">{selectedEmployee.designation}</Typography>
                  </Grid>
                )}
                {selectedEmployee.dateOfJoining && (
                  <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                    <Typography variant="caption" color="textSecondary">Date of Joining</Typography>
                    <Typography variant="body2">{selectedEmployee.dateOfJoining}</Typography>
                  </Grid>
                )}
                {selectedEmployee.reportingManager && (
                  <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                    <Typography variant="caption" color="textSecondary">Reporting Mgr</Typography>
                    <Typography variant="body2">{selectedEmployee.reportingManager}</Typography>
                  </Grid>
                )}
                {selectedEmployee.shift && (
                  <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                    <Typography variant="caption" color="textSecondary">Shift</Typography>
                    <Typography variant="body2">{selectedEmployee.shift}</Typography>
                  </Grid>
                )}
                {selectedEmployee.aadharNumber && (
                  <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                    <Typography variant="caption" color="textSecondary">Aadhar No</Typography>
                    <Typography variant="body2">{selectedEmployee.aadharNumber}</Typography>
                  </Grid>
                )}
                {selectedEmployee.panNumber && (
                  <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                    <Typography variant="caption" color="textSecondary">PAN No</Typography>
                    <Typography variant="body2">{selectedEmployee.panNumber}</Typography>
                  </Grid>
                )}
                <Grid    size={{ xs: 12, sm: 4, md: 3 }}>
                  <Typography variant="caption" color="textSecondary">{selectedEmployee.employeeType === 'Monthly Salary' ? 'Monthly Income' : 'Daily Wages'}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: "500" }} color="success.main">
                    ₹ {selectedEmployee.employeeType === 'Monthly Salary' ? (selectedEmployee.monthlyIncome || 0) : (selectedEmployee.dailyWages || 0)}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>

            {/* Bank & Emergency Details */}
            {((selectedEmployee.accountNumber || selectedEmployee.emergencyContactName)) && (
              <>
                <Grid  size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid  size={{ xs: 12 }}>
                  <Grid container spacing={2}>
                    {(selectedEmployee.accountNumber || selectedEmployee.ifscCode || selectedEmployee.bankBranch) && (
                      <Grid  size={{ xs: 12 }} md={6}>
                        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>Bank Details</Typography>
                        <Grid container spacing={2}>
                          {selectedEmployee.accountNumber && (
                            <Grid  size={{ xs: 6 }}>
                              <Typography variant="caption" color="textSecondary">Account No</Typography>
                              <Typography variant="body2">{selectedEmployee.accountNumber}</Typography>
                            </Grid>
                          )}
                          {selectedEmployee.ifscCode && (
                            <Grid  size={{ xs: 6 }}>
                              <Typography variant="caption" color="textSecondary">IFSC</Typography>
                              <Typography variant="body2">{selectedEmployee.ifscCode}</Typography>
                            </Grid>
                          )}
                          {selectedEmployee.bankBranch && (
                            <Grid  size={{ xs: 12 }}>
                              <Typography variant="caption" color="textSecondary">Branch</Typography>
                              <Typography variant="body2">{selectedEmployee.bankBranch}</Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Grid>
                    )}
                    {(selectedEmployee.emergencyContactName || selectedEmployee.emergencyContactNumber) && (
                      <Grid  size={{ xs: 12 }} md={6}>
                        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>Emergency Contact</Typography>
                        <Grid container spacing={2}>
                          {selectedEmployee.emergencyContactName && (
                            <Grid  size={{ xs: 6 }}>
                              <Typography variant="caption" color="textSecondary">Name</Typography>
                              <Typography variant="body2">{selectedEmployee.emergencyContactName}</Typography>
                            </Grid>
                          )}
                          {selectedEmployee.emergencyContactNumber && (
                            <Grid  size={{ xs: 6 }}>
                              <Typography variant="caption" color="textSecondary">Number</Typography>
                              <Typography variant="body2">{selectedEmployee.emergencyContactNumber}</Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              </>
            )}
          </Grid>
        </Paper>
      )}

      {selectedEmployeeId ? (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: 'background.default' }}>
              <TableRow>
                <TableCell width="50px" />
                <TableCell><strong>Month</strong></TableCell>
                <TableCell align="center"><strong>Total Days</strong></TableCell>
                <TableCell align="center"><strong>Working Days (excl. Sundays)</strong></TableCell>
                <TableCell align="center"><strong>Present Days</strong></TableCell>
                <TableCell align="center"><strong>P/N Days</strong></TableCell>
                <TableCell align="center"><strong>Absent Days</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>Loading data...</TableCell>
                </TableRow>
              ) : (
                monthlyStats.map((stat) => (
                  <MonthRow key={stat.monthStr} stat={stat} records={records} selectedYear={selectedYear} />
                ))
              )}
              {/* Yearly Totals */}
              {!loading && monthlyStats.length > 0 && (
                <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                  <TableCell colSpan={2}><strong>Total for {selectedYear}</strong></TableCell>
                  <TableCell align="center"><strong>{monthlyStats.reduce((a, b) => a + b.totalDays, 0)}</strong></TableCell>
                  <TableCell align="center"><strong>{monthlyStats.reduce((a, b) => a + b.workingDays, 0)}</strong></TableCell>
                  <TableCell align="center">
                    <Typography variant="body1" sx={{ fontWeight: "bold" }} color="success.main">
                      {monthlyStats.reduce((a, b) => a + b.presentDays, 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body1" sx={{ fontWeight: "bold" }} sx={{ color: '#1565c0' }}>
                      {monthlyStats.reduce((a, b) => a + b.pnDays, 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body1" sx={{ fontWeight: "bold" }} color="error.main">
                      {monthlyStats.reduce((a, b) => a + b.absentDays, 0)}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ p: 4, textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
          <Typography color="textSecondary">Please select an employee to view their yearly attendance monitor.</Typography>
        </Box>
      )}

      <Dialog open={isAadharModalOpen} onClose={() => setIsAadharModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Aadhar Document - {selectedEmployee?.fullName}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
          {selectedEmployee?.aadharPhotoUrl && (
            <img 
              src={selectedEmployee.aadharPhotoUrl} 
              alt="Aadhar Document" 
              style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }} 
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAadharModalOpen(false)}>Close</Button>
          {selectedEmployee?.aadharPhotoUrl && (
            <Button 
              variant="contained" 
              startIcon={<Download size={18} />}
              onClick={() => handleDownloadAadhar(selectedEmployee.aadharPhotoUrl!, selectedEmployee.fullName)}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeMonitor;
