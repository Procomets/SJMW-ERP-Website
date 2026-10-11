import jsPDF from 'jspdf';
import type { PurchaseOrder } from '../types/purchaseOrder.types';

/**
 * Draws a sharp diamond symbol matching the exact reference PO document (❖)
 */
const drawDiamondBullet = (doc: jsPDF, x: number, y: number, radius = 2.2) => {
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(0, 0, 0);
  // 4 vertices of a diamond
  const top = { x, y: y - radius };
  const right = { x: x + radius, y };
  const bottom = { x, y: y + radius };
  const left = { x: x - radius, y };

  doc.lines(
    [
      [radius, radius],
      [-radius, radius],
      [-radius, -radius],
      [radius, -radius],
    ],
    top.x,
    top.y,
    [1, 1],
    'FD'
  );
};

/**
 * Formats amount into clean string representation (e.g. "R190000" or "190000")
 */
const fmtAmountStr = (val: number | string): string => {
  const n = Number(val) || 0;
  // In the reference image, it shows "R190000" (or 190000)
  return `R${n}`;
};

/**
 * Formats address lines into clean wrap-friendly strings
 */
const formatAddressLines = (address: string, maxCharsPerLine = 48): string[] => {
  if (!address) return [];
  const lines: string[] = [];
  const rawParts = address.split('\n').flatMap((p) => p.split(', '));
  let currentLine = '';

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (!currentLine) {
      currentLine = trimmed;
    } else if ((currentLine + ', ' + trimmed).length <= maxCharsPerLine) {
      currentLine += ', ' + trimmed;
    } else {
      lines.push(currentLine);
      currentLine = trimmed;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
};

/**
 * Builds the exact Purchase Order PDF matching the provided document format
 */
export const buildPurchaseOrderPdfDoc = (po: PurchaseOrder): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~595.28 pt

  // Coordinates matching the exact reference
  const startX = 38;
  const boxWidth = 519; // ending at 557 pt, leaves ~38pt right margin
  const endX = startX + boxWidth;

  const headerHeight = 104;
  const startY = 48;
  const dividerX = startX + 316; // Split between left company details and right "PURCHASE ORDER"

  // 1. Header Box (y: startY to startY + headerHeight)
  // Left Box: Company Info
  doc.setTextColor(0, 0, 0);

  // Line 1: TIN & Mobile
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('TIN NO. :33950960257', startX + 10, startY + 12);
  doc.text('Mobile.No:9551798698', dividerX - 10, startY + 12, { align: 'right' });

  // Line 2: CST & Tel
  doc.text('CST NO. :45176 Dt-21.04.1988', startX + 10, startY + 23);
  doc.text('Tel.No:044 22453514 GST.', dividerX - 10, startY + 23, { align: 'right' });

  // Line 3: GST No.
  doc.text('No.:33AAIPG7979A1ZQ', (startX + dividerX) / 2, startY + 34, { align: 'center' });

  // Line 4: Company Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('SRI JOTHI MOULDING WORKS', (startX + dividerX) / 2, startY + 49, { align: 'center' });

  // Address lines
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('FACTORY:AC 31/9,Tiny Plot, SIDCO Industrial Estate', (startX + dividerX) / 2, startY + 62, { align: 'center' });
  doc.text('Thirumudivakkam,Chennai – 600044', (startX + dividerX) / 2, startY + 74, { align: 'center' });
  doc.text('Email:-sjmwmg@yahoo.com', (startX + dividerX) / 2, startY + 86, { align: 'center' });

  // Right Box of Header: "PURCHASE ORDER"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('PURCHASE ORDER', (dividerX + endX) / 2, startY + 54, { align: 'center' });

  // 2. Section 2: TO Vendor & PO Details
  const sec2StartY = startY + headerHeight;
  const sec2Height = 84;
  const sec2EndY = sec2StartY + sec2Height;

  // Left side: TO details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('TO:-', startX + 8, sec2StartY + 12);

  // Vendor Name (bold)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  const vendorNameText = po.vendorName || 'VENDOR NAME';
  doc.text(vendorNameText.toUpperCase(), startX + 8, sec2StartY + 24);

  // GST NO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`GST NO : ${po.vendorGst || '—'}`, startX + 8, sec2StartY + 36);

  // Address lines
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const addrLines = formatAddressLines(po.vendorAddress);
  let addrY = sec2StartY + 48;
  for (let i = 0; i < Math.min(addrLines.length, 3); i++) {
    doc.text(addrLines[i], startX + 8, addrY);
    addrY += 11;
  }

  // Right side: PO Metadata (divided into 3 stacked cells)
  const metaRowHeight = sec2Height / 3; // 28pt each
  const metaX = dividerX + 8;

  // Row 1: DATE
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('DATE', metaX, sec2StartY + 18);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${po.date || ''}`, metaX + 48, sec2StartY + 18);

  // Row 2: Purchase Order No
  doc.setFont('helvetica', 'normal');
  doc.text('Purchase Order No', metaX, sec2StartY + metaRowHeight + 18);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${po.poNumber || ''}`, metaX + 84, sec2StartY + metaRowHeight + 18);

  // Row 3: Your Quotation Ref
  doc.setFont('helvetica', 'normal');
  doc.text('Your Quotation Ref', metaX, sec2StartY + metaRowHeight * 2 + 18);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${po.quotationRef || 'By Telephonic'}`, metaX + 84, sec2StartY + metaRowHeight * 2 + 18);

  // 3. Section 3: Items Table
  const tableStartY = sec2EndY;
  const tableHeaderHeight = 22;
  const tableContentHeight = Math.max(140, (po.items?.length || 1) * 26 + 60);
  const tableEndY = tableStartY + tableHeaderHeight + tableContentHeight;

  // Column definitions
  const colSiNoW = 42;
  const colDescW = 210;
  const colQtyW = 85;
  const colRateW = 85;
  const colAmtW = boxWidth - (colSiNoW + colDescW + colQtyW + colRateW); // 97

  const cX0 = startX;
  const cX1 = cX0 + colSiNoW;
  const cX2 = cX1 + colDescW;
  const cX3 = cX2 + colQtyW;
  const cX4 = cX3 + colRateW;
  const cX5 = endX;

  // Table Headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('SI.NO', (cX0 + cX1) / 2, tableStartY + 15, { align: 'center' });
  doc.text('DESCRIPTION', (cX1 + cX2) / 2, tableStartY + 15, { align: 'center' });
  doc.text('QUANTITY', (cX2 + cX3) / 2, tableStartY + 15, { align: 'center' });
  doc.text('RATE / UNIT', (cX3 + cX4) / 2, tableStartY + 15, { align: 'center' });
  doc.text('AMOUNT', (cX4 + cX5) / 2, tableStartY + 15, { align: 'center' });

  // Table Content Rows
  let itemY = tableStartY + tableHeaderHeight + 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  po.items.forEach((item, idx) => {
    // SI.NO
    doc.text(`${item.siNo || idx + 1}.`, (cX0 + cX1) / 2, itemY, { align: 'center' });

    // DESCRIPTION (bold text in reference)
    doc.setFont('helvetica', 'bold');
    doc.text(item.description || '—', cX1 + 12, itemY);

    // QUANTITY (bold text in reference)
    doc.text(String(item.quantity ?? '—'), (cX2 + cX3) / 2, itemY, { align: 'center' });

    // RATE / UNIT (bold text in reference)
    doc.text(String(item.rate ?? '—'), (cX3 + cX4) / 2, itemY, { align: 'center' });

    // AMOUNT (with 'R' prefix as shown in reference)
    doc.text(fmtAmountStr(item.amount), (cX4 + cX5) / 2, itemY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    itemY += 24;
  });

  // 4. Section 4: Terms & Conditions Box
  const tcStartY = tableEndY;
  const tcHeight = 85;
  const tcEndY = tcStartY + tcHeight;

  // Terms & Conditions Title (Underlined)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Terms & Conditions', startX + 8, tcStartY + 14);
  const titleWidth = doc.getTextWidth('Terms & Conditions');
  doc.setLineWidth(0.8);
  doc.line(startX + 8, tcStartY + 16, startX + 8 + titleWidth, tcStartY + 16);

  // Bullets
  let bulletY = tcStartY + 30;
  const bulletLabelX = startX + 20;
  const bulletColonX = startX + 96;

  // 1. Payment Terms
  drawDiamondBullet(doc, startX + 11, bulletY - 2.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Payment Terms', bulletLabelX, bulletY);
  doc.text(`: ${po.terms?.paymentTerms || '45 Days'}`, bulletColonX, bulletY);

  // 2. GST Tax
  bulletY += 14;
  drawDiamondBullet(doc, startX + 11, bulletY - 2.5);
  doc.text('GST Tax', bulletLabelX, bulletY);
  doc.text(`: ${po.terms?.gstTax || '18% Extra'}`, bulletColonX, bulletY);

  // 3. Delivery
  bulletY += 14;
  drawDiamondBullet(doc, startX + 11, bulletY - 2.5);
  doc.text('Delivery', bulletLabelX, bulletY);
  doc.text(`: ${po.terms?.delivery || 'IMMEDIATE.'}`, bulletColonX, bulletY);

  // Optional extra terms
  if (po.terms?.otherTerms && po.terms.otherTerms.length > 0) {
    po.terms.otherTerms.forEach((term) => {
      bulletY += 14;
      drawDiamondBullet(doc, startX + 11, bulletY - 2.5);
      doc.text(term, bulletLabelX, bulletY);
    });
  }

  // 5. Section 5: Authorised Signatory Footer
  const footerStartY = tcEndY;
  const footerHeight = 65;
  const totalBoxEndY = footerStartY + footerHeight;

  // Signatory text on bottom right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('For SRI JOTHI MOULDING WORKS,', endX - 10, footerStartY + 35, { align: 'right' });

  doc.setFontSize(7.5);
  doc.text('AUTHORISED SIGNATORY', endX - 10, totalBoxEndY - 6, { align: 'right' });

  // ─── Solid Border Lines (Rendered with precise vector strokes) ───
  doc.setDrawColor(0, 0, 0);

  // 1. Main Outer Border Box
  doc.setLineWidth(1.6);
  doc.rect(startX, startY, boxWidth, totalBoxEndY - startY);

  // 2. Inner Grid Divider Lines (lineWidth = 1.0)
  doc.setLineWidth(1.0);

  // Top header horizontal divider
  doc.line(startX, sec2StartY, endX, sec2StartY);

  // Header vertical divider between Left Company Info and Right "PURCHASE ORDER"
  doc.line(dividerX, startY, dividerX, sec2StartY);

  // Section 2 horizontal divider below TO / PO details
  doc.line(startX, sec2EndY, endX, sec2EndY);

  // Section 2 vertical divider continuing down
  doc.line(dividerX, sec2StartY, dividerX, sec2EndY);

  // Right box horizontal dividers in PO details
  doc.line(dividerX, sec2StartY + metaRowHeight, endX, sec2StartY + metaRowHeight);
  doc.line(dividerX, sec2StartY + metaRowHeight * 2, endX, sec2StartY + metaRowHeight * 2);

  // Table header horizontal line
  doc.line(startX, tableStartY + tableHeaderHeight, endX, tableStartY + tableHeaderHeight);

  // Table bottom horizontal line
  doc.line(startX, tableEndY, endX, tableEndY);

  // Table vertical columns (extending from tableStartY to tableEndY)
  doc.line(cX1, tableStartY, cX1, tableEndY);
  doc.line(cX2, tableStartY, cX2, tableEndY);
  doc.line(cX3, tableStartY, cX3, tableEndY);
  doc.line(cX4, tableStartY, cX4, tableEndY);

  // Terms & Conditions bottom horizontal line
  doc.line(startX, tcEndY, endX, tcEndY);

  return doc;
};

/**
 * Downloads the Purchase Order PDF with clean filename
 */
export const downloadPurchaseOrderPdf = (po: PurchaseOrder): void => {
  const doc = buildPurchaseOrderPdfDoc(po);
  const cleanPoNo = (po.poNumber || 'PO').replace(/[/\\?%*:|"<>]/g, '_');
  doc.save(`Purchase_Order_${cleanPoNo}.pdf`);
};

/**
 * Generates Data URI String for instant embedded PDF preview
 */
export const getPurchaseOrderPdfDataUri = (po: PurchaseOrder): string => {
  const doc = buildPurchaseOrderPdfDoc(po);
  return doc.output('datauristring');
};
