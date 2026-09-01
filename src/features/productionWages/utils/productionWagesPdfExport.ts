import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { ExportProductionWagesParams } from './productionWagesExport';

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

export const exportProductionWagesToPdf = async (params: ExportProductionWagesParams) => {
  const {
    entries, startDate, endDate, furnaces, rate,
    advance, transferred, cashPaid, recovered, paid, maintenanceDetails
  } = params;

  const doc = new jsPDF('p', 'pt', 'a4');
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

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Production Wages Report", pageWidth / 2, currentY, { align: "center" });
  currentY += 30;

  // Detailed Description
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Details:", marginX, currentY);
  currentY += 15;
  doc.setFont("helvetica", "normal");
  doc.text(`Furnaces Included: ${getFurnaceTitle(furnaces)}`, marginX, currentY);
  currentY += 15;
  doc.text(`Date Range: ${formatDateRange(startDate, endDate)}`, marginX, currentY);
  currentY += 15;
  doc.text(`Rate of Wages: Rs. ${rate} per Kg`, marginX, currentY);
  currentY += 25;

  const tableData: any[][] = [];
  let sumAmount = 0;

  if (entries.length > 0) {
    for (const row of entries) {
      const amount = (row.qtyInKg || 0) * rate;
      sumAmount += amount;
      tableData.push([
        row.date || '',
        row.alloy || '',
        (row.qtyInKg || 0).toString(),
        row.heatNo || '',
        amount.toFixed(2)
      ]);
    }
  } else {
    tableData.push(['', '', '', '', '0.00']);
    tableData.push(['', '', '', '', '0.00']);
    tableData.push(['', '', '', '', '0.00']);
    tableData.push(['', '', '', '', '0.00']);
  }

  tableData.push(['', 'TOTAL', '', '', sumAmount.toFixed(2)]);
  tableData.push(['', '', '', '', rate.toFixed(2)]);
  tableData.push(['', '', '', 'TOTAL', sumAmount.toFixed(2)]);

  const calculatedMaintenance = maintenanceDetails.reduce((acc, row) => acc + (row.persons * row.costPerDay), 0);
  const grossPayable = sumAmount + calculatedMaintenance;
  const leftTotal = advance + transferred + cashPaid;
  const balance = leftTotal - recovered;
  const netPayable = grossPayable - recovered - paid;

  tableData.push(['ADVANCE', advance.toFixed(2), '', 'MAINTANANCE', calculatedMaintenance.toFixed(2)]);
  tableData.push(['TRANSFERRED', transferred.toFixed(2), '', '', '']);
  tableData.push(['CASH PAID', cashPaid.toFixed(2), '', 'GROSS PAYABLE', grossPayable.toFixed(2)]);
  tableData.push(['TOTAL', leftTotal.toFixed(2), '', 'Advance Paid', recovered.toFixed(2)]);
  tableData.push(['RECOVERED', recovered.toFixed(2), '', 'PAID', paid.toFixed(2)]);
  tableData.push(['BALANCE', balance.toFixed(2), '', 'NET PAYABLE', netPayable.toFixed(2)]);

  const DARK_BLUE = [0, 32, 96]; // #002060
  
  autoTable(doc, {
    startY: currentY,
    head: [['DATE', 'ALLOY', 'QTY IN KG', 'HEAT NO', 'AMOUNT']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: DARK_BLUE, textColor: 255, halign: 'center' },
    styles: { fontSize: 10, cellPadding: 4, textColor: 0, lineColor: 0, lineWidth: 0.1 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 70 },
      1: { halign: 'center', cellWidth: 100 },
      2: { halign: 'center', cellWidth: 100 },
      3: { halign: 'center', cellWidth: 100 },
      4: { halign: 'center', cellWidth: 100 }
    },
    margin: { left: (pageWidth - 470) / 2 },
    didParseCell: function (data) {
      const rowIndex = data.row.index;
      const dataLen = entries.length > 0 ? entries.length : 4;
      
      if (rowIndex < dataLen) {
        // standard data rows
      } else {
        const offset = rowIndex - dataLen;
        // Total Row 1
        if (offset === 0) {
          if (data.column.index === 1) data.cell.styles.fontStyle = 'bold';
        }
        // Extra Rate Row
        if (offset === 1) {
          // just rate
        }
        // Dark Blue Total Row
        if (offset === 2) {
          if (data.column.index === 3 || data.column.index === 4) {
            data.cell.styles.fillColor = DARK_BLUE;
            data.cell.styles.textColor = 255;
            data.cell.styles.fontStyle = 'bold';
          }
        }
        // Footer rows
        if (offset > 2) {
          if (data.column.index === 0 || data.column.index === 3) {
            data.cell.styles.halign = 'left';
          }
          if (offset === 8) { // BALANCE / NET PAYABLE row
             if (data.column.index !== 2) {
                 data.cell.styles.fillColor = DARK_BLUE;
                 data.cell.styles.textColor = 255;
                 data.cell.styles.fontStyle = 'bold';
             }
             if (data.column.index === 0 || data.column.index === 3) {
                data.cell.styles.halign = 'left';
             }
          }
        }
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 30;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Exported on: " + new Date().toLocaleString(), marginX, finalY);

  const safeDate = format(startDate || new Date(), 'MMM_yyyy');
  doc.save(`Production_Wages_${safeDate}.pdf`);
};
