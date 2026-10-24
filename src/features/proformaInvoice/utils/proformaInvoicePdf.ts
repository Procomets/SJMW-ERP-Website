import jsPDF from 'jspdf';
import type { ProformaInvoice } from '../types/proformaInvoice.types';
import { numberToWordsIndian } from '../services/proformaInvoice.service';

/**
 * Builds the exact vector PDF for the Proforma Invoice matching the provided document
 */
export const buildProformaInvoicePdfDoc = (invoice: ProformaInvoice): jsPDF => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 841.89 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 595.28 pt

  // Coordinates
  const startX = 40;
  const boxWidth = 761.89; // ends at 801.89 pt (~40pt margins)
  const endX = startX + boxWidth;

  const topY = 48; // Box starts here
  const splitX = startX + 315; // Left vs Right divider (355 pt)
  const midRightX = splitX + 215; // Sub-divider in right metadata grid (570 pt)

  // 1. Title at top (centered above box)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('PROFORMA INVOICE', pageWidth / 2, 36, { align: 'center' });

  // 2. Upper Left Section (Seller + Consignee + Buyer)
  // Seller (y: 48 to 118)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('SRI JOTHI MOULDING WORKS - 2026-2027', startX + 6, topY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('FACTORY: AC 31/9 TINY PLOT, SIDCO', startX + 6, topY + 22);
  doc.text('INDUSTRIAL ESTATE THIRUMUDIVAKKAM', startX + 6, topY + 31);
  doc.text('CHENNAI 600044', startX + 6, topY + 40);
  doc.text('GSTIN/UIN: 33AAIPG7979A1ZQ', startX + 6, topY + 49);
  doc.text('State Name : Tamil Nadu, Code : 33', startX + 6, topY + 58);
  doc.text('E-Mail : sjmwmg@yahoo.com', startX + 6, topY + 67);

  // Available width for Left Section addresses: splitX - startX = 315.
  // With 6pt margin on each side, safe wrapped text width is 295 pt.
  const maxLeftTextWidth = 295;

  // Consignee (y: 118 to 174)
  const consigneeY = topY + 70;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Consignee (Ship to)', startX + 6, consigneeY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const cNameLines = doc.splitTextToSize(invoice.consignee?.name?.toUpperCase() || '—', maxLeftTextWidth);
  doc.text(cNameLines[0] || '—', startX + 6, consigneeY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  const cAddr = (invoice.consignee?.address || '').trim();
  const cAddrLines = doc.splitTextToSize(cAddr, maxLeftTextWidth);
  let curCY = consigneeY + 26;
  cAddrLines.slice(0, 2).forEach((l: string) => {
    doc.text(l.trim(), startX + 6, curCY);
    curCY += 8;
  });

  doc.setFontSize(7);
  doc.text(`GSTIN/UIN: ${invoice.consignee?.gstin || '—'}`, startX + 6, consigneeY + 45);
  doc.text(
    `State Name : ${invoice.consignee?.stateName || 'Tamil Nadu'}, Code : ${invoice.consignee?.stateCode || '33'}`,
    startX + 6,
    consigneeY + 53
  );

  // Buyer (y: 174 to 230)
  const buyerY = consigneeY + 56;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Buyer (Bill to)', startX + 6, buyerY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const bNameLines = doc.splitTextToSize(invoice.buyer?.name?.toUpperCase() || '—', maxLeftTextWidth);
  doc.text(bNameLines[0] || '—', startX + 6, buyerY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  const bAddr = (invoice.buyer?.address || '').trim();
  const bAddrLines = doc.splitTextToSize(bAddr, maxLeftTextWidth);
  let curBY = buyerY + 26;
  bAddrLines.slice(0, 2).forEach((l: string) => {
    doc.text(l.trim(), startX + 6, curBY);
    curBY += 8;
  });

  doc.setFontSize(7);
  doc.text(`GSTIN/UIN: ${invoice.buyer?.gstin || '—'}`, startX + 6, buyerY + 45);
  doc.text(
    `State Name : ${invoice.buyer?.stateName || 'Tamil Nadu'}, Code : ${invoice.buyer?.stateCode || '33'}`,
    startX + 6,
    buyerY + 53
  );

  // Upper Right Section (Grid of metadata)
  const rowH = 26;
  const rY0 = topY;
  const rY1 = rY0 + rowH;
  const rY2 = rY1 + rowH;
  const rY3 = rY2 + rowH;
  const rY4 = rY3 + rowH;
  const rY5 = rY4 + rowH;
  const rY6 = rY5 + rowH;
  const rY7 = rY6 + rowH; // ends at 230

  // Row 1: Invoice No. | Dated
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Invoice No.', splitX + 6, rY0 + 9);
  doc.text('e-Way Bill No.', midRightX - 6, rY0 + 9, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(invoice.invoiceNo || '—', splitX + 6, rY0 + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Dated', midRightX + 6, rY0 + 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(invoice.date || '—', midRightX + 6, rY0 + 20);

  // Row 2: Delivery Note | Mode/Terms of Payment
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Delivery Note', splitX + 6, rY1 + 9);
  doc.text(invoice.deliveryNote || '', splitX + 6, rY1 + 20);

  doc.text('Mode/Terms of Payment', midRightX + 6, rY1 + 9);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.modeTermsOfPayment || 'IMMEDIATE', midRightX + 6, rY1 + 20);

  // Row 3: Reference No. & Date. | Other References
  doc.setFont('helvetica', 'normal');
  doc.text('Reference No. & Date.', splitX + 6, rY2 + 9);
  doc.text(invoice.referenceNoAndDate || '', splitX + 6, rY2 + 20);

  doc.text('Other References', midRightX + 6, rY2 + 9);
  doc.text(invoice.otherReferences || '', midRightX + 6, rY2 + 20);

  // Row 4: Buyer's Order No. | Dated
  doc.text("Buyer's Order No.", splitX + 6, rY3 + 9);
  doc.text(invoice.buyerOrderNo || '', splitX + 6, rY3 + 20);

  doc.text('Dated', midRightX + 6, rY3 + 9);
  doc.text(invoice.buyerOrderDate || '', midRightX + 6, rY3 + 20);

  // Row 5: Dispatch Doc No. | Delivery Note Date
  doc.text('Dispatch Doc No.', splitX + 6, rY4 + 9);
  doc.text(invoice.dispatchDocNo || '', splitX + 6, rY4 + 20);

  doc.text('Delivery Note Date', midRightX + 6, rY4 + 9);
  doc.text(invoice.deliveryNoteDate || '', midRightX + 6, rY4 + 20);

  // Row 6: Dispatched through | Destination
  doc.text('Dispatched through', splitX + 6, rY5 + 9);
  doc.text(invoice.dispatchedThrough || '', splitX + 6, rY5 + 20);

  doc.text('Destination', midRightX + 6, rY5 + 9);
  doc.text(invoice.destination || '', midRightX + 6, rY5 + 20);

  // Row 7: Terms of Delivery (full width of right)
  doc.text('Terms of Delivery', splitX + 6, rY6 + 9);
  const terms = doc.splitTextToSize(invoice.termsOfDelivery || '', endX - splitX - 12);
  if (terms.length > 0) {
    doc.text(terms.slice(0, 2), splitX + 6, rY6 + 18);
  }

  // 3. Middle Section: Table of Goods (starts at rY7 = topY + 182 = 230)
  const goodsStartY = rY7;
  const goodsHeaderH = 22;

  // Column X definitions
  const colSlW = 28;
  const colPkgW = 50;
  const colDescW = 405;
  const colHsnW = 55;
  const colQtyW = 75;
  const colRateW = 48;
  const colPerW = 32;
  const colAmtW = boxWidth - (colSlW + colPkgW + colDescW + colHsnW + colQtyW + colRateW + colPerW); // 68.89 pt

  const gX0 = startX; // 40
  const gX1 = gX0 + colSlW; // 68
  const gX2 = gX1 + colPkgW; // 118
  const gX3 = gX2 + colDescW; // 523
  const gX4 = gX3 + colHsnW; // 578
  const gX5 = gX4 + colQtyW; // 653
  const gX6 = gX5 + colRateW; // 701
  const gX7 = gX6 + colPerW; // 733
  const gX8 = endX; // 801.89

  // Table Headers
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Sl', (gX0 + gX1) / 2, goodsStartY + 9, { align: 'center' });
  doc.text('No.', (gX0 + gX1) / 2, goodsStartY + 17, { align: 'center' });

  doc.text('No. & Kind', (gX1 + gX2) / 2, goodsStartY + 9, { align: 'center' });
  doc.text('of Pkgs.', (gX1 + gX2) / 2, goodsStartY + 17, { align: 'center' });

  doc.text('Description of Goods', (gX2 + gX3) / 2, goodsStartY + 14, { align: 'center' });
  doc.text('HSN/SAC', (gX3 + gX4) / 2, goodsStartY + 14, { align: 'center' });
  doc.text('Quantity', (gX4 + gX5) / 2, goodsStartY + 14, { align: 'center' });
  doc.text('Rate', (gX5 + gX6) / 2, goodsStartY + 14, { align: 'center' });
  doc.text('per', (gX6 + gX7) / 2, goodsStartY + 14, { align: 'center' });
  doc.text('Amount', (gX7 + gX8) / 2, goodsStartY + 14, { align: 'center' });

  // Content Rows
  let curItemY = goodsStartY + goodsHeaderH + 11;
  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [];

  items.forEach((item, index) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    // Sl No.
    doc.text(String(item.slNo || index + 1), (gX0 + gX1) / 2, curItemY, { align: 'center' });

    // Description
    const descLines = doc.splitTextToSize(item.description || '—', colDescW - 12);
    doc.text(descLines, gX2 + 6, curItemY);

    // HSN/SAC
    doc.text(item.hsnSac || '', (gX3 + gX4) / 2, curItemY, { align: 'center' });

    // Quantity
    if (Number(item.quantity)) {
      doc.text(
        `${Number(item.quantity).toFixed(3)} ${item.per || 'KGS'}`,
        gX5 - 6,
        curItemY,
        { align: 'right' }
      );
    }

    // Rate
    if (Number(item.rate)) {
      doc.text(Number(item.rate).toFixed(2), gX6 - 6, curItemY, { align: 'right' });
    }

    // per
    doc.text(item.per || 'KGS', (gX6 + gX7) / 2, curItemY, { align: 'center' });

    // Amount
    if (Number(item.amount)) {
      doc.text(Number(item.amount).toFixed(2), gX8 - 6, curItemY, { align: 'right' });
    }

    const rowHeight = Math.max(descLines.length * 9.5, 13);
    curItemY += rowHeight;
  });

  // Taxes inside Description column (below all items)
  curItemY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  const round2 = (n: number): number => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  const computedSubTotal = round2(
    items.reduce(
      (sum, it) => sum + round2((Number(it.quantity) || 0) * (Number(it.rate) || 0)),
      0
    )
  );

  const subTotal =
    invoice.subTotal !== undefined && invoice.subTotal > 0 ? invoice.subTotal : computedSubTotal;
  const taxRate = invoice.taxRatePercent !== undefined ? Number(invoice.taxRatePercent) : 18;
  const halfRate = taxRate / 2;

  let cgstAmount = invoice.cgstAmount;
  let sgstAmount = invoice.sgstAmount;
  let igstAmount = invoice.igstAmount;

  if (taxRate > 0 && subTotal > 0) {
    if (invoice.isInterstate) {
      if (igstAmount === undefined || igstAmount === null || igstAmount === 0) {
        igstAmount = round2((subTotal * taxRate) / 100);
      }
    } else {
      if (cgstAmount === undefined || cgstAmount === null || cgstAmount === 0) {
        cgstAmount = round2((subTotal * halfRate) / 100);
        sgstAmount = cgstAmount;
      }
    }
  }

  const totalTaxAmount =
    invoice.totalTaxAmount !== undefined && invoice.totalTaxAmount > 0
      ? invoice.totalTaxAmount
      : round2(invoice.isInterstate ? (igstAmount || 0) : ((cgstAmount || 0) + (sgstAmount || 0)));

  const grandTotal =
    invoice.grandTotal !== undefined && invoice.grandTotal > 0
      ? invoice.grandTotal
      : round2(subTotal + totalTaxAmount);

  if (taxRate > 0) {
    if (!invoice.isInterstate) {
      // CGST OUTPUT 9%
      doc.text(`CGST OUTPUT ${halfRate}%`, gX3 - 10, curItemY, { align: 'right' });
      doc.text(`${halfRate} %`, gX6 - 6, curItemY, { align: 'right' });
      doc.text(Number(cgstAmount || 0).toFixed(2), gX8 - 6, curItemY, { align: 'right' });

      curItemY += 12;
      // SGST OUTPUT 9%
      doc.text(`SGST OUTPUT ${halfRate}%`, gX3 - 10, curItemY, { align: 'right' });
      doc.text(`${halfRate} %`, gX6 - 6, curItemY, { align: 'right' });
      doc.text(Number(sgstAmount || 0).toFixed(2), gX8 - 6, curItemY, { align: 'right' });
      curItemY += 12;
    } else {
      // IGST OUTPUT 18%
      doc.text(`IGST OUTPUT ${taxRate}%`, gX3 - 10, curItemY, { align: 'right' });
      doc.text(`${taxRate} %`, gX6 - 6, curItemY, { align: 'right' });
      doc.text(Number(igstAmount || 0).toFixed(2), gX8 - 6, curItemY, { align: 'right' });
      curItemY += 12;
    }
  }

  // Total row of Goods Table
  const minGoodsTableH = 88;
  const goodsEndY = Math.max(curItemY + 6, goodsStartY + goodsHeaderH + minGoodsTableH);
  const totalRowH = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Total', (gX2 + gX3) / 2, goodsEndY + 12, { align: 'center' });

  // Sum of quantities
  const totalQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const primaryPer = items[0]?.per || 'KGS';
  if (totalQty > 0) {
    doc.text(`${totalQty.toFixed(3)} ${primaryPer}`, gX5 - 6, goodsEndY + 12, { align: 'right' });
  }

  // Grand Total
  doc.text(Number(grandTotal || 0).toFixed(2), gX8 - 6, goodsEndY + 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('E. & O.E', gX8 - 6, goodsEndY + 24, { align: 'right' });

  // 4. Tax Summary Table (GST Breakdown)
  const taxTableStartY = goodsEndY + totalRowH + 8;
  const taxHeaderH1 = 12;
  const taxHeaderH2 = 12;
  const taxRowH = 13;

  // Clean, perfectly proportioned column boundaries across 733.89 points
  const tX0 = gX1; // 68
  const tX1 = 238; // HSN/SAC (width: 170)
  const tX2 = 348; // Taxable Value (width: 110)
  const tX3 = 403; // CGST Rate (width: 55)
  const tX4 = 498; // CGST Amount (width: 95)
  const tX5 = 553; // SGST Rate (width: 55)
  const tX6 = 648; // SGST Amount (width: 95)
  const tX7 = endX; // Total Tax Amount (width: 153.89)

  // Tax Table Headers Row 1
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('HSN/SAC', (tX0 + tX1) / 2, taxTableStartY + 15, { align: 'center' });

  doc.text('Taxable', (tX1 + tX2) / 2, taxTableStartY + 9, { align: 'center' });
  doc.text('Value', (tX1 + tX2) / 2, taxTableStartY + 18, { align: 'center' });

  if (!invoice.isInterstate) {
    doc.text('CGST', (tX2 + tX4) / 2, taxTableStartY + 9, { align: 'center' });
    doc.text('SGST/UTGST', (tX4 + tX6) / 2, taxTableStartY + 9, { align: 'center' });

    // Subheaders Row 2
    doc.text('Rate', (tX2 + tX3) / 2, taxTableStartY + 20, { align: 'center' });
    doc.text('Amount', (tX3 + tX4) / 2, taxTableStartY + 20, { align: 'center' });
    doc.text('Rate', (tX4 + tX5) / 2, taxTableStartY + 20, { align: 'center' });
    doc.text('Amount', (tX5 + tX6) / 2, taxTableStartY + 20, { align: 'center' });
  } else {
    doc.text('IGST', (tX2 + tX6) / 2, taxTableStartY + 9, { align: 'center' });

    // Subheaders Row 2
    const midIGST = (tX2 + tX6) / 2;
    doc.text('Rate', (tX2 + midIGST) / 2, taxTableStartY + 20, { align: 'center' });
    doc.text('Amount', (midIGST + tX6) / 2, taxTableStartY + 20, { align: 'center' });
  }

  doc.text('Total', (tX6 + tX7) / 2, taxTableStartY + 9, { align: 'center' });
  doc.text('Tax Amount', (tX6 + tX7) / 2, taxTableStartY + 18, { align: 'center' });

  // Group items by HSN/SAC
  const hsnMap = new Map<string, number>();
  items.forEach((it) => {
    const code = (it.hsnSac || '76012010').trim();
    const amt = Number(it.amount || 0);
    hsnMap.set(code, (hsnMap.get(code) || 0) + amt);
  });

  let curTaxY = taxTableStartY + taxHeaderH1 + taxHeaderH2 + 9;

  Array.from(hsnMap.entries()).forEach(([hsnCode, taxableVal]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    // HSN/SAC
    doc.text(hsnCode, (tX0 + tX1) / 2, curTaxY, { align: 'center' });
    // Taxable Value
    doc.text(taxableVal.toFixed(2), tX2 - 6, curTaxY, { align: 'right' });

    if (!invoice.isInterstate) {
      const cgst = (taxableVal * halfRate) / 100;
      const sgst = (taxableVal * halfRate) / 100;
      const totTax = cgst + sgst;
      // CGST Rate & Amount
      doc.text(`${halfRate}%`, (tX2 + tX3) / 2, curTaxY, { align: 'center' });
      doc.text(cgst.toFixed(2), tX4 - 6, curTaxY, { align: 'right' });
      // SGST Rate & Amount
      doc.text(`${halfRate}%`, (tX4 + tX5) / 2, curTaxY, { align: 'center' });
      doc.text(sgst.toFixed(2), tX6 - 6, curTaxY, { align: 'right' });
      // Total Tax Amount
      doc.text(totTax.toFixed(2), tX7 - 6, curTaxY, { align: 'right' });
    } else {
      const igst = (taxableVal * taxRate) / 100;
      const midIGST = (tX2 + tX6) / 2;
      doc.text(`${taxRate}%`, (tX2 + midIGST) / 2, curTaxY, { align: 'center' });
      doc.text(igst.toFixed(2), tX6 - 6, curTaxY, { align: 'right' });
      doc.text(igst.toFixed(2), tX7 - 6, curTaxY, { align: 'right' });
    }
    curTaxY += taxRowH;
  });

  // Tax Total Row
  const taxTotalY = curTaxY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Total', (tX0 + tX1) / 2, taxTotalY, { align: 'center' });
  doc.text(Number(subTotal || 0).toFixed(2), tX2 - 6, taxTotalY, { align: 'right' });

  if (!invoice.isInterstate) {
    doc.text(Number(cgstAmount || 0).toFixed(2), tX4 - 6, taxTotalY, { align: 'right' });
    doc.text(Number(sgstAmount || 0).toFixed(2), tX6 - 6, taxTotalY, { align: 'right' });
  } else {
    doc.text(Number(igstAmount || 0).toFixed(2), tX6 - 6, taxTotalY, { align: 'right' });
  }
  doc.text(Number(totalTaxAmount || 0).toFixed(2), tX7 - 6, taxTotalY, { align: 'right' });

  const taxTableBottomY = taxTotalY + 3;

  // 5. Footer Section
  const footerStartY = taxTableBottomY + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const taxWords =
    invoice.taxAmountInWords ||
    (totalTaxAmount > 0 ? `INR ${numberToWordsIndian(totalTaxAmount)}` : '');
  doc.text(
    `Tax Amount (in words) : ${taxWords}`,
    startX + 6,
    footerStartY + 9
  );

  const declY = footerStartY + 16;
  const footerSplitX = startX + (boxWidth * 0.44);

  // Left Declaration
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text("Company's PAN:", startX + 6, declY + 10);
  doc.setFont('helvetica', 'bold');
  doc.text('AAIPG7979A', startX + 75, declY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('Declaration', startX + 6, declY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('We declare that this invoice shows the actual price of the goods', startX + 6, declY + 29);
  doc.text('described and that all particulars are true and correct.', startX + 6, declY + 38);

  // Right Signatory
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('for SRI JOTHI MOULDING WORKS - 2026-2027', footerSplitX + 6, declY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Authorised Signatory', endX - 10, declY + 50, { align: 'right' });

  // Bottom Center Notice
  const totalBoxEndY = declY + 56;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('This is a Computer Generated Invoice', pageWidth / 2, totalBoxEndY + 12, {
    align: 'center',
  });

  // ─── Precision Vector Grid Lines ───
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1.4);

  // 1. Outer Box Border
  doc.rect(startX, topY, boxWidth, totalBoxEndY - topY);

  doc.setLineWidth(0.8);

  // Upper section vertical divider (split left and right)
  doc.line(splitX, topY, splitX, goodsStartY);

  // Left Section horizontal dividers
  doc.line(startX, consigneeY, splitX, consigneeY);
  doc.line(startX, buyerY, splitX, buyerY);

  // Right Section horizontal row dividers
  doc.line(splitX, rY1, endX, rY1);
  doc.line(splitX, rY2, endX, rY2);
  doc.line(splitX, rY3, endX, rY3);
  doc.line(splitX, rY4, endX, rY4);
  doc.line(splitX, rY5, endX, rY5);
  doc.line(splitX, rY6, endX, rY6);

  // Right Section vertical mid-divider
  doc.line(midRightX, topY, midRightX, rY6);

  // Full horizontal divider above Goods table
  doc.line(startX, goodsStartY, endX, goodsStartY);

  // Goods Header bottom line
  doc.line(startX, goodsStartY + goodsHeaderH, endX, goodsStartY + goodsHeaderH);

  // Goods vertical column lines (from goodsStartY to goodsEndY)
  doc.line(gX1, goodsStartY, gX1, goodsEndY);
  doc.line(gX2, goodsStartY, gX2, goodsEndY);
  doc.line(gX3, goodsStartY, gX3, goodsEndY);
  doc.line(gX4, goodsStartY, gX4, goodsEndY);
  doc.line(gX5, goodsStartY, gX5, goodsEndY);
  doc.line(gX6, goodsStartY, gX6, goodsEndY);
  doc.line(gX7, goodsStartY, gX7, goodsEndY);

  // Goods Total Row horizontal lines
  doc.line(startX, goodsEndY, endX, goodsEndY);
  doc.line(startX, goodsEndY + totalRowH, endX, goodsEndY + totalRowH);
  doc.line(gX4, goodsEndY, gX4, goodsEndY + totalRowH);
  doc.line(gX7, goodsEndY, gX7, goodsEndY + totalRowH);

  // Tax Table Horizontal Lines
  doc.line(tX0, taxTableStartY, endX, taxTableStartY);
  doc.line(tX2, taxTableStartY + taxHeaderH1, tX6, taxTableStartY + taxHeaderH1);
  doc.line(tX0, taxTableStartY + taxHeaderH1 + taxHeaderH2, endX, taxTableStartY + taxHeaderH1 + taxHeaderH2);
  doc.line(tX0, taxTotalY - 9, endX, taxTotalY - 9);
  doc.line(tX0, taxTableBottomY, endX, taxTableBottomY);

  // Tax Table Vertical Lines
  doc.line(tX0, taxTableStartY, tX0, taxTableBottomY);
  doc.line(tX1, taxTableStartY, tX1, taxTableBottomY);
  doc.line(tX2, taxTableStartY, tX2, taxTableBottomY);
  if (!invoice.isInterstate) {
    doc.line(tX3, taxTableStartY + taxHeaderH1, tX3, taxTableBottomY);
    doc.line(tX4, taxTableStartY, tX4, taxTableBottomY);
    doc.line(tX5, taxTableStartY + taxHeaderH1, tX5, taxTableBottomY);
    doc.line(tX6, taxTableStartY, tX6, taxTableBottomY);
  } else {
    const midIGST = (tX2 + tX6) / 2;
    doc.line(midIGST, taxTableStartY + taxHeaderH1, midIGST, taxTableBottomY);
    doc.line(tX6, taxTableStartY, tX6, taxTableBottomY);
  }
  doc.line(tX7, taxTableStartY, tX7, taxTableBottomY);

  // Footer Dividers
  doc.line(startX, declY, endX, declY);
  doc.line(footerSplitX, declY, footerSplitX, totalBoxEndY);

  return doc;
};

/**
 * Downloads the PDF
 */
export const downloadProformaInvoicePdf = (invoice: ProformaInvoice): void => {
  const doc = buildProformaInvoicePdfDoc(invoice);
  const cleanInvNo = (invoice.invoiceNo || 'Proforma_Invoice').replace(/[/\\?%*:|"<>]/g, '_');
  doc.save(`Proforma_Invoice_${cleanInvNo}.pdf`);
};

/**
 * Generates Data URI String for embedded live preview
 */
export const getProformaInvoicePdfDataUri = (invoice: ProformaInvoice): string => {
  const doc = buildProformaInvoicePdfDoc(invoice);
  return doc.output('datauristring');
};
