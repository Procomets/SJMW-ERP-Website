import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, getDaysInMonth, isSunday } from 'date-fns';
import type { Employee } from '../../employeeMaster/types/employee';
import type { AttendanceRecord } from '../../attendance/types/attendance';
import type { SalaryRecord } from '../types/salarySheet';

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

const addHeader = async (doc: jsPDF, title: string) => {
  const marginX = 20;
  let currentY = 30;
  const pageWidth = doc.internal.pageSize.getWidth();

  try {
    const logoBase64 = await getBase64ImageFromUrl('/logo.png');
    doc.addImage(logoBase64, 'PNG', marginX, currentY, 50, 50);
  } catch (error) {
    console.error('Failed to load logo for PDF', error);
  }

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Sri Jothi Moulding Works", marginX + 60, currentY + 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("AC 31/9, TINY PLOT, THIRUMUDIVAKKAM SIDCO Industrial Estate,", marginX + 60, currentY + 35);
  doc.text("Chennai, Tamil Nadu 600132, India", marginX + 60, currentY + 47);
  
  currentY += 70;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, currentY, { align: "center" });
  currentY += 20;
  
  return currentY;
};

export const exportMonthlySalaryToPdf = async (
  employees: Employee[],
  attendanceRecords: AttendanceRecord[],
  currentMonth: Date,
  editableRows: Record<string, Partial<SalaryRecord>>
) => {
  const doc = new jsPDF('l', 'pt', 'a4'); 
  const title = `Salary Sheet For The Month Of ${currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
  
  let currentY = await addHeader(doc, title);

  const daysInMonth = getDaysInMonth(currentMonth);
  let sundaysCount = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    if (isSunday(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))) {
      sundaysCount++;
    }
  }
  const noOfDays = daysInMonth - sundaysCount;

  const tableData: any[][] = [];

  let totalGross = 0, totalBasic = 0, totalHRA = 0, totalSA = 0, totalMA = 0, totalCA = 0;
  let totalPF = 0, totalESI = 0, totalAdvance = 0, totalLOP = 0, totalNet = 0;
  let totalSalary = 0;

  employees.forEach((emp, index) => {
    const rowState = editableRows[emp.employeeId] || {};
    const salary = (parseFloat(String(emp.monthlyIncome || 0)) || 0) + (rowState.hike || 0);
    const perDayPay = noOfDays > 0 ? (salary / noOfDays) : 0;
    
    const empAtt = attendanceRecords.filter(r => r.employeeId === emp.employeeId);
    const noOfPresent = empAtt.filter(r => r.status === 'Present' || r.status === 'N').length;
    const noOfLeave = noOfDays - noOfPresent;
    
    const grossSalary = perDayPay * noOfPresent;
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

    tableData.push([
      index + 1,
      emp.fullName,
      emp.designation,
      emp.dateOfJoining || '',
      rowState.hike || 0,
      salary.toFixed(0),
      noOfDays,
      perDayPay.toFixed(0),
      noOfPresent,
      grossSalary.toFixed(0),
      basic.toFixed(0),
      hra.toFixed(0),
      sa.toFixed(0),
      ma.toFixed(0),
      ca.toFixed(0),
      pf,
      esi,
      advance,
      noOfLeave,
      lop,
      netSalary.toFixed(0),
      emp.accountNumber || '',
      emp.ifscCode || '',
      emp.bankBranch || '',
      rowState.remark || ''
    ]);
  });

  tableData.push([
    { content: 'TOTAL', colSpan: 5, styles: { halign: 'center', fontStyle: 'bold' } },
    totalSalary.toFixed(0),
    '', '', '',
    totalGross.toFixed(0),
    totalBasic.toFixed(0),
    totalHRA.toFixed(0),
    totalSA.toFixed(0),
    totalMA.toFixed(0),
    totalCA.toFixed(0),
    totalPF.toFixed(0),
    totalESI.toFixed(0),
    totalAdvance.toFixed(0),
    '',
    totalLOP.toFixed(0),
    totalNet.toFixed(0),
    '', '', '', ''
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [[
      'S NO', 'Name', 'Designation', 'DOJ', 'Hike', 'Salary', 'Days', 'Per Day', 'Present', 
      'Gross', 'Basic', 'HRA', 'SA', 'MA', 'CA', 'PF', 'ESI', 'Advance', 'Leave', 'LOP', 'Net Salary', 
      'A/c No', 'IFSC', 'Branch', 'Remark'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 32, 96], textColor: 255, halign: 'center', fontSize: 6, cellPadding: 2 },
    styles: { fontSize: 6, cellPadding: 2 },
    columnStyles: {
      5: { fillColor: [197, 224, 180], fontStyle: 'bold' },
      9: { fillColor: [197, 224, 180], fontStyle: 'bold' },
      20: { fillColor: [248, 203, 173], fontStyle: 'bold' },
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(8);
  doc.text("Exported on: " + new Date().toLocaleString(), 20, finalY);

  doc.save(`Monthly_Salary_${format(currentMonth, 'MMMM_yyyy')}.pdf`);
};

export const exportFifteenDaysSalaryToPdf = async (
  employees: Employee[],
  attendanceRecords: AttendanceRecord[],
  currentMonth: Date,
  period: 'first15' | 'next15',
  editableRows: Record<string, { previousHolding: number, holdingAmount: number }>,
  commissionRate: number
) => {
  const doc = new jsPDF('l', 'pt', 'a4');
  
  const daysInMonth = getDaysInMonth(currentMonth);
  const startDay = period === 'first15' ? 1 : 16;
  const endDay = period === 'first15' ? 15 : daysInMonth;
  
  const dates: Date[] = [];
  for (let i = startDay; i <= endDay; i++) {
    dates.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }
  
  const title = `LABOUR WAGES ${format(dates[0], 'dd-MM-yyyy')} To ${format(dates[dates.length - 1], 'dd-MM-yyyy')}`;
  let currentY = await addHeader(doc, title);

  const tableData: any[][] = [];
  let totalNetAmount = 0;
  let totalPayableAmount = 0;
  let totalOverallPresent = 0;
  const dailyPresentCount = new Array(dates.length).fill(0);

  employees.forEach((emp, index) => {
    const rowState = editableRows[emp.employeeId] || { previousHolding: 0, holdingAmount: 0 };
    const wagesPer = parseFloat(String(emp.dailyWages || 0)) || 0;
    let presentCount = 0;

    const rowData: any[] = [index + 1, { content: emp.fullName, styles: { fillColor: [244, 176, 132] } }];

    dates.forEach((dateObj, dIndex) => {
      const dateStr = format(dateObj, 'yyyy-MM-dd');
      const attRecord = attendanceRecords.find(r => r.employeeId === emp.employeeId && r.date === dateStr);
      
      let cellValue = '';
      let bgColor: number[] | false = false;

      if (attRecord?.status === 'Present') {
        cellValue = 'P';
        presentCount++;
        dailyPresentCount[dIndex]++;
      } else if (attRecord?.status === 'P/N') {
        cellValue = 'P/N';
        presentCount += 2;
        dailyPresentCount[dIndex] += 2;
      } else if (isSunday(dateObj)) {
        cellValue = 'S';
        bgColor = [146, 208, 80];
      } else if (attRecord?.status === 'Absent') {
        cellValue = 'A';
      }

      rowData.push(bgColor ? { content: cellValue, styles: { fillColor: bgColor, fontStyle: 'bold', halign: 'center' } } : { content: cellValue, styles: { halign: 'center' } });
    });

    const netAmount = wagesPer * presentCount;
    const payableAmount = netAmount + (rowState.previousHolding || 0) - (rowState.holdingAmount || 0);

    totalNetAmount += netAmount;
    totalPayableAmount += payableAmount;
    totalOverallPresent += presentCount;

    rowData.push(
      wagesPer.toFixed(2),
      presentCount,
      { content: netAmount.toFixed(2), styles: { fillColor: [255, 255, 0], fontStyle: 'bold' } },
      rowState.holdingAmount || 0,
      { content: payableAmount.toFixed(2), styles: { fillColor: [244, 176, 132], fontStyle: 'bold' } }
    );

    tableData.push(rowData);
  });

  const footerRow1 = [
    { content: 'NO.OF.P', colSpan: 2, styles: { fillColor: [0, 32, 96], textColor: 255, fontStyle: 'bold', halign: 'center' } },
    ...dailyPresentCount.map(c => ({ content: c > 0 ? c : '', styles: { fillColor: [0, 32, 96], textColor: 255, fontStyle: 'bold', halign: 'center' } })),
    '',
    { content: totalOverallPresent, styles: { fontStyle: 'bold', halign: 'center' } },
    { content: totalNetAmount.toFixed(2), styles: { fillColor: [255, 255, 0], fontStyle: 'bold' } },
    { content: 'TOTAL', styles: { fontStyle: 'bold' } },
    { content: totalPayableAmount.toFixed(2), styles: { fontStyle: 'bold' } }
  ];

  const footerRow2 = [
    { content: 'Commission', colSpan: dates.length + 6, styles: { fontStyle: 'bold', halign: 'right' } },
    { content: (totalOverallPresent * commissionRate).toFixed(2), styles: { fontStyle: 'bold' } }
  ];

  const footerRow3 = [
    { content: 'TOTAL PAYABLE', colSpan: dates.length + 6, styles: { fontStyle: 'bold', halign: 'right' } },
    { content: (totalPayableAmount + (totalOverallPresent * commissionRate)).toFixed(2), styles: { fillColor: [244, 176, 132], fontStyle: 'bold' } }
  ];

  tableData.push(footerRow1, footerRow2, footerRow3);

  const headRow = ['S.NO.', 'NAME', ...dates.map(d => format(d, 'dd.MM')), 'WAGES', 'DAYS', 'NET', 'HOLDING', 'PAYABLE'];

  autoTable(doc, {
    startY: currentY,
    head: [headRow],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 32, 96], textColor: 255, halign: 'center', fontSize: 7, cellPadding: 2 },
    styles: { fontSize: 7, cellPadding: 2 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(8);
  doc.text("Exported on: " + new Date().toLocaleString(), 20, finalY);

  const periodStr = period === 'first15' ? '1_15' : `16_${daysInMonth}`;
  doc.save(`Labour_Wages_${periodStr}_${format(currentMonth, 'MMM_yyyy')}.pdf`);
};
