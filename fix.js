const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'features', 'employeeMaster', 'components', 'EmployeeForm.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add `required` to all `<TextField` that don't have it
content = content.replace(/<TextField([\s\S]*?)\/>/g, (match, p1) => {
  if (p1.includes('required')) {
    return match;
  }
  return `<TextField required${p1}/>`;
});

// 2. Add validation logic
const oldValidate = `  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile Number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Invalid mobile number format';
    }
    if (formData.email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };`;

const newValidate = `  const validate = () => {
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
    if (formData.email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      // Optional: scroll to top or alert if we want, but form will show errors.
      console.log('Validation failed for:', newErrors);
    }
    return Object.keys(newErrors).length === 0;
  };`;

content = content.replace(oldValidate, newValidate);

// Also need to add `error={!!errors.FIELD}` and `helperText={errors.FIELD}` for all fields
content = content.replace(/name="([^"]+)"([\s\S]*?)\/>/g, (match, name, p2) => {
  if (match.includes('error={')) {
    return match;
  }
  return `name="${name}" error={!!errors.${name}} helperText={errors.${name}}${p2}/>`;
});


fs.writeFileSync(filePath, content);
console.log('Fixed');
