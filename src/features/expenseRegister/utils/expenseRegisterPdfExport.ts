import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ExpenseRegisterDoc } from '../types/expenseRegister.types';
import { fmtAmount, getWeeksForMonth } from '../types/expenseRegister.types';

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

export const exportExpenseRegisterToPdf = async (register: ExpenseRegisterDoc): Promise<void> => {
  const doc = new jsPDF('l', 'pt', 'a4'); // Landscape to fit the columns well
  const marginX = 40;
  let currentY = 40;
  const pageWidth = doc.internal.pageSize.getWidth();

  try {
    const logoBase64 = await getBase64ImageFromUrl('/logo.png');
    doc.addImage(logoBase64, 'PNG', marginX, currentY, 60, 60);
  } catch (error) {
    console.error('Failed to load logo for PDF', error);
  }

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Sri Jothi Moulding Works", marginX + 80, currentY + 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("AC 31/9, TINY PLOT, THIRUMUDIVAKKAM SIDCO Industrial Estate,", marginX + 80, currentY + 40);
  doc.text("Chennai, Tamil Nadu 600132, India", marginX + 80, currentY + 52);
  
  currentY += 80;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const yearText = register.year ? ` ${register.year}` : '';
  doc.text(`Weekly Expenses For ${register.month}${yearText}`, pageWidth / 2, currentY, { align: "center" });
  currentY += 25;

  const weeks = getWeeksForMonth(register.year, register.month);

  const tableData: any[][] = [];
  let sNo = 1;

  const weeklyTotals: Record<string, number> = {};
  weeks.forEach(w => { weeklyTotals[w.key] = 0; });
  let tMonth = 0;

  for (const cat of register.expenseCategories) {
    const wa = cat.weeklyAmounts || { week1: 0, week2: 0, week3: 0, week4: 0, week5: 0, week6: 0 };
    weeks.forEach(w => {
      weeklyTotals[w.key] = (weeklyTotals[w.key] || 0) + ((wa as any)[w.key] || 0);
    });
    tMonth += cat.monthlyTotal || 0;

    if (cat.categoryId === 'EXP002') {
      const foodRate = cat.foodRate || 130;
      tableData.push([
        sNo.toString(),
        'Food Expenses For Labours',
        ...weeks.map(w => fmtAmount((wa as any)[w.key] || 0)),
        fmtAmount(cat.monthlyTotal || 0)
      ]);
      const present = cat.weeklyPresent || { week1: 0, week2: 0, week3: 0, week4: 0, week5: 0, week6: 0 };
      tableData.push([
        '',
        `No Of Present × ${foodRate}`,
        ...weeks.map(w => (present as any)[w.key]?.toString() || '0'),
        ''
      ]);
      sNo++;
    } else if (cat.categoryId === 'EXP003' || cat.categoryId === 'EXP004') {
      const isLabour = cat.categoryId === 'EXP003';
      const items = isLabour ? (cat.employees || []) : (cat.subCategories || []);
      
      tableData.push([
        sNo.toString(),
        isLabour ? 'Labour Wages (900 Rs per day)' : 'Fuel Expenses',
        ...weeks.map(w => fmtAmount((wa as any)[w.key] || 0)),
        fmtAmount(cat.monthlyTotal || 0)
      ]);

      for (const item of items) {
        tableData.push([
          '',
          isLabour ? (item as any).employeeName : (item as any).name,
          ...weeks.map(w => fmtAmount((item as any)[w.key] || 0)),
          fmtAmount(item.monthlyTotal || 0)
        ]);
      }
      sNo++;
    } else {
      tableData.push([
        sNo.toString(),
        cat.categoryId === 'EXP006' ? 'Fastag (Toll Expenses)' : cat.categoryName,
        ...weeks.map(w => fmtAmount((wa as any)[w.key] || 0)),
        fmtAmount(cat.monthlyTotal || 0)
      ]);
      sNo++;
    }
  }

  tableData.push([
    'TOTAL',
    '',
    ...weeks.map(w => fmtAmount(weeklyTotals[w.key] || 0)),
    fmtAmount(tMonth)
  ]);

  const totalColIdx = 2 + weeks.length;
  const colStyles: any = {
    0: { halign: 'center', cellWidth: 35 },
    1: { halign: 'left', cellWidth: 'auto' },
  };
  weeks.forEach((_, idx) => {
    colStyles[2 + idx] = { halign: 'right', cellWidth: weeks.length >= 6 ? 56 : weeks.length === 5 ? 68 : 80 };
  });
  colStyles[totalColIdx] = { halign: 'right', cellWidth: 90, fontStyle: 'bold' };

  autoTable(doc, {
    startY: currentY,
    head: [['S.No', 'Particulars', ...weeks.map(w => `${w.label}\n(${w.dateRange})`), 'Total For Month']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [26, 42, 94], textColor: 255, halign: 'center', cellPadding: 6 },
    styles: { fontSize: 9, cellPadding: 5, textColor: [30, 41, 59] },
    columnStyles: colStyles,
    didParseCell: function(data) {
      data.cell.styles.lineColor = [197, 205, 216]; // #c5cdd8 (GRID_BORDER)
      data.cell.styles.lineWidth = 1;

      if (data.section === 'head') {
        if (data.column.index === totalColIdx) {
          data.cell.styles.fillColor = [124, 58, 20]; // #7c3a14 (TOTAL_HEADER_BG)
        } else {
          data.cell.styles.fillColor = [26, 42, 94]; // #1a2a5e (HEADER_BG)
        }
      }

      if (data.section === 'body') {
        if ((data.row.raw as any[])[0] === 'TOTAL') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [214, 228, 240]; // #d6e4f0 (FOOTER_BG)
          if (data.column.index === 0) {
            data.cell.colSpan = 2;
            data.cell.styles.halign = 'center';
          }
        } else if ((data.row.raw as any[])[0] === '' && (data.row.raw as any[])[1] !== '') {
          data.cell.styles.textColor = [100, 116, 139]; 
          data.cell.styles.fillColor = [255, 255, 255]; // #ffffff (SUB_ROW_BG)
        } else if ((data.row.raw as any[])[0] !== 'TOTAL' && (data.row.raw as any[])[0] !== '') {
          data.cell.styles.fillColor = [248, 250, 252]; // #f8fafc (CATEGORY_BG)
          if (data.column.index === 1) {
            data.cell.styles.fontStyle = 'bold';
          }
        }
        
        if (data.column.index === totalColIdx && (data.row.raw as any[])[0] !== 'TOTAL') {
           data.cell.styles.fillColor = [245, 196, 161]; // #f5c4a1 (TOTAL_COL_BG)
        }
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 30;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Exported on: " + new Date().toLocaleString(), marginX, finalY);

  const yearSuffix = register.year ? `_${register.year}` : '';
  doc.save(`Expense_Register_${register.month}${yearSuffix}.pdf`);
};

