import ExcelJS from 'exceljs';
import { format, getDaysInMonth, isSunday } from 'date-fns';
import { getEmployees } from '../../employeeMaster/services/employeeService';
import { getAttendanceForMonth } from '../../attendance/services/attendanceService';
import { getSalaryRecordsForMonth } from '../../salarySheet/services/salarySheetService';
import type { DashboardFilters, DateRange } from '../types/dashboard.types';
import type { DashboardRawData } from '../hooks/useDashboardData';

const tsToDateStr = (ts: any): string => {
  if (!ts) return '—';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return format(d, 'dd/MM/yyyy');
  } catch {
    return '—';
  }
};

interface ExportExcelOptions {
  filters: DashboardFilters;
  data: DashboardRawData;
  range: DateRange;
}

// Styling Constants for ExcelJS
const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } };
const WHITE_BOLD: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' };
const WHITE_TITLE: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12, name: 'Calibri' };
const BLACK_FONT: Partial<ExcelJS.Font> = { size: 10, color: { argb: 'FF000000' }, name: 'Calibri' };
const BLACK_BOLD: Partial<ExcelJS.Font> = { bold: true, size: 10, color: { argb: 'FF000000' }, name: 'Calibri' };
const GREEN_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC5E0B4' } };
const ORANGE_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8CBAD' } };

const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
  left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
  bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
  right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
};

export const exportDashboardExcel = async ({
  filters,
  data,
  range,
}: ExportExcelOptions): Promise<void> => {
  const currentMonthDate = range.start || new Date();
  const monthYearStr = format(currentMonthDate, 'yyyy-MM');

  // Fetch Employees, Attendance & Salary Records asynchronously
  const [allEmployees, attendanceRecords, salaryRecords] = await Promise.all([
    getEmployees().catch(() => []),
    getAttendanceForMonth(monthYearStr).catch(() => []),
    getSalaryRecordsForMonth(monthYearStr).catch(() => []),
  ]);

  const activeEmployees = allEmployees.filter(e => e.employmentStatus === 'Active' || e.employmentStatus === undefined);

  const inDateRange = (dateObj: Date | null): boolean => {
    if (!dateObj) return false;
    return dateObj >= range.start && dateObj <= range.end;
  };

  const workbook = new ExcelJS.Workbook();

  // --------------------------------------------------------------------------
  // SHEET 1: PRODUCTION LEDGER
  // --------------------------------------------------------------------------
  const wsProd = workbook.addWorksheet('Production Ledger');
  const prodHeaders = [
    'S.No', 'Date', 'Heat No', 'Alloy Type', 'Furnace No', 'Shift Start',
    'Shift End', 'Total Input (kg)', 'Good Ingots Output (kg)',
    'Recovery Efficiency (%)',
  ];

  const prodHeaderRow = wsProd.addRow(prodHeaders);
  prodHeaderRow.height = 24;
  prodHeaderRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = WHITE_BOLD;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER;
  });

  const filteredProd = data.productionEntries.filter((e) => {
    const d = e.date ? (e.date.toDate ? e.date.toDate() : new Date(e.date)) : null;
    if (!inDateRange(d)) return false;
    if (filters.alloyType && e.alloyType !== filters.alloyType) return false;
    if (filters.furnaceNo && e.furnaceNo !== filters.furnaceNo) return false;
    if (filters.supervisor && e.supervisorName !== filters.supervisor) return false;
    return true;
  });

  filteredProd.forEach((e, index) => {
    const r = wsProd.addRow([
      index + 1,
      tsToDateStr(e.date),
      e.heatNo || '—',
      e.alloyType || '—',
      e.furnaceNo || '—',
      `${e.shiftStartTime || ''} ${e.shiftStartPeriod || ''}`.trim() || '—',
      `${e.shiftEndTime || ''} ${e.shiftEndPeriod || ''}`.trim() || '—',
      e.totalInput ?? 0,
      e.goodIngots ?? 0,
      e.efficiencyPercentage ? `${e.efficiencyPercentage.toFixed(2)}%` : '0%',
    ]);
    r.eachCell((cell, colNumber) => {
      cell.font = BLACK_FONT;
      cell.border = BORDER;
      cell.alignment = { horizontal: colNumber >= 8 && colNumber <= 10 ? 'right' : 'center', vertical: 'middle' };
    });
  });

  wsProd.columns.forEach((col) => { col.width = 16; });
  wsProd.getColumn(1).width = 8;
  wsProd.getColumn(2).width = 14;

  // --------------------------------------------------------------------------
  // SHEET 2: WAREHOUSE INVENTORY
  // --------------------------------------------------------------------------
  const wsWarehouse = workbook.addWorksheet('Warehouse Inventory');
  const whHeaders = [
    'S.No', 'Material Code', 'Material Name', 'Category', 'Unit',
    'Current Stock (kg)', 'Minimum Stock (kg)', 'Stock Status', 'Last Updated',
  ];

  const whHeaderRow = wsWarehouse.addRow(whHeaders);
  whHeaderRow.height = 24;
  whHeaderRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = WHITE_BOLD;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER;
  });

  data.inventoryItems.forEach((i, index) => {
    const current = i.currentStockKg ?? 0;
    const min = i.minimumStockKg ?? 0;
    let status = 'Healthy';
    if (current <= 0) status = 'Out Of Stock';
    else if (current < min * 0.5) status = 'Critical Stock';
    else if (current < min) status = 'Low Stock';

    const r = wsWarehouse.addRow([
      index + 1,
      i.materialCode || '—',
      i.materialName || '—',
      i.category || 'Raw Material',
      i.unit || 'kg',
      current,
      min,
      status,
      tsToDateStr(i.updatedAt),
    ]);

    r.eachCell((cell, colNumber) => {
      cell.font = BLACK_FONT;
      cell.border = BORDER;
      cell.alignment = { horizontal: colNumber === 6 || colNumber === 7 ? 'right' : 'center', vertical: 'middle' };
    });
  });

  wsWarehouse.columns.forEach((col) => { col.width = 18; });
  wsWarehouse.getColumn(1).width = 8;
  wsWarehouse.getColumn(3).width = 28;

  // --------------------------------------------------------------------------
  // SHEET 3: COST LEDGER
  // --------------------------------------------------------------------------
  const wsCost = workbook.addWorksheet('Cost Ledger');
  const costHeaders = [
    'S.No', 'Date', 'Heat No', 'Alloy Type', 'Production Cost (₹/kg)',
    'Expected Selling Price (₹/kg)', 'Sold Price (₹/kg)', 'Profit Margin (₹/kg)',
  ];

  const costHeaderRow = wsCost.addRow(costHeaders);
  costHeaderRow.height = 24;
  costHeaderRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = WHITE_BOLD;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER;
  });

  const filteredCost = data.costEntries.filter((c) => {
    const d = c.date ? (c.date.toDate ? c.date.toDate() : new Date(c.date)) : null;
    if (!inDateRange(d)) return false;
    if (filters.alloyType && c.alloyType !== filters.alloyType) return false;
    return true;
  });

  filteredCost.forEach((c, index) => {
    const costPerKg = c.totalProductionCostPerKg ?? 0;
    const sellingPrice = c.sellingPricePerKg ?? 0;
    const soldPrice = c.soldPricePerKg ?? sellingPrice;
    const margin = soldPrice - costPerKg;

    const r = wsCost.addRow([
      index + 1,
      tsToDateStr(c.date),
      c.heatNo || '—',
      c.alloyType || '—',
      costPerKg,
      sellingPrice,
      soldPrice,
      Math.round(margin * 100) / 100,
    ]);

    r.eachCell((cell, colNumber) => {
      cell.font = BLACK_FONT;
      cell.border = BORDER;
      cell.alignment = { horizontal: colNumber >= 5 && colNumber <= 8 ? 'right' : 'center', vertical: 'middle' };
    });
  });

  wsCost.columns.forEach((col) => { col.width = 18; });
  wsCost.getColumn(1).width = 8;

  // --------------------------------------------------------------------------
  // SHEET 4: DISPATCH MANAGEMENT
  // --------------------------------------------------------------------------
  const wsDispatch = workbook.addWorksheet('Dispatch Management');
  const dispatchHeaders = [
    'S.No', 'Dispatch Date', 'Customer Name', 'Vehicle No',
    'Driver Name', 'Alloy Type', 'Total Dispatch Weight (kg)', 'Status',
  ];

  const dispatchHeaderRow = wsDispatch.addRow(dispatchHeaders);
  dispatchHeaderRow.height = 24;
  dispatchHeaderRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = WHITE_BOLD;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER;
  });

  const filteredDispatch = data.dispatches.filter((d) => {
    const dt = d.dispatchDate ? (d.dispatchDate.toDate ? d.dispatchDate.toDate() : new Date(d.dispatchDate)) : null;
    if (!inDateRange(dt)) return false;
    if (filters.customer && d.customerName !== filters.customer) return false;
    if (filters.alloyType && d.alloyType !== filters.alloyType) return false;
    return true;
  });

  filteredDispatch.forEach((d, index) => {
    const r = wsDispatch.addRow([
      index + 1,
      tsToDateStr(d.dispatchDate),
      d.customerName || '—',
      d.vehicleNumber || '—',
      d.driverName || '—',
      d.alloyType || '—',
      d.totalDispatchWeightKg ?? 0,
      d.status || 'Dispatched',
    ]);

    r.eachCell((cell, colNumber) => {
      cell.font = BLACK_FONT;
      cell.border = BORDER;
      cell.alignment = { horizontal: colNumber === 7 ? 'right' : 'center', vertical: 'middle' };
    });
  });

  wsDispatch.columns.forEach((col) => { col.width = 18; });
  wsDispatch.getColumn(1).width = 8;
  wsDispatch.getColumn(3).width = 28;

  // --------------------------------------------------------------------------
  // SHEET 5: EMPLOYEE ATTENDANCE (Matrix Format matching Screenshot 1)
  // --------------------------------------------------------------------------
  const wsAtt = workbook.addWorksheet('Employee Attendance');
  const daysInMonth = getDaysInMonth(currentMonthDate);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  let sundaysCount = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), day);
    if (isSunday(d)) sundaysCount++;
  }
  const totalWorkingDays = daysInMonth - sundaysCount;

  // Title Row
  wsAtt.mergeCells(1, 1, 1, 4 + daysInMonth);
  const attTitleCell = wsAtt.getCell(1, 1);
  attTitleCell.value = `Employee Attendance Register - ${format(currentMonthDate, 'MMMM yyyy')}`;
  attTitleCell.fill = HEADER_FILL;
  attTitleCell.font = WHITE_TITLE;
  attTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  wsAtt.getRow(1).height = 30;

  // Header Row
  const attHeaderRow = wsAtt.getRow(2);
  attHeaderRow.getCell(1).value = 'S.No';
  attHeaderRow.getCell(2).value = 'Employee Name';
  attHeaderRow.getCell(3).value = 'Code';
  attHeaderRow.getCell(4).value = 'Type';
  for (let dayIdx = 0; dayIdx < daysInMonth; dayIdx++) {
    attHeaderRow.getCell(5 + dayIdx).value = daysArray[dayIdx];
  }
  attHeaderRow.getCell(5 + daysInMonth).value = 'Working / Present';

  for (let c = 1; c <= 5 + daysInMonth; c++) {
    const cell = attHeaderRow.getCell(c);
    cell.fill = HEADER_FILL;
    cell.font = WHITE_BOLD;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER;
  }
  attHeaderRow.height = 24;

  // Fill Employee Attendance Matrix
  activeEmployees.forEach((emp, index) => {
    const row = wsAtt.getRow(3 + index);
    row.getCell(1).value = index + 1;
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(1).font = BLACK_FONT;
    row.getCell(1).border = BORDER;

    row.getCell(2).value = emp.fullName || '—';
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(2).font = BLACK_BOLD;
    row.getCell(2).border = BORDER;

    row.getCell(3).value = emp.employeeCode || emp.employeeId || '—';
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(3).font = BLACK_FONT;
    row.getCell(3).border = BORDER;

    row.getCell(4).value = emp.employeeType || 'Monthly Salary';
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(4).font = BLACK_FONT;
    row.getCell(4).border = BORDER;

    let presentCount = 0;

    for (let dayIdx = 0; dayIdx < daysInMonth; dayIdx++) {
      const day = daysArray[dayIdx];
      const d = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), day);
      const dateStr = format(d, 'yyyy-MM-dd');
      const rec = attendanceRecords.find((r) => r.employeeId === emp.employeeId && r.date === dateStr);

      let text = '-';
      let textColor = 'FF1E293B';
      let bgColor = 'FFFFFFFF';

      if (rec?.status === 'Present') {
        presentCount++;
        bgColor = 'FFE8F5E9'; textColor = 'FF2E7D32'; text = 'P';
      } else if (rec?.status === 'N') {
        presentCount++;
        bgColor = 'FFEDE7F6'; textColor = 'FF4527A0'; text = 'N';
      } else if (rec?.status === 'Absent') {
        bgColor = 'FFFFEBEE'; textColor = 'FFC62828'; text = 'AB';
      } else if (rec?.status === 'P/N') {
        presentCount += 2;
        bgColor = 'FFE3F2FD'; textColor = 'FF1565C0'; text = 'P/N';
      } else if (isSunday(d)) {
        bgColor = 'FFFFF3E0'; textColor = 'FFD97706'; text = 'SUN';
      }

      const cell = row.getCell(5 + dayIdx);
      cell.value = text;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.font = { bold: !!rec, color: { argb: textColor }, size: 9, name: 'Calibri' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.border = BORDER;
    }

    const workingCell = row.getCell(5 + daysInMonth);
    workingCell.value = `${totalWorkingDays} / ${presentCount}`;
    workingCell.alignment = { horizontal: 'center', vertical: 'middle' };
    workingCell.font = BLACK_BOLD;
    workingCell.border = BORDER;
  });

  wsAtt.getColumn(1).width = 6;
  wsAtt.getColumn(2).width = 26;
  wsAtt.getColumn(3).width = 14;
  wsAtt.getColumn(4).width = 16;
  for (let d = 0; d < daysInMonth; d++) {
    wsAtt.getColumn(5 + d).width = 5;
  }
  wsAtt.getColumn(5 + daysInMonth).width = 20;

  // --------------------------------------------------------------------------
  // SHEET 6: SALARY SHEET (Matrix Format matching Screenshot 2)
  // --------------------------------------------------------------------------
  const wsSalary = workbook.addWorksheet('Salary Sheet');

  // Title Rows
  wsSalary.mergeCells(1, 1, 1, 20);
  const companyTitle = wsSalary.getCell(1, 1);
  companyTitle.value = 'Sri Jothi Moulding Works';
  companyTitle.fill = HEADER_FILL;
  companyTitle.font = WHITE_TITLE;
  companyTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  wsSalary.getRow(1).height = 26;

  wsSalary.mergeCells(2, 1, 2, 20);
  const monthTitle = wsSalary.getCell(2, 1);
  monthTitle.value = `Salary Sheet For The Month Of ${format(currentMonthDate, 'MMMM yyyy')}`;
  monthTitle.fill = HEADER_FILL;
  monthTitle.font = WHITE_BOLD;
  monthTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  wsSalary.getRow(2).height = 22;

  // Header Row (Removed unused CA 6%, PF, ESI, Salary Advance, LOP)
  const salHeaders = [
    'S NO', 'Name', 'Designation', 'DOJ', 'Hike', 'Salary',
    'No Of Days', 'Per day Pay', 'No Of Present', 'Gross Salary',
    'Basic 50%', 'HRA 20%', 'SA 20%', 'MA 4%', 'No Of Leave', 'Net Salary',
    'A/c No', 'IFSC Code', 'Branch', 'Remark',
  ];

  const salHeaderRow = wsSalary.getRow(3);
  salHeaders.forEach((h, colIdx) => {
    const cell = salHeaderRow.getCell(colIdx + 1);
    cell.value = h;
    cell.fill = HEADER_FILL;
    cell.font = WHITE_BOLD;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = BORDER;
  });
  salHeaderRow.height = 26;

  let totSalary = 0;
  let totGross = 0;
  let totBasic = 0;
  let totHRA = 0;
  let totSA = 0;
  let totMA = 0;
  let totNet = 0;

  activeEmployees.forEach((emp, index) => {
    const record = salaryRecords.find((r) => r.employeeId === emp.employeeId);
    const hike = record?.hike || 0;
    const salary = (parseFloat(String(emp.monthlyIncome || 0)) || 0) + hike;
    const perDayPay = totalWorkingDays > 0 ? salary / totalWorkingDays : 0;

    // Attendance calculation with 2 Days Paid Leave logic
    const empAtt = attendanceRecords.filter((r) => r.employeeId === emp.employeeId);
    const noOfPresent = empAtt.filter((r) => r.status === 'Present' || r.status === 'N').length;
    const noOfLeave = Math.max(0, totalWorkingDays - noOfPresent);
    const paidLeave = Math.min(noOfLeave, 2);
    const paidDays = Math.min(totalWorkingDays, noOfPresent + paidLeave);

    const grossSalary = paidDays === totalWorkingDays ? salary : perDayPay * paidDays;
    const basic = grossSalary * 0.5;
    const hra = grossSalary * 0.2;
    const sa = grossSalary * 0.2;
    const ma = grossSalary * 0.04;

    const pf = record?.pf || 0;
    const esi = record?.esi || 0;
    const advance = record?.salaryAdvance || 0;
    const lop = record?.lop || 0;

    const netSalary = grossSalary - pf - esi - advance - lop;

    totSalary += salary;
    totGross += grossSalary;
    totBasic += basic;
    totHRA += hra;
    totSA += sa;
    totMA += ma;
    totNet += netSalary;

    const row = wsSalary.getRow(4 + index);
    row.getCell(1).value = index + 1; // S NO
    row.getCell(2).value = emp.fullName || '—'; // Name
    row.getCell(3).value = emp.designation || '—'; // Designation
    row.getCell(4).value = emp.dateOfJoining || '—'; // DOJ
    row.getCell(5).value = hike; // Hike
    row.getCell(6).value = Math.round(salary); // Salary
    row.getCell(7).value = totalWorkingDays; // No Of Days
    row.getCell(8).value = Math.round(perDayPay); // Per day Pay
    row.getCell(9).value = noOfPresent; // No Of Present
    row.getCell(10).value = Math.round(grossSalary); // Gross Salary
    row.getCell(11).value = Math.round(basic); // Basic 50%
    row.getCell(12).value = Math.round(hra); // HRA 20%
    row.getCell(13).value = Math.round(sa); // SA 20%
    row.getCell(14).value = Math.round(ma); // MA 4%
    row.getCell(15).value = noOfLeave; // No Of Leave
    row.getCell(16).value = Math.round(netSalary); // Net Salary
    row.getCell(17).value = emp.accountNumber || '—'; // A/c No
    row.getCell(18).value = emp.ifscCode || '—'; // IFSC Code
    row.getCell(19).value = emp.bankBranch || '—'; // Branch
    row.getCell(20).value = record?.remark || '—'; // Remark

    row.eachCell((cell, colIdx) => {
      cell.font = BLACK_FONT;
      cell.border = BORDER;
      cell.alignment = { horizontal: colIdx >= 5 && colIdx <= 16 ? 'right' : colIdx === 2 ? 'left' : 'center', vertical: 'middle' };

      // Highlight Salary & Gross Salary (Light Green)
      if (colIdx === 6 || colIdx === 10) {
        cell.fill = GREEN_FILL;
        cell.font = BLACK_BOLD;
      }
      // Highlight Net Salary (Light Orange)
      if (colIdx === 16) {
        cell.fill = ORANGE_FILL;
        cell.font = BLACK_BOLD;
      }
    });
  });

  // TOTALS ROW at Bottom of Salary Sheet
  const totalRowIdx = 4 + activeEmployees.length;
  const totalRow = wsSalary.getRow(totalRowIdx);
  totalRow.getCell(1).value = 'TOTAL';
  wsSalary.mergeCells(totalRowIdx, 1, totalRowIdx, 5);

  totalRow.getCell(6).value = Math.round(totSalary);
  totalRow.getCell(10).value = Math.round(totGross);
  totalRow.getCell(11).value = Math.round(totBasic);
  totalRow.getCell(12).value = Math.round(totHRA);
  totalRow.getCell(13).value = Math.round(totSA);
  totalRow.getCell(14).value = Math.round(totMA);
  totalRow.getCell(16).value = Math.round(totNet);

  totalRow.eachCell((cell, colIdx) => {
    cell.fill = HEADER_FILL;
    cell.font = WHITE_BOLD;
    cell.alignment = { horizontal: colIdx >= 6 && colIdx <= 16 ? 'right' : 'center', vertical: 'middle' };
    cell.border = BORDER;
  });

  wsSalary.columns.forEach((col) => { col.width = 14; });
  wsSalary.getColumn(1).width = 6;
  wsSalary.getColumn(2).width = 24;
  wsSalary.getColumn(3).width = 20;
  wsSalary.getColumn(4).width = 14;

  // --------------------------------------------------------------------------
  // DOWNLOAD EXCEL WORKBOOK
  // --------------------------------------------------------------------------
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const filename = `Executive_Dashboard_Comprehensive_Report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
