import ExcelJS from 'exceljs';
import { format } from 'date-fns';

export interface ExportProductionWagesParams {
  entries: any[];
  startDate: Date | null;
  endDate: Date | null;
  furnaces: string[];
  rate: number;
  advance: number;
  transferred: number;
  cashPaid: number;
  recovered: number;
  paid: number;
  maintenanceDetails: { date: string; persons: number; costPerDay: number }[];
}

const DARK_BLUE = 'FF002060';
const WHITE = 'FFFFFFFF';
const BLACK = 'FF000000';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: DARK_BLUE },
};

const BOLD_WHITE: Partial<ExcelJS.Font> = { bold: true, color: { argb: WHITE }, size: 11, name: 'Calibri' };
const BOLD_BLACK: Partial<ExcelJS.Font> = { bold: true, color: { argb: BLACK }, size: 11, name: 'Calibri' };
const NORMAL_BLACK: Partial<ExcelJS.Font> = { size: 11, color: { argb: BLACK }, name: 'Calibri' };

const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: BLACK } },
  left: { style: 'thin', color: { argb: BLACK } },
  bottom: { style: 'thin', color: { argb: BLACK } },
  right: { style: 'thin', color: { argb: BLACK } },
};

const getFurnaceTitle = (furnaces: string[]) => {
  if (!furnaces || furnaces.length === 0) return 'NO UNITS SELECTED';
  if (furnaces.includes('ALL')) return 'ALL UNITS WAGES';
  if (furnaces.length === 1) return `${furnaces[0].toUpperCase()} WAGES`;
  
  const upper = furnaces.map(f => f.toUpperCase());
  const last = upper.pop();
  return `${upper.join(', ')} & ${last} WAGES`;
};

const formatDateRange = (startDate: Date | null, endDate: Date | null) => {
  if (!startDate || !endDate) return 'PERIOD';
  return `PERIOD ${format(startDate, 'dd-MM-yyyy')} To ${format(endDate, 'dd-MM-yyyy')}`;
};

export const exportProductionWagesToExcel = async (params: ExportProductionWagesParams) => {
  const {
    entries, startDate, endDate, furnaces, rate,
    advance, transferred, cashPaid, recovered, paid, maintenanceDetails
  } = params;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Production Wages');

  // Columns
  ws.getColumn(1).width = 15; // DATE
  ws.getColumn(2).width = 20; // ALLOY
  ws.getColumn(3).width = 15; // QTY IN KG
  ws.getColumn(4).width = 15; // HEAT NO
  ws.getColumn(5).width = 15; // AMOUNT

  // Title Row
  ws.mergeCells('A1:E1');
  const titleCell = ws.getCell('A1');
  titleCell.value = getFurnaceTitle(furnaces);
  titleCell.fill = HEADER_FILL;
  titleCell.font = BOLD_WHITE;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.border = BORDER;

  // Subtitle Row
  ws.mergeCells('A2:E2');
  const subtitleCell = ws.getCell('A2');
  subtitleCell.value = formatDateRange(startDate, endDate);
  subtitleCell.fill = HEADER_FILL;
  subtitleCell.font = BOLD_WHITE;
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  subtitleCell.border = BORDER;

  // Headers
  const headerRow = ws.getRow(3);
  const headers = ['DATE', 'ALLOY', 'QTY IN KG', 'HEAT NO', 'AMOUNT'];
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.fill = HEADER_FILL;
    cell.font = BOLD_WHITE;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER;
  });

  let rowNum = 4;

  // Data Rows
  if (entries.length > 0) {
    for (const row of entries) {
      const r = ws.getRow(rowNum);
      r.getCell(1).value = row.date || '';
      r.getCell(2).value = row.alloy || '';
      r.getCell(3).value = row.qtyInKg || 0;
      r.getCell(4).value = row.heatNo || '';
      r.getCell(5).value = { formula: `C${rowNum}*${rate}`, result: (row.qtyInKg || 0) * rate };
      
      for (let c = 1; c <= 5; c++) {
        r.getCell(c).border = BORDER;
        r.getCell(c).font = NORMAL_BLACK;
        r.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
      }
      rowNum++;
    }
  } else {
    // Empty rows placeholder
    for (let i = 0; i < 4; i++) {
      const r = ws.getRow(rowNum);
      r.getCell(5).value = 0;
      for (let c = 1; c <= 5; c++) {
        r.getCell(c).border = BORDER;
      }
      rowNum++;
    }
  }

  const lastDataRow = rowNum - 1;

  // Total Row 1
  const tr1 = ws.getRow(rowNum);
  tr1.getCell(2).value = 'TOTAL';
  tr1.getCell(2).font = BOLD_BLACK;
  tr1.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
  tr1.getCell(5).value = { formula: entries.length > 0 ? `SUM(E4:E${lastDataRow})` : '0', result: 0 };
  for (let c = 1; c <= 5; c++) tr1.getCell(c).border = BORDER;
  rowNum++;

  // Extra Amount Row
  const tr2 = ws.getRow(rowNum);
  tr2.getCell(5).value = rate;
  for (let c = 1; c <= 5; c++) {
    tr2.getCell(c).border = BORDER;
    tr2.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
  }
  rowNum++;

  // Dark Blue Total Row
  const tr3 = ws.getRow(rowNum);
  tr3.getCell(4).value = 'TOTAL';
  tr3.getCell(4).fill = HEADER_FILL;
  tr3.getCell(4).font = BOLD_WHITE;
  tr3.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
  
  tr3.getCell(5).value = { formula: `E${rowNum - 2}`, result: 0 };
  tr3.getCell(5).fill = HEADER_FILL;
  tr3.getCell(5).font = BOLD_WHITE;
  tr3.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
  for (let c = 1; c <= 5; c++) tr3.getCell(c).border = BORDER;
  
  const mainTotalCell = `E${rowNum}`;
  rowNum++;

  const calculatedMaintenance = maintenanceDetails.reduce((acc, row) => acc + (row.persons * row.costPerDay), 0);

  // Footer Rows
  const setFooterRow = (rNum: number, leftLabel: string, leftVal: any, rightLabel: string, rightVal: any, ) => {
    const r = ws.getRow(rNum);
    r.getCell(1).value = leftLabel;
    r.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    
    r.getCell(2).value = leftVal;
    r.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    
    if (rightLabel) {
      r.getCell(4).value = rightLabel;
      r.getCell(4).alignment = leftLabel === 'TOTAL' || leftLabel === 'RECOVERED' ? { horizontal: 'left', vertical: 'middle' } : { horizontal: 'left', vertical: 'middle' };
    }
    
    if (rightVal !== undefined) {
      r.getCell(5).value = rightVal;
      r.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    }

    for (let c = 1; c <= 5; c++) {
      r.getCell(c).border = BORDER;
      r.getCell(c).font = NORMAL_BLACK;
    }
  };

  // ADVANCE | advance | | MAINTANANCE | maintenance
  setFooterRow(rowNum, 'ADVANCE', advance, 'MAINTANANCE', calculatedMaintenance);
  const advanceCell = `B${rowNum}`;
  const maintenanceCell = `E${rowNum}`;
  rowNum++;

  // TRANSFERRED | transferred
  setFooterRow(rowNum, 'TRANSFERRED', transferred, '', undefined);
  const transferredCell = `B${rowNum}`;
  rowNum++;

  // CASH PAID | cashPaid | | GROSS PAYABLE | formula
  setFooterRow(rowNum, 'CASH PAID', cashPaid, 'GROSS PAYABLE', { formula: `${mainTotalCell}+${maintenanceCell}`, result: 0 });
  const cashPaidCell = `B${rowNum}`;
  const grossPayableCell = `E${rowNum}`;
  rowNum++;

  // We need the cell reference for RECOVERED before we write the TOTAL row.
  const leftRecoveredCell = `B${rowNum + 1}`;

  // TOTAL | formula | | Advance Paid | formula (points to RECOVERED)
  setFooterRow(rowNum, 'TOTAL', { formula: `${advanceCell}+${transferredCell}+${cashPaidCell}`, result: 0 }, 'Advance Paid', { formula: leftRecoveredCell, result: recovered });
  const leftTotalCell = `B${rowNum}`;
  const rightRecoveredCell = `E${rowNum}`;
  rowNum++;

  // RECOVERED | recovered | | PAID | paid
  setFooterRow(rowNum, 'RECOVERED', recovered, 'PAID', paid);
  ws.getRow(rowNum).getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(rowNum).getCell(4).font = BOLD_BLACK;
  const paidCell = `E${rowNum}`;
  rowNum++;

  // BALANCE | formula | | NET PAYABLE | formula
  const rBal = ws.getRow(rowNum);
  rBal.getCell(1).value = 'BALANCE';
  rBal.getCell(1).fill = HEADER_FILL;
  rBal.getCell(1).font = BOLD_WHITE;
  
  rBal.getCell(2).value = { formula: `${leftTotalCell}-${leftRecoveredCell}`, result: 0 };
  rBal.getCell(2).fill = HEADER_FILL;
  rBal.getCell(2).font = BOLD_WHITE;

  rBal.getCell(4).value = 'NET PAYABLE';
  rBal.getCell(4).fill = HEADER_FILL;
  rBal.getCell(4).font = BOLD_WHITE;
  rBal.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };

  rBal.getCell(5).value = { formula: `${grossPayableCell}-${rightRecoveredCell}-${paidCell}`, result: 0 };
  rBal.getCell(5).fill = HEADER_FILL;
  rBal.getCell(5).font = BOLD_WHITE;
  rBal.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };

  for (let c = 1; c <= 5; c++) rBal.getCell(c).border = BORDER;
  rowNum++;

  // ─── Download ──────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeDate = format(startDate || new Date(), 'MMM_yyyy');
  a.download = `Production_Wages_${safeDate}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
