import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Typography,
  Divider,
  Box,
  CircularProgress,
  IconButton
} from '@mui/material';
import { PhotoCamera, AddAPhoto } from '@mui/icons-material';
import type { Employee, EmployeeType, EmploymentStatus, Gender } from '../types/employee';
import ImageCropper from '../../../components/common/ImageCropper';
import { uploadImageToCloudinary } from '../../../utils/cloudinary';

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Employee | null;
  loading?: boolean;
}

const initialFormState = {
  employeeType: 'Monthly Salary' as EmployeeType,
  employmentStatus: 'Active' as EmploymentStatus,
  fullName: '',
  gender: 'Male' as Gender,
  mobileNumber: '',
  alternateMobile: '',
  email: '',
  address: '',
  state: '',
  pincode: '',
  aadharNumber: '',
  panNumber: '',
  bloodGroup: '',
  emergencyContactName: '',
  emergencyContactNumber: '',
  department: '',
  designation: '',
  reportingManager: '',
  workLocation: '',
  shift: '',
  dateOfJoining: '',
  monthlyIncome: '',
  dailyWages: '',
  accountNumber: '',
  ifscCode: '',
  bankBranch: '',
  personPhotoUrl: '',
  aadharPhotoUrl: '',
};

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}) => {
  const [formData, setFormData] = useState<any>(initialFormState);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [personPhotoFile, setPersonPhotoFile] = useState<File | null>(null);
  const [aadharPhotoFile, setAadharPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [tempPhotoSrc, setTempPhotoSrc] = useState<string>('');

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({ ...initialData });
      } else {
        setFormData({ ...initialFormState });
      }
      setErrors({});
      setPersonPhotoFile(null);
      setAadharPhotoFile(null);
    }
  }, [open, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePersonPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setTempPhotoSrc(reader.result?.toString() || '');
        setIsCropperOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleAadharPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const originalFile = e.target.files[0];
      const uniqueFile = new File([originalFile], `${Date.now()}_${originalFile.name}`, { type: originalFile.type });
      setAadharPhotoFile(uniqueFile);
    }
    e.target.value = '';
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    const requiredFields = [
      'fullName', 'gender', 'mobileNumber', 'alternateMobile', 'email', 
      'address', 'state', 'pincode', 'bloodGroup', 'aadharNumber',
      'emergencyContactName', 'emergencyContactNumber'
    ];
    
    if (formData.employeeType === 'Monthly Salary') {
      requiredFields.push(
        'panNumber', 'department', 'designation', 'reportingManager', 
        'shift', 'monthlyIncome', 'dateOfJoining', 'accountNumber', 
        'ifscCode', 'bankBranch'
      );
    } else {
      requiredFields.push('dailyWages');
    }

    requiredFields.forEach(field => {
      if (!formData[field] || String(formData[field]).trim() === '') {
        newErrors[field] = 'This field is required';
      }
    });

    if (formData.mobileNumber && !/^[0-9]{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Invalid mobile number format';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      // Optional: scroll to top or alert if we want, but form will show errors.
      console.log('Validation failed for:', newErrors);
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      setIsUploading(true);
      try {
        let uploadedPersonPhotoUrl = formData.personPhotoUrl || '';
        let uploadedAadharPhotoUrl = formData.aadharPhotoUrl || '';

        if (personPhotoFile) {
          uploadedPersonPhotoUrl = await uploadImageToCloudinary(personPhotoFile, 'employees/photos');
        }
        if (aadharPhotoFile) {
          uploadedAadharPhotoUrl = await uploadImageToCloudinary(aadharPhotoFile, 'employees/aadhar');
        }

        const submitData: any = { ...formData };
        if (uploadedPersonPhotoUrl) submitData.personPhotoUrl = uploadedPersonPhotoUrl;
        if (uploadedAadharPhotoUrl) submitData.aadharPhotoUrl = uploadedAadharPhotoUrl;

        // Strip any undefined properties before submitting to Firestore
        Object.keys(submitData).forEach(key => {
          if (submitData[key] === undefined) {
            delete submitData[key];
          }
        });

        await onSubmit(submitData);
      } catch (err: any) {
        console.error('Failed to upload images', err);
        alert(`Failed to upload images: ${err.message || 'Unknown error'}. Please check your Cloudinary configuration and ensure the upload preset is set to "Unsigned".`);
      } finally {
        setIsUploading(false);
      }
    } else {
      alert('Please check the form for validation errors before submitting.');
    }
  };

  const isMonthlySalary = formData.employeeType === 'Monthly Salary';

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialData ? 'Edit Employee' : 'Add Employee'}
        {initialData && (
          <Typography variant="body2" color="textSecondary">
            ID: {initialData.employeeId}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Employment Info
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Employee Type"
                name="employeeType" error={!!errors.employeeType} helperText={errors.employeeType}
                value={formData.employeeType}
                onChange={handleChange}
                required
              >
                <MenuItem value="Monthly Salary">Monthly Salary</MenuItem>
                <MenuItem value="Labour">Labour</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Status"
                name="employmentStatus"
                value={formData.employmentStatus}
                onChange={handleChange}
                required
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Personal Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                error={!!errors.fullName}
                helperText={errors.fullName}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mobile Number"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                error={!!errors.mobileNumber}
                helperText={errors.mobileNumber}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField required
                fullWidth
                label="Alternate Mobile"
                name="alternateMobile" error={!!errors.alternateMobile} helperText={errors.alternateMobile}
                value={formData.alternateMobile}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField required
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Address & Identification
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField required
                fullWidth
                label="Address"
                name="address" error={!!errors.address} helperText={errors.address}
                value={formData.address}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField required
                fullWidth
                label="State"
                name="state" error={!!errors.state} helperText={errors.state}
                value={formData.state}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField required
                fullWidth
                label="Pincode"
                name="pincode" error={!!errors.pincode} helperText={errors.pincode}
                value={formData.pincode}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField required
                fullWidth
                label="Blood Group"
                name="bloodGroup" error={!!errors.bloodGroup} helperText={errors.bloodGroup}
                value={formData.bloodGroup}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField required
                fullWidth
                label="Aadhaar Number"
                name="aadharNumber" error={!!errors.aadharNumber} helperText={errors.aadharNumber}
                value={formData.aadharNumber}
                onChange={handleChange}
              />
            </Grid>
            {isMonthlySalary && (
              <Grid item xs={12} sm={6}>
                <TextField required
                  fullWidth
                  label="PAN Number"
                  name="panNumber" error={!!errors.panNumber} helperText={errors.panNumber}
                  value={formData.panNumber}
                  onChange={handleChange}
                />
              </Grid>
            )}
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Documents & Photos
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="outlined" component="label" startIcon={<PhotoCamera />}>
                    Upload Person Photo
                    <input type="file" hidden accept="image/*" onChange={handlePersonPhotoSelect} />
                  </Button>
                  {personPhotoFile && <Typography variant="caption" color="success.main">Selected</Typography>}
                  {!personPhotoFile && formData.personPhotoUrl && (
                     <Typography variant="caption" color="primary.main">Existing Image</Typography>
                  )}
                </Box>
                {personPhotoFile && (
                  <Box sx={{ mt: 1 }}>
                    <img src={URL.createObjectURL(personPhotoFile)} alt="Person Photo Preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #ccc' }} />
                  </Box>
                )}
                {!personPhotoFile && formData.personPhotoUrl && (
                  <Box sx={{ mt: 1 }}>
                    <img src={formData.personPhotoUrl} alt="Person Photo" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #ccc' }} />
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="outlined" component="label" startIcon={<AddAPhoto />}>
                    Upload Aadhar Photo
                    <input type="file" hidden accept="image/*" onChange={handleAadharPhotoSelect} />
                  </Button>
                  {aadharPhotoFile && <Typography variant="caption" color="success.main">Selected</Typography>}
                  {!aadharPhotoFile && formData.aadharPhotoUrl && (
                     <Typography variant="caption" color="primary.main">Existing Image</Typography>
                  )}
                </Box>
                {aadharPhotoFile && (
                  <Box sx={{ mt: 1 }}>
                    <img src={URL.createObjectURL(aadharPhotoFile)} alt="Aadhar Photo Preview" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #ccc' }} />
                  </Box>
                )}
                {!aadharPhotoFile && formData.aadharPhotoUrl && (
                  <Box sx={{ mt: 1 }}>
                    <img src={formData.aadharPhotoUrl} alt="Aadhar Photo" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #ccc' }} />
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Emergency Contact
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField required
                fullWidth
                label="Contact Name"
                name="emergencyContactName" error={!!errors.emergencyContactName} helperText={errors.emergencyContactName}
                value={formData.emergencyContactName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField required
                fullWidth
                label="Contact Number"
                name="emergencyContactNumber" error={!!errors.emergencyContactNumber} helperText={errors.emergencyContactNumber}
                value={formData.emergencyContactNumber}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </Box>

        {isMonthlySalary && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Work Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField required
                    fullWidth
                    label="Department"
                    name="department" error={!!errors.department} helperText={errors.department}
                    value={formData.department}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField required
                    fullWidth
                    label="Designation"
                    name="designation" error={!!errors.designation} helperText={errors.designation}
                    value={formData.designation}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField required
                    fullWidth
                    label="Reporting Manager"
                    name="reportingManager" error={!!errors.reportingManager} helperText={errors.reportingManager}
                    value={formData.reportingManager}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField required
                    fullWidth
                    label="Shift"
                    name="shift" error={!!errors.shift} helperText={errors.shift}
                    value={formData.shift}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField required
                    fullWidth
                    label="Monthly Income"
                    name="monthlyIncome" error={!!errors.monthlyIncome} helperText={errors.monthlyIncome}
                    type="number"
                    value={formData.monthlyIncome}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField required
                    fullWidth
                    label="Date of Joining"
                    name="dateOfJoining" error={!!errors.dateOfJoining} helperText={errors.dateOfJoining}
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={formData.dateOfJoining}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Bank Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField required
                    fullWidth
                    label="Account Number"
                    name="accountNumber" error={!!errors.accountNumber} helperText={errors.accountNumber}
                    value={formData.accountNumber}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField required
                    fullWidth
                    label="IFSC Code"
                    name="ifscCode" error={!!errors.ifscCode} helperText={errors.ifscCode}
                    value={formData.ifscCode}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField required
                    fullWidth
                    label="Branch"
                    name="bankBranch" error={!!errors.bankBranch} helperText={errors.bankBranch}
                    value={formData.bankBranch}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </Box>
          </>
        )}

        {!isMonthlySalary && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Compensation
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField required
                    fullWidth
                    label="Daily Wages"
                    name="dailyWages" error={!!errors.dailyWages} helperText={errors.dailyWages}
                    type="number"
                    value={formData.dailyWages}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </Box>
          </>
        )}

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading || isUploading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || isUploading}
          startIcon={(loading || isUploading) ? <CircularProgress size={20} /> : null}
        >
          {initialData ? 'Update Employee' : 'Add Employee'}
        </Button>
      </DialogActions>
      <ImageCropper
        open={isCropperOpen}
        imageSrc={tempPhotoSrc}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={(file) => setPersonPhotoFile(file)}
      />
    </Dialog>
  );
};

export default EmployeeForm;
