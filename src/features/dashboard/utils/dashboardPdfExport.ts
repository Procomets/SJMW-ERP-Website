import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import type { DashboardFilters } from '../types/dashboard.types';

const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
  try {
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
  } catch (err) {
    console.error("Failed to load logo for PDF", err);
    return "";
  }
};

const getDatePresetLabel = (preset: string, start?: string, end?: string): string => {
  const map: Record<string, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    last7: 'Last 7 Days',
    last30: 'Last 30 Days',
    currentMonth: 'This Month',
    previousMonth: 'Previous Month',
    currentQuarter: 'This Quarter',
    currentYear: 'This Year',
    custom: `Custom (${start || 'Start'} to ${end || 'End'})`,
  };
  return map[preset] || preset || 'All Time';
};

interface ExportOptions {
  filters: DashboardFilters;
  activeTabLabel: string;
  containerId: string;
  lastRefreshed: Date | null;
}

export const exportDashboardPdf = async ({
  filters,
  activeTabLabel,
  containerId,
  lastRefreshed,
}: ExportOptions): Promise<void> => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth(); // ~595.28 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // ~841.89 pt
  const marginX = 36;
  const contentWidth = pageWidth - (marginX * 2);
  let currentY = 36;

  // 1. Reveal Container temporarily at left: 0 so Recharts & html2canvas measure & capture
  const container = document.getElementById(containerId);
  if (!container) {
    alert("Dashboard report content container not found.");
    return;
  }

  // Backup original inline style
  const origStyle = container.getAttribute('style') || '';
  
  // Make container visible at left: 0 behind backdrop overlay
  container.setAttribute('style', `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 1000px !important;
    height: auto !important;
    background-color: #ffffff !important;
    z-index: 99990 !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: none !important;
    overflow: visible !important;
  `);

  // Dispatch window resize event to trigger Recharts ResponsiveContainer re-measurement
  window.dispatchEvent(new Event('resize'));

  // Allow DOM & Recharts 700ms to calculate width/height and draw SVG paths
  await new Promise((resolve) => setTimeout(resolve, 700));

  const totalContainerHeight = container.scrollHeight + 2000;

  const renderRunningHeader = () => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Sri Jothi Moulding Works — Executive Dashboard Report", marginX, 24);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${nowStr}`, pageWidth - marginX, 24, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, 28, pageWidth - marginX, 28);
  };

  const nowStr = format(new Date(), 'dd MMM yyyy, hh:mm:ss a');

  try {
    // 2. Company Logo
    try {
      const logoBase64 = await getBase64ImageFromUrl('/logo.png');
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', marginX, currentY, 50, 50);
      }
    } catch (err) {
      console.error('Logo loading failed', err);
    }

    // 3. Company Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("Sri Jothi Moulding Works", marginX + 62, currentY + 18);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("AC 31/9, TINY PLOT, THIRUMUDIVAKKAM SIDCO Industrial Estate,", marginX + 62, currentY + 32);
    doc.text("Chennai, Tamil Nadu 600132, India", marginX + 62, currentY + 44);

    currentY += 65;

    // Header Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 16;

    // 4. Document Title & Timestamp
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Comprehensive Executive Dashboard Report", marginX, currentY);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${nowStr}`, pageWidth - marginX, currentY, { align: 'right' });
    currentY += 18;

    // Description Paragraph
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const descText = "This comprehensive multi-page executive report consolidates all foundry operational analytics: Production Trends, Inventory Stocks & Consumption, Financial Cost Analysis, Customer Dispatch Logs, and Quality Efficiency Metrics.";
    const splitDesc = doc.splitTextToSize(descText, contentWidth);
    doc.text(splitDesc, marginX, currentY);
    currentY += (splitDesc.length * 11) + 8;

    // 5. Active Filters Summary Box
    const filterBoxY = currentY;
    const datePresetStr = getDatePresetLabel(filters.datePreset, filters.customStart, filters.customEnd);
    const alloyStr = filters.alloyType || 'All Alloys';
    const furnaceStr = filters.furnaceNo || 'All Furnaces';
    const shiftStr = filters.shift ? (filters.shift.charAt(0).toUpperCase() + filters.shift.slice(1)) : 'All Shifts';
    const supervisorStr = filters.supervisor || 'All Supervisors';
    const customerStr = filters.customer || 'All Customers';
    const qcStatusStr = filters.qualityStatus || 'All Statuses';

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.75);
    doc.roundedRect(marginX, filterBoxY, contentWidth, 44, 4, 4, 'FD');

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("APPLIED DASHBOARD FILTERS:", marginX + 10, filterBoxY + 14);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);

    const col1 = `• Period: ${datePresetStr}   |   • Alloy: ${alloyStr}   |   • Furnace: ${furnaceStr}`;
    const col2 = `• Shift: ${shiftStr}   |   • Supervisor: ${supervisorStr}   |   • Customer: ${customerStr}   |   • Quality: ${qcStatusStr}`;
    
    doc.text(col1, marginX + 10, filterBoxY + 27);
    doc.text(col2, marginX + 10, filterBoxY + 37);

    currentY = filterBoxY + 54;

    // 6. Iterate through section pages and capture child blocks with virtual window height
    const sectionElements = container.querySelectorAll<HTMLElement>('.pdf-section-page');
    const sectionsToCapture: HTMLElement[] = sectionElements.length > 0 
      ? Array.from(sectionElements)
      : [container];

    for (let sIdx = 0; sIdx < sectionsToCapture.length; sIdx++) {
      const secEl = sectionsToCapture[sIdx];
      const childBlocks = secEl.children;

      if (childBlocks && childBlocks.length > 0) {
        for (let cIdx = 0; cIdx < childBlocks.length; cIdx++) {
          const block = childBlocks[cIdx] as HTMLElement;
          if (!block) continue;

          try {
            const canvas = await html2canvas(block, {
              scale: 1.5,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
              windowWidth: 1000,
              windowHeight: totalContainerHeight,
              scrollX: 0,
              scrollY: 0,
            });

            if (!canvas || canvas.width === 0 || canvas.height === 0) continue;

            const imgData = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * contentWidth) / canvas.width;

            // Check if block fits on current page. If not, create new page
            if (currentY + imgHeight > pageHeight - 36) {
              doc.addPage();
              renderRunningHeader();
              currentY = 38;
            }

            doc.addImage(imgData, 'PNG', marginX, currentY, contentWidth, imgHeight);
            currentY += imgHeight + 12;
          } catch (blockErr) {
            console.warn(`Could not render block ${cIdx} in section ${sIdx}:`, blockErr);
          }
        }
      }
    }

    // 7. Page numbers at bottom
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${p} of ${totalPages}`, pageWidth / 2, pageHeight - 16, { align: 'center' });
    }

    const filename = `Executive_Dashboard_Comprehensive_Report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
    doc.save(filename);
  } finally {
    // Restore original style to hide container again
    if (origStyle) {
      container.setAttribute('style', origStyle);
    } else {
      container.removeAttribute('style');
    }
  }
};
