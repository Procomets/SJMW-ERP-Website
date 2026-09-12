import ExcelJS from 'exceljs';
import type { ExpenseRegisterDoc } from '../types/expenseRegister.types';
import { getWeeksForMonth } from '../types/expenseRegister.types';

const HEADER_BG = 'FF1A2A5E';
const TOTAL_COL_BG = 'FFF5C4A1';
const FOOTER_BG = 'FFD6E4F0';
const CATEGORY_BG = 'FFF8FAFC';
const SUB_ROW_BG = 'FFFFFFFF';
const TOTAL_HEADER_BG = 'FF7C3A14';
const GRID_BORDER = 'FFC5CDD8';

const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
const TOTAL_HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_HEADER_BG } };
const TOTAL_COL_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_COL_BG } };
const FOOTER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FOOTER_BG } };
const CATEGORY_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CATEGORY_BG } };
const SUB_ROW_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUB_ROW_BG } };

const WHITE_FONT: Partial<ExcelJS.Font> = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11, name: 'Inter' };
const BOLD_FONT: Partial<ExcelJS.Font> = { bold: true, size: 11, color: { argb: 'FF1E293B' }, name: 'Inter' };
const NORMAL_FONT: Partial<ExcelJS.Font> = { size: 11, color: { argb: 'FF475569' }, name: 'Inter' };
const BOLD_TOTAL_FONT: Partial<ExcelJS.Font> = { bold: true, size: 11, color: { argb: 'FF1E293B' }, name: 'Inter' };

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: GRID_BORDER } },
  left: { style: 'thin', color: { argb: GRID_BORDER } },
  bottom: { style: 'thin', color: { argb: GRID_BORDER } },
  right: { style: 'thin', color: { argb: GRID_BORDER } },
};

export const exportExpenseRegisterToExcel = async (register: ExpenseRegisterDoc): Promise<void> => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Expense Register');

  const weeks = getWeeksForMonth(register.year, register.month);
  const totalCols = 2 + weeks.length + 1; // S.No, Particulars, Week 1..N, Total
  const lastColChar = String.fromCharCode(65 + totalCols - 1);
  const lastWeekColChar = String.fromCharCode(65 + 1 + weeks.length);

  // Column widths
  ws.getColumn(1).width = 8;   // S.No
  ws.getColumn(2).width = 40;  // Particulars
  weeks.forEach((_, idx) => {
    ws.getColumn(3 + idx).width = 18;
  });
  ws.getColumn(totalCols).width = 20; // Total For The Month

  // ─── Title rows ─────────────────────────────────────────────────────
  // Row 1: Company name
  ws.mergeCells(`A1:${lastColChar}1`);
  const titleCell = ws.getCell('A1');
  titleCell.value = 'Sri Jothi Moulding Works';
  titleCell.font = { ...WHITE_FONT, size: 16 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = HEADER_FILL;
  ws.getRow(1).height = 30;

  // Row 2: FY subtitle
  ws.mergeCells(`A2:${lastColChar}2`);
  const fyCell = ws.getCell('A2');
  fyCell.value = `Weekly Expenses For ${register.year}`;
  fyCell.font = { ...WHITE_FONT, size: 13 };
  fyCell.alignment = { horizontal: 'center', vertical: 'middle' };
  fyCell.fill = HEADER_FILL;
  ws.getRow(2).height = 24;

  // Row 3: Month
  ws.mergeCells(`A3:${lastColChar}3`);
  const monthCell = ws.getCell('A3');
  monthCell.value = register.month;
  monthCell.font = { ...WHITE_FONT, size: 12 };
  monthCell.alignment = { horizontal: 'center', vertical: 'middle' };
  monthCell.fill = HEADER_FILL;
  ws.getRow(3).height = 22;

  // Row 4: Column headers
  const headerRow = ws.getRow(4);
  const headers = ['S NO', 'Particulars', ...weeks.map(w => `${w.label}\n(${w.dateRange})`), 'Total For Month'];
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = WHITE_FONT;
    cell.fill = i + 1 === totalCols ? TOTAL_HEADER_FILL : HEADER_FILL;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = THIN_BORDER;
  });
  headerRow.height = 32;

  let rowNum = 5;
  let sNo = 1;

  const categoryTotalCells: string[] = [];
  const weekTotalCells: Record<string, string[]> = {};
  weeks.forEach(w => { weekTotalCells[w.key] = []; });

  // ─── Category rows ─────────────────────────────────────────────────
  for (const cat of register.expenseCategories) {
    if (cat.categoryId === 'EXP002') {
      // Food Expenses
      const hr = ws.getRow(rowNum);
      const sr = ws.getRow(rowNum + 1);
      const foodRate = cat.foodRate || 130;

      hr.getCell(1).value = sNo;
      hr.getCell(2).value = 'Food Expenses For Labours';
      hr.getCell(2).font = BOLD_FONT;

      weeks.forEach((w, wIdx) => {
        const colLetter = String.fromCharCode(67 + wIdx);
        hr.getCell(3 + wIdx).value = { formula: `${colLetter}${rowNum + 1}*${foodRate}`, result: 0 };
      });
      hr.getCell(totalCols).value = { formula: `SUM(C${rowNum}:${lastWeekColChar}${rowNum})`, result: 0 };

      for (let c = 1; c <= totalCols; c++) {
        hr.getCell(c).fill = c === totalCols ? TOTAL_COL_FILL : CATEGORY_FILL;
        hr.getCell(c).border = THIN_BORDER;
        hr.getCell(c).font = BOLD_FONT;
        hr.getCell(c).alignment = { horizontal: c <= 2 ? 'center' : 'right', vertical: 'middle' };
      }

      sr.getCell(2).value = `No Of Present × ${foodRate}`;
      sr.getCell(2).font = NORMAL_FONT;
      const present = cat.weeklyPresent || { week1: 0, week2: 0, week3: 0, week4: 0, week5: 0 };
      weeks.forEach((w, wIdx) => {
        sr.getCell(3 + wIdx).value = (present as any)[w.key] || 0;
      });

      for (let c = 1; c <= totalCols; c++) {
        sr.getCell(c).fill = c === totalCols ? TOTAL_COL_FILL : SUB_ROW_FILL;
        sr.getCell(c).border = THIN_BORDER;
        if (c >= 3 && c < totalCols) sr.getCell(c).font = NORMAL_FONT;
        sr.getCell(c).alignment = { horizontal: c <= 2 ? 'center' : 'right', vertical: 'middle' };
      }

      categoryTotalCells.push(`${lastColChar}${rowNum}`);
      weeks.forEach((w, wIdx) => {
        const colLetter = String.fromCharCode(67 + wIdx);
        weekTotalCells[w.key].push(`${colLetter}${rowNum}`);
      });

      rowNum += 2;
      sNo++;
    } else if (cat.categoryId === 'EXP003' || cat.categoryId === 'EXP004') {
      // Labour Wages or Fuel Expenses
      const isLabour = cat.categoryId === 'EXP003';
      const items = isLabour ? (cat.employees || []) : (cat.subCategories || []);
      const hrIndex = rowNum;
      const hr = ws.getRow(rowNum);

      hr.getCell(1).value = sNo;
      hr.getCell(2).value = isLabour ? 'Labour Wages (900 Rs per day)' : 'Fuel Expenses';
      hr.getCell(2).font = BOLD_FONT;

      for (let c = 1; c <= totalCols; c++) {
        hr.getCell(c).fill = c === totalCols ? TOTAL_COL_FILL : CATEGORY_FILL;
        hr.getCell(c).border = THIN_BORDER;
        hr.getCell(c).font = BOLD_FONT;
        hr.getCell(c).alignment = { horizontal: c <= 2 ? 'center' : 'right', vertical: 'middle' };
      }
      rowNum++;

      const subRowStart = rowNum;
      for (const item of items) {
        const sr = ws.getRow(rowNum);
        sr.getCell(2).value = isLabour ? (item as any).employeeName : (item as any).name;
        sr.getCell(2).font = NORMAL_FONT;
        weeks.forEach((w, wIdx) => {
          sr.getCell(3 + wIdx).value = (item as any)[w.key] || 0;
        });
        sr.getCell(totalCols).value = { formula: `SUM(C${rowNum}:${lastWeekColChar}${rowNum})`, result: 0 };

        for (let c = 1; c <= totalCols; c++) {
          sr.getCell(c).fill = c === totalCols ? TOTAL_COL_FILL : SUB_ROW_FILL;
          sr.getCell(c).border = THIN_BORDER;
          if (c >= 3 && c < totalCols) sr.getCell(c).font = NORMAL_FONT;
          if (c === totalCols) sr.getCell(c).font = BOLD_TOTAL_FONT;
          sr.getCell(c).alignment = { horizontal: c <= 2 ? 'center' : 'right', vertical: 'middle' };
        }
        rowNum++;
      }

      if (items.length > 0) {
        hr.getCell(totalCols).value = { formula: `SUM(${lastColChar}${subRowStart}:${lastColChar}${rowNum - 1})`, result: 0 };
        weeks.forEach((w, wIdx) => {
          const colLetter = String.fromCharCode(67 + wIdx);
          weekTotalCells[w.key].push(`SUM(${colLetter}${subRowStart}:${colLetter}${rowNum - 1})`);
        });
      }

      categoryTotalCells.push(`${lastColChar}${hrIndex}`);
      sNo++;
    } else {
      // Standard Categories
      const hr = ws.getRow(rowNum);
      hr.getCell(1).value = sNo;
      hr.getCell(2).value = cat.categoryId === 'EXP006' ? 'Fastag (Toll Expenses)' : cat.categoryName;
      hr.getCell(2).font = BOLD_FONT;

      const wa = cat.weeklyAmounts || { week1: 0, week2: 0, week3: 0, week4: 0, week5: 0 };
      weeks.forEach((w, wIdx) => {
        hr.getCell(3 + wIdx).value = (wa as any)[w.key] || 0;
      });
      hr.getCell(totalCols).value = { formula: `SUM(C${rowNum}:${lastWeekColChar}${rowNum})`, result: 0 };

      for (let c = 1; c <= totalCols; c++) {
        hr.getCell(c).fill = c === totalCols ? TOTAL_COL_FILL : CATEGORY_FILL;
        hr.getCell(c).border = THIN_BORDER;
        hr.getCell(c).font = BOLD_FONT;
        hr.getCell(c).alignment = { horizontal: c <= 2 ? 'center' : 'right', vertical: 'middle' };
      }

      categoryTotalCells.push(`${lastColChar}${rowNum}`);
      weeks.forEach((w, wIdx) => {
        const colLetter = String.fromCharCode(67 + wIdx);
        weekTotalCells[w.key].push(`${colLetter}${rowNum}`);
      });

      rowNum++;
      sNo++;
    }
  }

  // ─── Total row ─────────────────────────────────────────────────────
  const totalRow = ws.getRow(rowNum);
  ws.mergeCells(`A${rowNum}:B${rowNum}`);
  totalRow.getCell(1).value = 'TOTAL';
  totalRow.getCell(1).font = { ...BOLD_FONT, size: 12 };
  totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  
  weeks.forEach((w, wIdx) => {
    const arr = weekTotalCells[w.key];
    totalRow.getCell(3 + wIdx).value = { formula: arr && arr.length > 0 ? arr.join('+') : '0', result: 0 };
  });
  totalRow.getCell(totalCols).value = { formula: categoryTotalCells.length > 0 ? categoryTotalCells.join('+') : '0', result: 0 };

  for (let c = 1; c <= totalCols; c++) {
    totalRow.getCell(c).fill = FOOTER_FILL;
    totalRow.getCell(c).font = { ...BOLD_FONT, size: 12 };
    totalRow.getCell(c).border = THIN_BORDER;
    totalRow.getCell(c).alignment = { horizontal: c <= 2 ? 'center' : 'right', vertical: 'middle' };
  }
  rowNum++;

  // Grand total sub-row
  const grandRow = ws.getRow(rowNum);
  const secondLastColChar = String.fromCharCode(65 + totalCols - 2);
  ws.mergeCells(`A${rowNum}:${secondLastColChar}${rowNum}`);
  grandRow.getCell(1).value = { formula: `${lastColChar}${rowNum - 1}`, result: 0 };
  grandRow.getCell(1).font = { ...BOLD_FONT, size: 12 };
  grandRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  for (let c = 1; c <= totalCols; c++) {
    grandRow.getCell(c).fill = FOOTER_FILL;
    grandRow.getCell(c).border = THIN_BORDER;
  }

  // ─── Download ──────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Expense_Register_${register.month}_${register.year}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};


