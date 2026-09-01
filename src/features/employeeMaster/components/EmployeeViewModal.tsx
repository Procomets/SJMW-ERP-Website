import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Divider,
  Box,
  Chip
} from '@mui/material';
import type { Employee } from '../types/employee';

interface EmployeeViewModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
}

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Grid item xs={12} sm={6}>
    <Typography variant="caption" color="textSecondary">
      {label}
    </Typography>
    <Typography variant="body1" fontWeight="500">
      {value || '-'}
    </Typography>
  </Grid>
);

const EmployeeViewModal: React.FC<EmployeeViewModalProps> = ({ open, onClose, employee }) => {
  if (!employee) return null;

  const isMonthlySalary = employee.employeeType === 'Monthly Salary';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Employee Profile
        <Typography variant="body2" color="textSecondary">
          ID: {employee.employeeId} | Code: {employee.employeeCode}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
            Employment Info
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="textSecondary">Status</Typography>
              <Box>
                <Chip 
                  size="small" 
                  label={employee.employmentStatus} 
                  color={employee.employmentStatus === 'Active' ? 'success' : 'default'} 
                />
              </Box>
            </Grid>
            <DetailRow label="Employee Type" value={employee.employeeType} />
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
            Personal Information
          </Typography>
          <Grid container spacing={2}>
            <DetailRow label="Full Name" value={employee.fullName} />
            <DetailRow label="Gender" value={employee.gender} />
            <DetailRow label="Mobile Number" value={employee.mobileNumber} />
            <DetailRow label="Alternate Mobile" value={employee.alternateMobile} />
            <DetailRow label="Email" value={employee.email} />
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
            Address & Identification
          </Typography>
          <Grid container spacing={2}>
            <DetailRow label="Address" value={employee.address} />
            <DetailRow label="State" value={employee.state} />
            <DetailRow label="Pincode" value={employee.pincode} />
            <DetailRow label="Blood Group" value={employee.bloodGroup} />
            <DetailRow label="Aadhaar Number" value={employee.aadharNumber} />
            {isMonthlySalary && (
              <DetailRow label="PAN Number" value={employee.panNumber} />
            )}
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
            Emergency Contact
          </Typography>
          <Grid container spacing={2}>
            <DetailRow label="Contact Name" value={employee.emergencyContactName} />
            <DetailRow label="Contact Number" value={employee.emergencyContactNumber} />
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
            Compensation & Work Details
          </Typography>
          <Grid container spacing={2}>
            {isMonthlySalary ? (
              <>
                <DetailRow label="Date of Joining" value={employee.dateOfJoining} />
                <DetailRow label="Department" value={employee.department} />
                <DetailRow label="Designation" value={employee.designation} />
                <DetailRow label="Reporting Manager" value={employee.reportingManager} />
                <DetailRow label="Shift" value={employee.shift} />
                <DetailRow label="Monthly Income" value={employee.monthlyIncome ? `₹${employee.monthlyIncome}` : ''} />
              </>
            ) : (
              <>
                <DetailRow label="Daily Wages" value={employee.dailyWages ? `₹${employee.dailyWages}` : ''} />
              </>
            )}
          </Grid>
        </Box>

        {isMonthlySalary && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                Bank Details
              </Typography>
              <Grid container spacing={2}>
                <DetailRow label="Account Number" value={employee.accountNumber} />
                <DetailRow label="IFSC Code" value={employee.ifscCode} />
                <DetailRow label="Bank Branch" value={employee.bankBranch} />
              </Grid>
            </Box>
          </>
        )}

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeViewModal;
