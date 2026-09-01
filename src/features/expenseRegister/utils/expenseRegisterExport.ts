import ExcelJS from 'exceljs';
import type { ExpenseRegisterDoc } from '../types/expenseRegister.types';

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

  // Column widths
  ws.getColumn(1).width = 8;   // S.No
  ws.getColumn(2).width = 40;  // Particulars
  ws.getColumn(3).width = 15;  // 1st Week
  ws.getColumn(4).width = 15;  // 2nd Week
  ws.getColumn(5).width = 15;  // 3rd Week
  ws.getColumn(6).width = 15;  // 4th Week
  ws.getColumn(7).width = 20;  // Total For The Month

  // ─── Title rows ─────────────────────────────────────────────────────
  // Row 1: Company name
  ws.mergeCells('A1:G1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'Sri Jothi Moulding Works';
  titleCell.font = { ...WHITE_FONT, size: 16 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = HEADER_FILL;
  ws.getRow(1).height = 30;

  // Row 2: FY subtitle
  ws.mergeCells('A2:G2');
  const fyCell = ws.getCell('A2');
  fyCell.value = `Weekly Expenses For ${register.year}`;
  fyCell.font = { ...WHITE_FONT, size: 13 };
  fyCell.alignment = { horizontal: 'center', vertical: 'middle' };
  fyCell.fill = HEADER_FILL;
  ws.getRow(2).height = 24;

  // Row 3: Month
  ws.mergeCells('A3:G3');
  const monthCell = ws.getCell('A3');
  monthCell.value = register.month;
  monthCell.font = { ...WHITE_FONT, size: 12 };
  monthCell.alignment = { horizontal: 'center', vertical: 'middle' };
  monthCell.fill = HEADER_FILL;
  ws.getRow(3).height = 22;

  // Row 4: Column headers
  const headerRow = ws.getRow(4);
  const headers = ['S NO', 'Particulars', '1st Week', '2nd Week', '3rd Week', '4th Week', 'Total For Month'];
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = WHITE_FONT;
    cell.fill = i + 1 === 7 ? TOTAL_HEADER_FILL : HEADER_FILL;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = THIN_BORDER;
  });
  headerRow.height = 28;

  let rowNum = 5;
  let sNo = 1;

  const categoryTotalCells: string[] = [];
  const weekTotalCells: { w1: string[], w2: string[], w3: string[], w4: string[] } = { w1: [], w2: [], w3: [], w4: [] };

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
      hr.getCell(3).value = { formula: `C${rowNum + 1}*${foodRate}`, result: 0 };
      hr.getCell(4).value = { formula: `D${rowNum + 1}*${foodRate}`, result: 0 };
      hr.getCell(5).value = { formula: `E${rowNum + 1}*${foodRate}`, result: 0 };
      hr.getCell(6).value = { formula: `F${rowNum + 1}*${foodRate}`, result: 0 };
      hr.getCell(7).value = { formula: `SUM(C${rowNum}:F${rowNum})`, result: 0 };

      for (let c = 1; c <= 7; c++) {
        hr.getCell(c).fill = c === 7 ? TOTAL_COL_FILL : CATEGORY_FILL;
        hr.getCell(c).border = THIN_BORDER;
        hr.getCell(c).font = BOLD_FONT;
        hr.getCell(c).alignment = { horizontal: c <= 2 ? 'center' : 'right', vertical: 'middle' };
      }

      sr.getCell(2).value = `No Of Present × ${foodRate}`;
      sr.getCell(2).font = NORMAL_FONT;
      const present = cat.weeklyPresent || { week1: 0, week2: 0, week3: 0, week4: 0 };
      sr.getCell(3).value = present.week1 || 0;
      sr.getCell(4).value = present.week2 || 0;
      sr.getCell(5).value = present.week3 || 0;
      sr.getCell(6).value = present.week4 || 0;

      for (let c = 1; c <= 7; c++) {
        sr.getCell(c).fill = c === 7 ? TOTAL_COL_FILL : SUB_ROW_FILL;
        sr.getCell(c).border = THIN_BORDER;
        if (c >= 3 && c <= 6) sr.getCell(c).font = NORMAL_FONT;
        sr.getCell(c).alignment = { horizontal: c <= 2 ? 'center' : 'right', vertical: 'middle' };
      }

      categoryTotalCells.push(`G${rowNum}`);
      weekTotalCells.w1.push(`C${rowNum}`);
      weekTotalCells.w2.push(`D${rowNum}`);
      weekTotalCells.w3.push(`E${rowNum}`);
      weekTotalCells.w4.push(`F${rowNum}`);

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

      for (let c = 1; c <= 7; c++) {
        hr.getCell(c).fill = c === 7 ? TOTAL_COL_FILL : CATEGORY_FILL;
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
        sr.getCell(3).value = item.week1 || 0;
        sr.getCell(4).value = item.week2 || 0;
        sr.getCell(5).value = item.week3 || 0;
        sr.getCell(6).value = item.week4 || 0;
        sr.getCell(7).value = { formula: `SUM(C${rowNum}:F${rowNum})`, result: 0 };

        for (let c = 1; c <= 7; c++) {
          sr.getCell(c).fill = c === 7 ? TOTAL_COL_FILL : SUB_ROW_FILL;
          sr.getCell(c).border = THIN_BORDER;
          if (c >= 3 && c <= 6) sr.getCell(c).font = NORMAL_FONT;
          if (c === 7) sr.getCell(c).font = BOLD_TOTAL_FONT;
          sr.getCell(c).alignment = { horizontal: c <= 2 ? 'center' : 'right', vertical: 'middle' };
        }
        rowNum++;
      }

      if (items.length > 0) {
        hr.getCell(7).value = { formula: `SUM(G${subRowStart}:G${rowNum - 1})`, result: 0 };
        weekTotalCells.w1.push(`SUM(C${subRowStart}:C${rowNum - 1})`);
        weekTotalCells.w2.push(`SUM(D${subRowStart}:D${rowNum - 1})`);
        weekTotalCells.w3.push(`SUM(E${subRowStart}:E${rowNum - 1})`);
        weekTotalCells.w4.push(`SUM(F${subRowStart}:F${rowNum - 1})`);
      }

      categoryTotalCells.push(`G${hrIndex}`);
      sNo++;
    } else {
      // Standard Categories
      const hr = ws.getRow(rowNum);
      hr.getCell(1).value = sNo;
      hr.getCell(2).value = cat.categoryId === 'EXP006' ? 'Fastag (Toll Expenses)' : cat.categoryName;
      hr.getCell(2).font = BOLD_FONT;

      const wa = cat.weeklyAmounts || { week1: 0, week2: 0, week3: 0, week4: 0 };
      hr.getCell(3).value = wa.week1 || 0;
      hr.getCell(4).value = wa.week2 || 0;
      hr.getCell(5).value = wa.week3 || 0;
      hr.getCell(6).value = wa.week4 || 0;
      hr.getCell(7).value = { formula: `SUM(C${rowNum}:F${rowNum})`, result: 0 };

      for (let c = 1; c <= 7; c++) {
        hr.getCell(c).fill = c === 7 ? TOTAL_COL_FILL : CATEGORY_FILL;
        hr.getCell(c).border = THIN_BORDER;
        hr.getCell(c).font = BOLD_FONT;
        hr.getCell(c).alignment = { horizontal: c <= 2 ? 'center' : 'right', vertical: 'middle' };
      }

      categoryTotalCells.push(`G${rowNum}`);
      weekTotalCells.w1.push(`C${rowNum}`);
      weekTotalCells.w2.push(`D${rowNum}`);
      weekTotalCells.w3.push(`E${rowNum}`);
      weekTotalCells.w4.push(`F${rowNum}`);

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
  
  totalRow.getCell(3).value = { formula: weekTotalCells.w1.length > 0 ? weekTotalCells.w1.join('+') : '0', result: 0 };
  totalRow.getCell(4).value = { formula: weekTotalCells.w2.length > 0 ? weekTotalCells.w2.join('+') : '0', result: 0 };
  totalRow.getCell(5).value = { formula: weekTotalCells.w3.length > 0 ? weekTotalCells.w3.join('+') : '0', result: 0 };
  totalRow.getCell(6).value = { formula: weekTotalCells.w4.length > 0 ? weekTotalCells.w4.join('+') : '0', result: 0 };
  totalRow.getCell(7).value = { formula: categoryTotalCells.length > 0 ? categoryTotalCells.join('+') : '0', result: 0 };

  for (let c = 1; c <= 7; c++) {
    totalRow.getCell(c).fill = FOOTER_FILL;
    totalRow.getCell(c).font = { ...BOLD_FONT, size: 12 };
    totalRow.getCell(c).border = THIN_BORDER;
    totalRow.getCell(c).alignment = { horizontal: c <= 2 ? 'center' : 'right', vertical: 'middle' };
  }
  rowNum++;

  // Grand total sub-row
  const grandRow = ws.getRow(rowNum);
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  grandRow.getCell(1).value = { formula: `G${rowNum - 1}`, result: 0 };
  grandRow.getCell(1).font = { ...BOLD_FONT, size: 12 };
  grandRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  for (let c = 1; c <= 7; c++) {
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

