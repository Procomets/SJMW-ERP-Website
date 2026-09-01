import ExcelJS from 'exceljs';
import { format, getDaysInMonth, isSunday } from 'date-fns';
import type { Employee } from '../../employeeMaster/types/employee';
import type { AttendanceRecord } from '../../attendance/types/attendance';
import type { SalaryRecord } from '../types/salarySheet';

const DARK_BLUE = 'FF002060';
const WHITE = 'FFFFFFFF';
const BLACK = 'FF000000';
const LIGHT_GREEN = 'FFC5E0B4';

const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK_BLUE } };
const SUB_HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001A4D' } };
const GREEN_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GREEN } };

const BOLD_WHITE: Partial<ExcelJS.Font> = { bold: true, color: { argb: WHITE }, size: 9, name: 'Calibri' };
const BOLD_BLACK: Partial<ExcelJS.Font> = { bold: true, color: { argb: BLACK }, size: 10, name: 'Calibri' };
const NORMAL_BLACK: Partial<ExcelJS.Font> = { size: 10, color: { argb: BLACK }, name: 'Calibri' };

const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: BLACK } },
  left: { style: 'thin', color: { argb: BLACK } },
  bottom: { style: 'thin', color: { argb: BLACK } },
  right: { style: 'thin', color: { argb: BLACK } },
};

export const exportMonthlySalaryToExcel = async (
  employees: Employee[],
  attendanceRecords: AttendanceRecord[],
  currentMonth: Date,
  editableRows: Record<string, Partial<SalaryRecord>>
) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Monthly Salary');

  const daysInMonth = getDaysInMonth(currentMonth);
  let sundaysCount = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    if (isSunday(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))) {
      sundaysCount++;
    }
  }
  const noOfDays = daysInMonth - sundaysCount;

  // Title Rows
  ws.mergeCells(1, 1, 1, 25);
  const title1 = ws.getCell(1, 1);
  title1.value = 'Sri Jothi Moulding Works';
  title1.fill = HEADER_FILL;
  title1.font = { ...BOLD_WHITE, size: 14 };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells(2, 1, 2, 25);
  const title2 = ws.getCell(2, 1);
  title2.value = `Salary Sheet For The Month Of ${currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
  title2.fill = HEADER_FILL;
  title2.font = { ...BOLD_WHITE, size: 11 };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };

  // Headers
  const headers = [
    'S NO', 'Name', 'Designation', 'DOJ', 'Hike', 'Salary', 'No Of\nDays', 'Per day\nPay', 'No Of\nPresent',
    'Gross\nSalary', 'Basic\n50%', 'HRA\n20%', 'SA\n20%', 'MA\n4%', 'CA\n6%', 'PF', 'ESI', 'Salary\nAdvance',
    'No Of\nLeave', 'LOP', 'Net\nSalary', 'A/c No', 'IFSC Code', 'Branch', 'Remark'
  ];
  const headerRow = ws.getRow(3);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.fill = (h === 'Salary' || h === 'Gross\nSalary' || h === 'Net\nSalary') ? SUB_HEADER_FILL : HEADER_FILL;
    cell.font = BOLD_WHITE;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = BORDER;
  });
  headerRow.height = 30;

  // Column widths
  ws.getColumn(1).width = 5;
  ws.getColumn(2).width = 20;
  ws.getColumn(3).width = 15;
  ws.getColumn(4).width = 12;
  for (let i = 5; i <= 21; i++) ws.getColumn(i).width = 10;
  ws.getColumn(22).width = 15;
  ws.getColumn(23).width = 15;
  ws.getColumn(24).width = 15;
  ws.getColumn(25).width = 20;

  let rowNum = 4;
  for (let index = 0; index < employees.length; index++) {
    const emp = employees[index];
    const rowState = editableRows[emp.employeeId] || {};
    const salary = (parseFloat(String(emp.monthlyIncome || 0)) || 0) + (rowState.hike || 0);
    const empAtt = attendanceRecords.filter(r => r.employeeId === emp.employeeId);
    const noOfPresent = empAtt.filter(r => r.status === 'Present' || r.status === 'N').length;
    const noOfLeave = noOfDays - noOfPresent;

    const row = ws.getRow(rowNum);
    
    // A: S NO
    row.getCell(1).value = index + 1;
    // B: Name
    row.getCell(2).value = emp.fullName;
    // C: Designation
    row.getCell(3).value = emp.designation || '';
    // D: DOJ
    row.getCell(4).value = emp.dateOfJoining || '';
    // E: Hike
    row.getCell(5).value = rowState.hike || 0;
    // F: Salary
    row.getCell(6).value = salary;
    row.getCell(6).fill = GREEN_FILL;
    row.getCell(6).font = BOLD_BLACK;
    // G: No Of Days
    row.getCell(7).value = noOfDays;
    // H: Per day Pay = F / G
    row.getCell(8).value = { formula: `IF(G${rowNum}>0,F${rowNum}/G${rowNum},0)`, result: noOfDays > 0 ? salary / noOfDays : 0 };
    // I: No Of Present
    row.getCell(9).value = noOfPresent;
    // J: Gross Salary = H * I
    row.getCell(10).value = { formula: `H${rowNum}*I${rowNum}`, result: (noOfDays > 0 ? salary / noOfDays : 0) * noOfPresent };
    row.getCell(10).fill = GREEN_FILL;
    row.getCell(10).font = BOLD_BLACK;
    // K: Basic 50% = J * 0.5
    row.getCell(11).value = { formula: `J${rowNum}*0.5`, result: 0 };
    // L: HRA 20% = J * 0.2
    row.getCell(12).value = { formula: `J${rowNum}*0.2`, result: 0 };
    // M: SA 20% = J * 0.2
    row.getCell(13).value = { formula: `J${rowNum}*0.2`, result: 0 };
    // N: MA 4% = J * 0.04
    row.getCell(14).value = { formula: `J${rowNum}*0.04`, result: 0 };
    // O: CA 6% = J * 0.06
    row.getCell(15).value = { formula: `J${rowNum}*0.06`, result: 0 };
    // P: PF
    row.getCell(16).value = rowState.pf || 0;
    // Q: ESI
    row.getCell(17).value = rowState.esi || 0;
    // R: Salary Advance
    row.getCell(18).value = rowState.salaryAdvance || 0;
    // S: No Of Leave
    row.getCell(19).value = noOfLeave;
    // T: LOP
    row.getCell(20).value = rowState.lop || 0;
    // U: Net Salary = J - P - Q - R - T
    row.getCell(21).value = { formula: `J${rowNum}-P${rowNum}-Q${rowNum}-R${rowNum}-T${rowNum}`, result: 0 };
    row.getCell(21).fill = SUB_HEADER_FILL;
    row.getCell(21).font = BOLD_WHITE;
    // V: A/c No
    row.getCell(22).value = emp.accountNumber || '';
    // W: IFSC
    row.getCell(23).value = emp.ifscCode || '';
    // X: Branch
    row.getCell(24).value = emp.bankBranch || '';
    // Y: Remark
    row.getCell(25).value = rowState.remark || '';

    for (let c = 1; c <= 25; c++) {
      row.getCell(c).border = BORDER;
      if (![6, 10, 21].includes(c)) row.getCell(c).font = NORMAL_BLACK;
      if (![2, 3, 24, 25].includes(c)) row.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
    }
    rowNum++;
  }

  // Download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Monthly_Salary_${format(currentMonth, 'MMM_yyyy')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportFifteenDaysSalaryToExcel = async (
  employees: Employee[],
  attendanceRecords: AttendanceRecord[],
  currentMonth: Date,
  period: 'first15' | 'next15',
  editableRows: Record<string, { previousHolding: number, holdingAmount: number }>,
  commissionRate: number
) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('15 Days Salary');

  const daysInMonth = getDaysInMonth(currentMonth);
  const startDay = period === 'first15' ? 1 : 16;
  const endDay = period === 'first15' ? 15 : daysInMonth;
  const dates: Date[] = [];
  for (let i = startDay; i <= endDay; i++) {
    dates.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  // Title Row
  ws.mergeCells(1, 1, 1, dates.length + 7);
  const title1 = ws.getCell(1, 1);
  title1.value = `LABOUR WAGES ${format(dates[0], 'dd-MM-yyyy')} To ${format(dates[dates.length - 1], 'dd-MM-yyyy')}`;
  title1.fill = HEADER_FILL;
  title1.font = { ...BOLD_WHITE, size: 12 };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };

  // Headers
  const headerRow = ws.getRow(2);
  headerRow.getCell(1).value = 'S.NO.';
  headerRow.getCell(2).value = 'NAME';
  for (let i = 0; i < dates.length; i++) {
    headerRow.getCell(3 + i).value = format(dates[i], 'dd.MM.yy');
  }
  headerRow.getCell(3 + dates.length).value = 'TOTAL PRESENT';
  headerRow.getCell(4 + dates.length).value = 'NET AMOUNT';
  headerRow.getCell(5 + dates.length).value = 'PREVIOUS HOLDING';
  headerRow.getCell(6 + dates.length).value = 'PAYABLE AMOUNT';
  headerRow.getCell(7 + dates.length).value = 'HOLDING AMOUNT';

  for (let c = 1; c <= dates.length + 7; c++) {
    const cell = headerRow.getCell(c);
    cell.fill = HEADER_FILL;
    cell.font = BOLD_WHITE;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER;
  }

  // Col widths
  ws.getColumn(1).width = 5;
  ws.getColumn(2).width = 20;
  for (let i = 0; i < dates.length; i++) ws.getColumn(3 + i).width = 8;
  for (let i = 0; i < 5; i++) ws.getColumn(3 + dates.length + i).width = 12;

  let rowNum = 3;
  for (let index = 0; index < employees.length; index++) {
    const emp = employees[index];
    const rowState = editableRows[emp.employeeId] || { previousHolding: 0, holdingAmount: 0 };
    const row = ws.getRow(rowNum);

    row.getCell(1).value = index + 1;
    row.getCell(2).value = emp.fullName;
    
    let presentCount = 0;
    for (let i = 0; i < dates.length; i++) {
      const d = dates[i];
      const dateStr = format(d, 'yyyy-MM-dd');
      const attRecord = attendanceRecords.find(r => r.employeeId === emp.employeeId && r.date === dateStr);
      let val = '-';
      if (attRecord?.status === 'Present') { val = 'P'; presentCount++; }
      else if (attRecord?.status === 'N') { val = 'N'; presentCount++; }
      else if (attRecord?.status === 'Absent') { val = 'AB'; }
      else if (attRecord?.status === 'P/N') { val = 'P/N'; presentCount += 2; }
      
      row.getCell(3 + i).value = val;
    }

    const totalPresentCol = 3 + dates.length;
    const netAmountCol = 4 + dates.length;
    const prevHoldingCol = 5 + dates.length;
    const payableCol = 6 + dates.length;
    const holdAmountCol = 7 + dates.length;

    // Convert col index to Excel col letter (e.g. 18 -> R)
    const getColStr = (c: number) => String.fromCharCode(64 + c);
    const tpChar = getColStr(totalPresentCol);
    const naChar = getColStr(netAmountCol);
    const phChar = getColStr(prevHoldingCol);
    const hmChar = getColStr(holdAmountCol);

    row.getCell(totalPresentCol).value = presentCount;
    row.getCell(netAmountCol).value = { formula: `${tpChar}${rowNum}*${commissionRate}`, result: presentCount * commissionRate };
    row.getCell(prevHoldingCol).value = rowState.previousHolding || 0;
    row.getCell(payableCol).value = { formula: `${naChar}${rowNum}+${phChar}${rowNum}-${hmChar}${rowNum}`, result: 0 };
    row.getCell(holdAmountCol).value = rowState.holdingAmount || 0;

    for (let c = 1; c <= dates.length + 7; c++) {
      row.getCell(c).border = BORDER;
      row.getCell(c).font = NORMAL_BLACK;
      if (c !== 2) row.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    row.getCell(totalPresentCol).font = BOLD_BLACK;
    row.getCell(netAmountCol).font = BOLD_BLACK;
    row.getCell(payableCol).font = BOLD_BLACK;

    rowNum++;
  }

  // Footer Row
  const fRow = ws.getRow(rowNum);
  fRow.getCell(2).value = 'TOTAL';
  fRow.getCell(2).font = BOLD_BLACK;
  
  const getColStr = (c: number) => String.fromCharCode(64 + c);
  const startR = 3;
  const endR = rowNum - 1;

  if (employees.length > 0) {
    // Total Present
    const tpCol = 3 + dates.length;
    fRow.getCell(tpCol).value = { formula: `SUM(${getColStr(tpCol)}${startR}:${getColStr(tpCol)}${endR})`, result: 0 };
    fRow.getCell(tpCol).font = BOLD_BLACK;

    // Total Net Amount
    const naCol = 4 + dates.length;
    fRow.getCell(naCol).value = { formula: `SUM(${getColStr(naCol)}${startR}:${getColStr(naCol)}${endR})`, result: 0 };
    fRow.getCell(naCol).font = BOLD_BLACK;

    // Total Payable Amount
    const paCol = 6 + dates.length;
    fRow.getCell(paCol).value = { formula: `SUM(${getColStr(paCol)}${startR}:${getColStr(paCol)}${endR})`, result: 0 };
    fRow.getCell(paCol).font = BOLD_BLACK;
  }

  for (let c = 1; c <= dates.length + 7; c++) {
    fRow.getCell(c).border = BORDER;
    if (c !== 2 && c !== 3 + dates.length && c !== 4 + dates.length && c !== 6 + dates.length) {
      fRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
    }
  }

  // Download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Fifteen_Days_Salary_${period}_${format(currentMonth, 'MMM_yyyy')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
