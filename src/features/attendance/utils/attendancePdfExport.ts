import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, getDaysInMonth, isSunday, isToday } from 'date-fns';
import type { Employee } from '../../employeeMaster/types/employee';
import type { AttendanceRecord } from '../types/attendance';
import type { ExportAttendanceParams } from './attendanceExport';

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

export const exportAttendanceToPdf = async (params: ExportAttendanceParams) => {
  const { employees, attendanceRecords, currentMonth, tabName } = params;

  const doc = new jsPDF('l', 'pt', 'a3');
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
  const title = `Attendance Register: ${tabName} - ${format(currentMonth, 'MMMM yyyy')}`;
  doc.text(title, pageWidth / 2, currentY, { align: "center" });
  currentY += 20;

  const daysInMonth = getDaysInMonth(currentMonth);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  let sundaysCount = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (isSunday(d)) sundaysCount++;
  }
  const totalWorkingDays = daysInMonth - sundaysCount;

  const headRow: any[] = ['S.No', 'Employee Name', ...daysArray, 'W/P'];
  const tableData: any[][] = [];

  for (let index = 0; index < employees.length; index++) {
    const emp = employees[index];
    const rowData: any[] = [];
    
    rowData.push(index + 1);
    rowData.push(`${emp.fullName} (${emp.employeeCode})`);

    let presentCount = 0;

    for (let dayIndex = 0; dayIndex < daysInMonth; dayIndex++) {
      const day = daysArray[dayIndex];
      const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = format(d, 'yyyy-MM-dd');
      const record = attendanceRecords.find(r => r.employeeId === emp.employeeId && r.date === dateStr);
      
      const isSun = isSunday(d);
      const isTod = isToday(d);

      let bgColor: number[] | false = false;
      let textColor = [0, 0, 0];
      let text = '-';

      if (record?.status === 'Present') {
        presentCount++;
        bgColor = [232, 245, 233]; 
        textColor = [46, 125, 50]; 
        text = 'P';
      } else if (record?.status === 'N') {
        presentCount++;
        bgColor = [237, 231, 246]; 
        textColor = [69, 39, 160]; 
        text = 'N';
      } else if (record?.status === 'Absent') {
        bgColor = [255, 235, 238]; 
        textColor = [198, 40, 40]; 
        text = 'A';
      } else if (record?.status === 'P/N') {
        presentCount += 2;
        bgColor = [227, 242, 253]; 
        textColor = [21, 101, 192]; 
        text = 'P/N';
      } else if (isTod) {
        bgColor = [224, 247, 250]; 
      } else if (isSun) {
        bgColor = [255, 243, 224]; 
      }

      rowData.push({
        content: text,
        styles: {
          fillColor: bgColor || [255, 255, 255],
          textColor: textColor,
          fontStyle: record ? 'bold' : 'normal',
          halign: 'center'
        }
      });
    }

    rowData.push({
      content: `${totalWorkingDays}/${presentCount}`,
      styles: { fontStyle: 'bold', halign: 'center' }
    });

    tableData.push(rowData);
  }

  if (employees.length === 0) {
    tableData.push([{ content: 'No employees found matching the criteria.', colSpan: 3 + daysInMonth, styles: { halign: 'center' } }]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [headRow],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [26, 42, 94], textColor: 255, halign: 'center', fontSize: 9, cellPadding: 3 },
    styles: { fontSize: 8, cellPadding: 3, textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 120 },
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index > 1 && data.column.index < 2 + daysInMonth) {
         data.cell.styles.cellWidth = 25;
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(8);
  doc.text("Exported on: " + new Date().toLocaleString(), 20, finalY);

  const safeDate = format(currentMonth, 'MMM_yyyy');
  doc.save(`Attendance_${tabName.replace(/\s+/g, '_')}_${safeDate}.pdf`);
};
