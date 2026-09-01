import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Employee } from '../../employeeMaster/types/employee';

export interface EmployeePdfParams {
  employee: Employee;
  selectedYear: string;
  monthlyStats: {
    monthName: string;
    totalDays: number;
    workingDays: number;
    presentDays: number;
    pnDays: number;
    absentDays: number;
  }[];
}

const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      resolve(reader.result as string);
    }, false);
    reader.onerror = () => {
      reject(new Error("Failed to read image"));
    };
    reader.readAsDataURL(blob);
  });
}

export const exportEmployeeMonitorToPdf = async (params: EmployeePdfParams) => {
  const { employee, selectedYear, monthlyStats } = params;

  const doc = new jsPDF('p', 'pt', 'a4');

  // Header configuration
  const marginX = 40;
  let currentY = 40;
  const pageWidth = doc.internal.pageSize.getWidth();

  try {
    const logoBase64 = await getBase64ImageFromUrl('/logo.png');
    // We assume the logo is somewhat square or rectangular. We'll give it a fixed size.
    doc.addImage(logoBase64, 'PNG', marginX, currentY, 60, 60);
  } catch (error) {
    console.error('Failed to load logo for PDF', error);
  }

  if (employee.personPhotoUrl) {
    try {
      const photoBase64 = await getBase64ImageFromUrl(employee.personPhotoUrl);
      // Place employee photo in the top right
      doc.addImage(photoBase64, 'JPEG', pageWidth - marginX - 60, currentY, 60, 60);
    } catch (error) {
      console.error('Failed to load employee photo for PDF', error);
    }
  }

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Sri Jothi Moulding Works", marginX + 80, currentY + 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("AC 31/9, TINY PLOT, THIRUMUDIVAKKAM SIDCO Industrial Estate,", marginX + 80, currentY + 40);
  doc.text("Chennai, Tamil Nadu 600132, India", marginX + 80, currentY + 52);
  
  currentY += 80;

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Employee Report", pageWidth / 2, currentY, { align: "center" });
  currentY += 30;

  // Employee Details
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Employee Details", marginX, currentY);
  currentY += 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let statePin = null;
  if (employee.state && employee.pincode) {
    statePin = `${employee.state} / ${employee.pincode}`;
  } else if (employee.state) {
    statePin = employee.state;
  } else if (employee.pincode) {
    statePin = employee.pincode;
  }

  const rawDetails = [
    { label: 'Name', value: employee.fullName },
    { label: 'Employee ID', value: employee.employeeId },
    { label: 'Employee Code', value: employee.employeeCode },
    { label: 'Type', value: employee.employeeType },
    { label: 'Designation', value: employee.designation },
    { label: 'Department', value: employee.department },
    { label: 'Status', value: employee.employmentStatus },
    { label: 'Gender', value: employee.gender },
    { label: 'Mobile', value: employee.mobileNumber },
    { label: 'Alternate Mobile', value: employee.alternateMobile },
    { label: 'Email', value: employee.email },
    { label: 'Address', value: employee.address },
    { label: 'State/Pin', value: statePin },
    { label: 'Aadhar Number', value: employee.aadharNumber },
    { label: 'PAN Number', value: employee.panNumber },
    { label: 'Blood Group', value: employee.bloodGroup },
    { label: 'Emerg. Contact', value: employee.emergencyContactName },
    { label: 'Emerg. Number', value: employee.emergencyContactNumber },
    { label: 'Reporting Mgr', value: employee.reportingManager },
    { label: 'Work Location', value: employee.workLocation },
    { label: 'Shift', value: employee.shift },
    { label: 'Date of Joining', value: employee.dateOfJoining },
    { label: 'Account Number', value: employee.accountNumber },
    { label: 'IFSC Code', value: employee.ifscCode },
    { label: 'Bank Branch', value: employee.bankBranch },
    { label: 'Monthly Income', value: employee.monthlyIncome },
    { label: 'Daily Wages', value: employee.dailyWages },
    { label: 'Year of Report', value: selectedYear }
  ];

  const details = rawDetails
    .filter(d => d.value !== undefined && d.value !== null && d.value !== '')
    .map(d => `${d.label}: ${d.value}`);

  const col1X = marginX;
  const col2X = marginX + 250;
  
  for (let i = 0; i < details.length; i += 2) {
    doc.text(details[i], col1X, currentY);
    if (details[i+1]) {
      doc.text(details[i+1], col2X, currentY);
    }
    currentY += 15;
  }
  
  currentY += 20;

  // Monthly stats table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Monthly Attendance Overview (${selectedYear})`, marginX, currentY);
  currentY += 15;

  const tableData = monthlyStats.map(stat => [
    stat.monthName,
    stat.totalDays.toString(),
    stat.workingDays.toString(),
    stat.presentDays.toString(),
    stat.pnDays.toString(),
    stat.absentDays.toString()
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Month', 'Total Days', 'Working Days', 'Present', 'P/N', 'Absent']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [26, 42, 94], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center', textColor: [46, 125, 50], fontStyle: 'bold' }, // Green for Present
      4: { halign: 'center', textColor: [21, 101, 192], fontStyle: 'bold' }, // Blue for P/N
      5: { halign: 'center', textColor: [198, 40, 40], fontStyle: 'bold' } // Red for Absent
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 30;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Generated on: " + new Date().toLocaleString(), marginX, finalY);

  // Save the PDF
  const safeName = employee.fullName.replace(/\s+/g, '_');
  doc.save(`Employee_Report_${safeName}_${selectedYear}.pdf`);
};
