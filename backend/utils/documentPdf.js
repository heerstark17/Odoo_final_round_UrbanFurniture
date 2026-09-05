const PDFDocument = require("pdfkit");

function money(value) {
  return Number(value || 0).toFixed(2);
}

function display(value) {
  return value == null ? "-" : String(value);
}

function createDocumentPdf(res, data) {
  const pdf = new PDFDocument({ margin: 42, size: "A4" });
  pdf.pipe(res);
  pdf.fontSize(20).fillColor("#1f2937").text("Urban Furniture");
  pdf.fontSize(14).fillColor("#2563eb").text(data.title);
  pdf.moveDown(0.7).fontSize(10).fillColor("#111827");
  pdf.text(`${data.numberLabel}: ${display(data.documentNumber)}`);
  pdf.text(`Date: ${String(data.documentDate).slice(0, 10)}`);
  pdf.text(`${data.partyLabel}: ${display(data.partyName)}`);
  pdf.text(`Status: ${display(data.status)}`);
  pdf.moveDown(0.8);

  const columns = [42, 195, 255, 318, 400];
  const headers = ["Product", "Qty", "Unit Price", "Tax", "Line Total"];
  const headerY = pdf.y;
  pdf.rect(42, headerY, 510, 18).fill("#2563eb");
  headers.forEach((header, index) => pdf.fillColor("#ffffff").fontSize(9).text(header, columns[index], headerY + 5, {
    width: (columns[index + 1] || 552) - columns[index] - 5,
  }));
  pdf.y = headerY + 24;

  for (const line of data.lines) {
    if (pdf.y > 710) pdf.addPage();
    const y = pdf.y;
    pdf.fillColor("#111827").text(display(line.product_name), columns[0], y, { width: 148 });
    pdf.text(display(line.quantity), columns[1], y, { width: 55, align: "right" });
    pdf.text(money(line.unit_price), columns[2], y, { width: 58, align: "right" });
    pdf.text(`${display(line.tax_name)} (${money(line.tax_rate)}%)`, columns[3], y, { width: 77, align: "right" });
    pdf.text(money(line.line_total), columns[4], y, { width: 152, align: "right" });
    pdf.moveDown(0.55).strokeColor("#d1d5db").moveTo(42, pdf.y).lineTo(552, pdf.y).stroke().moveDown(0.35);
  }

  if (pdf.y > 650) pdf.addPage();
  pdf.moveDown(0.8).fontSize(10).fillColor("#111827");
  const totalsX = 390;
  pdf.text(`Subtotal: ${money(data.subtotal)}`, totalsX, pdf.y, { width: 162, align: "right" });
  pdf.text(`Tax Total: ${money(data.taxTotal)}`, totalsX, pdf.y + 4, { width: 162, align: "right" });
  pdf.fontSize(12).fillColor("#2563eb").text(`Grand Total: ${money(data.grandTotal)}`, totalsX, pdf.y + 5, { width: 162, align: "right" });
  pdf.end();
}

module.exports = { createDocumentPdf };
