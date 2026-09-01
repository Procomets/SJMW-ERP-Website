import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import type { Employee, EmployeeType, EmploymentStatus } from '../types/employee';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee, updateEmployeeStatus } from '../services/employeeService';
import EmployeeForm from '../components/EmployeeForm';
import EmployeeViewModal from '../components/EmployeeViewModal';

const EmployeeMasterPage: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // View Modal State
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [employeeToView, setEmployeeToView] = useState<Employee | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<EmployeeType | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<EmploymentStatus | 'All'>('All');

  // Delete/Deactivate Confirmation State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      alert('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddClick = () => {
    setSelectedEmployee(null);
    setIsFormOpen(true);
  };

  const handleViewClick = (employee: Employee) => {
    setEmployeeToView(employee);
    setIsViewOpen(true);
  };

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleStatusToggle = async (employee: Employee) => {
    try {
      const newStatus = employee.employmentStatus === 'Active' ? 'Inactive' : 'Active';
      if (!employee.id) return;
      await updateEmployeeStatus(employee.id, newStatus);
      await fetchEmployees();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update employee status');
    }
  };

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete?.id) return;
    try {
      await deleteEmployee(employeeToDelete.id);
      setIsDeleteOpen(false);
      setEmployeeToDelete(null);
      await fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee. They might have dependent records.');
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedEmployee && selectedEmployee.id) {
        await updateEmployee(selectedEmployee.id, data);
      } else {
        await addEmployee(data, user?.email || 'Unknown');
      }
      setIsFormOpen(false);
      await fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Failed to save employee data.');
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.mobileNumber.includes(searchQuery);

    const matchesType = filterType === 'All' || emp.employeeType === filterType;
    const matchesStatus = filterStatus === 'All' || emp.employmentStatus === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          Employee Master
        </Typography>
        <Box>
          <Button variant="outlined" sx={{ mr: 2 }}>
            Export
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Plus size={20} />}
            onClick={handleAddClick}
          >
            Add Employee
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: "center" }}>
          <Grid   size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Search Employee"
              placeholder="Name, ID, Mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Grid>
          <Grid   size={{ xs: 12, sm: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Employee Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as EmployeeType | 'All')}
            >
              <MenuItem value="All">All Types</MenuItem>
              <MenuItem value="Monthly Salary">Monthly Salary</MenuItem>
              <MenuItem value="Labour">Labour</MenuItem>
            </TextField>
          </Grid>
          <Grid   size={{ xs: 12, sm: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as EmploymentStatus | 'All')}
            >
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: 'background.default' }}>
            <TableRow>
              <TableCell><strong>Employee ID</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Mobile</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    {row.employeeId}
                    <br />
                    <Typography variant="caption" color="textSecondary">
                      {row.employeeCode}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.fullName}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.employeeType}
                      color={row.employeeType === 'Monthly Salary' ? 'primary' : 'secondary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{row.mobileNumber}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.employmentStatus}
                      color={row.employmentStatus === 'Active' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="info" onClick={() => handleViewClick(row)}>
                      <Eye size={18} />
                    </IconButton>
                    <IconButton size="small" color="primary" onClick={() => handleEditClick(row)}>
                      <Edit size={18} />
                    </IconButton>
                    <Button
                      size="small"
                      color={row.employmentStatus === 'Active' ? 'warning' : 'success'}
                      onClick={() => handleStatusToggle(row)}
                      sx={{ ml: 1, minWidth: 'auto', px: 1, textTransform: 'none' }}
                    >
                      {row.employmentStatus === 'Active' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <IconButton size="small" color="error" onClick={() => handleDeleteClick(row)}>
                      <Trash2 size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Form Modal */}
      <EmployeeForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedEmployee}
      />

      {/* View Modal */}
      <EmployeeViewModal
        open={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        employee={employeeToView}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{employeeToDelete?.fullName}</strong>?
            <br />
            <br />
            <strong>Warning:</strong> If this employee has transaction history (attendance, payroll, etc.), they should be <strong>Deactivated</strong> instead of deleted to maintain records.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
          <Button onClick={() => { setIsDeleteOpen(false); handleStatusToggle(employeeToDelete!); }} color="warning" variant="contained">
            Deactivate Instead
          </Button>
          <Button onClick={confirmDelete} color="error">
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeMasterPage;
