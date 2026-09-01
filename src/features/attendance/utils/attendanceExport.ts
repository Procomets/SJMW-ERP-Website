import ExcelJS from 'exceljs';
import { format, getDaysInMonth, isSunday, isToday } from 'date-fns';
import type { Employee } from '../../employeeMaster/types/employee';
import type { AttendanceRecord } from '../types/attendance';

export interface ExportAttendanceParams {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  currentMonth: Date;
  tabName: string;
}

const DARK_BLUE = 'FF1A2A5E';
const WHITE = 'FFFFFFFF';
const BLACK = 'FF1E293B';
const GRID_BORDER = 'FFC5CDD8';

const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK_BLUE } };
const BOLD_WHITE: Partial<ExcelJS.Font> = { bold: true, color: { argb: WHITE }, size: 10, name: 'Inter' };
const NORMAL_BLACK: Partial<ExcelJS.Font> = { size: 10, color: { argb: BLACK }, name: 'Inter' };
const BOLD_BLACK: Partial<ExcelJS.Font> = { bold: true, color: { argb: BLACK }, size: 10, name: 'Inter' };

const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: GRID_BORDER } },
  left: { style: 'thin', color: { argb: GRID_BORDER } },
  bottom: { style: 'thin', color: { argb: GRID_BORDER } },
  right: { style: 'thin', color: { argb: GRID_BORDER } },
};

export const exportAttendanceToExcel = async (params: ExportAttendanceParams) => {
  const { employees, attendanceRecords, currentMonth, tabName } = params;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Attendance');

  const daysInMonth = getDaysInMonth(currentMonth);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  let sundaysCount = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (isSunday(d)) sundaysCount++;
  }
  const totalWorkingDays = daysInMonth - sundaysCount;

  // Columns setup
  ws.getColumn(1).width = 6;  // S.No
  ws.getColumn(2).width = 30; // Employee Name
  for (let i = 0; i < daysInMonth; i++) {
    ws.getColumn(3 + i).width = 5; // Days
  }
  ws.getColumn(3 + daysInMonth).width = 18; // Working / Present

  // Title Row
  ws.mergeCells(1, 1, 1, 3 + daysInMonth);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = `Attendance Register: ${tabName} - ${format(currentMonth, 'MMMM yyyy')}`;
  titleCell.fill = HEADER_FILL;
  titleCell.font = { ...BOLD_WHITE, size: 14 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 30;

  // Headers
  const headerRow = ws.getRow(2);
  headerRow.getCell(1).value = 'S.No';
  headerRow.getCell(2).value = 'Employee Name';
  for (let i = 0; i < daysInMonth; i++) {
    headerRow.getCell(3 + i).value = daysArray[i];
  }
  headerRow.getCell(3 + daysInMonth).value = 'Working / Present';

  for (let i = 1; i <= 3 + daysInMonth; i++) {
    const cell = headerRow.getCell(i);
    cell.fill = HEADER_FILL;
    cell.font = BOLD_WHITE;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER;
  }
  headerRow.height = 24;

  let rowNum = 3;

  for (let index = 0; index < employees.length; index++) {
    const emp = employees[index];
    const row = ws.getRow(rowNum);
    
    row.getCell(1).value = index + 1;
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(1).font = NORMAL_BLACK;
    row.getCell(1).border = BORDER;

    row.getCell(2).value = `${emp.fullName} (${emp.employeeCode})`;
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(2).font = BOLD_BLACK;
    row.getCell(2).border = BORDER;

    let presentCount = 0;

    for (let dayIndex = 0; dayIndex < daysInMonth; dayIndex++) {
      const day = daysArray[dayIndex];
      const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = format(d, 'yyyy-MM-dd');
      const record = attendanceRecords.find(r => r.employeeId === emp.employeeId && r.date === dateStr);
      
      const isSun = isSunday(d);
      const isTod = isToday(d);

      let bgColor = 'FFFFFFFF';
      let textColor = 'FF1E293B';
      let text = '-';

      if (record?.status === 'Present') {
        presentCount++;
        bgColor = 'FFE8F5E9';
        textColor = 'FF2E7D32';
        text = 'P';
      } else if (record?.status === 'N') {
        presentCount++;
        bgColor = 'FFEDE7F6';
        textColor = 'FF4527A0';
        text = 'N';
      } else if (record?.status === 'Absent') {
        bgColor = 'FFFFEBEE';
        textColor = 'FFC62828';
        text = 'AB';
      } else if (record?.status === 'P/N') {
        presentCount += 2;
        bgColor = 'FFE3F2FD';
        textColor = 'FF1565C0';
        text = 'P/N';
      } else if (isTod) {
        bgColor = 'FFE0F7FA';
      } else if (isSun) {
        bgColor = 'FFFFF3E0';
      }

      const cell = row.getCell(3 + dayIndex);
      cell.value = text;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.font = { bold: !!record, color: { argb: textColor }, size: 10, name: 'Inter' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.border = BORDER;
    }

    const lastCell = row.getCell(3 + daysInMonth);
    lastCell.value = `${totalWorkingDays} / ${presentCount}`;
    lastCell.alignment = { horizontal: 'center', vertical: 'middle' };
    lastCell.font = BOLD_BLACK;
    lastCell.border = BORDER;

    rowNum++;
  }

  if (employees.length === 0) {
    ws.mergeCells(rowNum, 1, rowNum, 3 + daysInMonth);
    const emptyCell = ws.getCell(rowNum, 1);
    emptyCell.value = 'No employees found matching the criteria.';
    emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    emptyCell.font = NORMAL_BLACK;
    emptyCell.border = BORDER;
  }

  // ─── Download ──────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeDate = format(currentMonth, 'MMM_yyyy');
  a.download = `Attendance_${tabName.replace(/\s+/g, '_')}_${safeDate}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
