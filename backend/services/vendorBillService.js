const { pool } = require("../config/db");
const model = require("../models/vendorBillModel");
const purchaseModel = require("../models/purchaseOrderModel");

const STATUSES = ["draft", "confirmed", "paid", "cancelled"];

function fail(message, statusCode = 400) { const error = new Error(message); error.statusCode = statusCode; throw error; }
function id(value, label, required = false) {
  if (value === undefined || value === null || value === "") { if (required) fail(`${label} is required`); return null; }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) fail(`${label} must be a valid ID`);
  return parsed;
}
function date(value, label) { if (!value || Number.isNaN(Date.parse(value))) fail(`${label} is required and must be a valid date`); return String(value).slice(0, 10); }
function decimal(value, label, minimum) {
  if (value === undefined || value === null || value === "" || !Number.isFinite(Number(value)) || Number(value) < minimum) fail(`${label} must be ${minimum === 0 ? "zero or greater" : "greater than zero"}`);
  return Number(value);
}
function normalizeBill(data = {}) {
  const status = String(data.status ?? "draft").toLowerCase();
  if (!STATUSES.includes(status)) fail("Status must be draft, confirmed, paid, or cancelled");
  if (typeof data.billNumber !== "string" || !data.billNumber.trim()) fail("Vendor bill number is required");
  const billDate = date(data.billDate ?? new Date().toISOString().slice(0, 10), "Bill date");
  const dueDate = data.dueDate == null || data.dueDate === "" ? null : date(data.dueDate, "Due date");
  if (dueDate && dueDate < billDate) fail("Due date must be on or after bill date");
  return {
    billNumber: data.billNumber.trim(), poId: id(data.poId, "Purchase order"), vendorId: id(data.vendorId, "Vendor", true), billDate, dueDate,
    reference: data.reference == null ? null : String(data.reference).trim() || null,
    status, createdBy: id(data.createdBy, "Created by"),
  };
}
function normalizeLine(data = {}) {
  return {
    purchaseOrderLineId: id(data.purchaseOrderLineId, "Purchase order line"), productId: id(data.productId, "Product", true),
    analyticAccountId: id(data.analyticAccountId, "Analytic account"), accountId: id(data.accountId, "Account", true), taxId: id(data.taxId, "Tax"),
    quantity: decimal(data.quantity, "Quantity", 0.0000001), unitPrice: decimal(data.unitPrice, "Unit price", 0),
  };
}
async function validateBill(data) {
  if (!(await model.activeVendor(data.vendorId))) fail("Vendor not found, inactive, or not a vendor");
  if (data.createdBy && !(await model.activeUser(data.createdBy))) fail("Created by user not found or inactive");
  if (data.poId) {
    const order = await purchaseModel.getById(data.poId);
    if (!order) fail("Purchase order not found");
    if (String(order.vendor_id) !== String(data.vendorId)) fail("Purchase order vendor must match the vendor bill vendor");
    if (order.status !== "confirmed") fail("Only confirmed purchase orders can be linked to a vendor bill");
  }
}
async function validateLine(data, bill) {
  if (!(await model.activeProduct(data.productId))) fail("Product not found or inactive");
  if (!(await model.activeAccount(data.accountId))) fail("Account not found or inactive");
  if (data.analyticAccountId && !(await model.activeAnalytic(data.analyticAccountId))) fail("Analytic account not found or inactive");
  if (data.taxId) { const tax = await model.activeTax(data.taxId); if (!tax) fail("Tax not found or inactive"); data.taxRate = Number(tax.rate); } else data.taxRate = 0;
  if (data.purchaseOrderLineId) {
    if (!bill.po_id) fail("Purchase order line can only be used on a bill linked to a purchase order");
    const sourceLine = await purchaseModel.getLine(bill.po_id, data.purchaseOrderLineId);
    if (!sourceLine) fail("Purchase order line does not belong to this bill's purchase order");
  }
}
function transition(existing, next) {
  if (existing === next) return;
  if (existing === "draft" && ["confirmed", "cancelled"].includes(next)) return;
  if (existing === "confirmed" && ["paid", "cancelled"].includes(next)) return;
  fail(`Invalid vendor bill status transition from ${existing} to ${next}`);
}
async function getVendorBills() { return model.getAll(); }
async function getVendorBill(billId) { const item = await model.getById(billId); if (!item) fail("Vendor bill not found", 404); return item; }
async function createVendorBill(data) { data = normalizeBill(data); await validateBill(data); return model.create(data); }
async function updateVendorBill(billId, data) {
  const existing = await getVendorBill(billId);
  data = normalizeBill({ ...data, poId: existing.po_id });
  await validateBill(data); transition(existing.status, data.status);
  if (existing.status !== "draft" && (String(existing.vendor_id) !== String(data.vendorId) || String(existing.bill_date).slice(0, 10) !== data.billDate)) fail("Confirmed, paid, or cancelled vendor bills cannot change vendor or bill date");
  return model.update(billId, data);
}
async function deleteVendorBill(billId) { const item = await getVendorBill(billId); if (item.status !== "draft") fail("Only draft vendor bills can be deleted"); return model.remove(billId); }
async function editableBill(billId) { const bill = await getVendorBill(billId); if (bill.status !== "draft") fail("Lines can only be changed on draft vendor bills"); return bill; }
async function getLines(billId) { await getVendorBill(billId); return model.getLines(billId); }
async function getLine(billId, lineId) { await getVendorBill(billId); const line = await model.getLine(billId, lineId); if (!line) fail("Vendor bill line not found for this vendor bill", 404); return line; }
async function createLine(billId, data) { const bill = await editableBill(billId); data = normalizeLine(data); await validateLine(data, bill); const line = await model.createLine(billId, data); await model.refreshTotals(billId); return line; }
async function updateLine(billId, lineId, data) { const bill = await editableBill(billId); await getLine(billId, lineId); data = normalizeLine(data); await validateLine(data, bill); const line = await model.updateLine(billId, lineId, data); await model.refreshTotals(billId); return line; }
async function deleteLine(billId, lineId) { await editableBill(billId); await getLine(billId, lineId); const line = await model.removeLine(billId, lineId); await model.refreshTotals(billId); return line; }

async function createFromPurchaseOrder(orderId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const order = await purchaseModel.getForUpdate(orderId, client);
    if (!order) fail("Purchase order not found", 404);
    if (order.status !== "confirmed") fail("Only confirmed purchase orders can be converted to a vendor bill");
    const existing = await client.query("SELECT id FROM vendor_bills WHERE po_id = $1", [orderId]);
    if (existing.rows[0]) fail("Purchase order already has a vendor bill", 409);
    const lines = (await client.query("SELECT * FROM purchase_order_lines WHERE purchase_order_id = $1 ORDER BY id", [orderId])).rows;
    if (!lines.length) fail("Purchase order must have at least one line before billing");
    for (const line of lines) if (!line.account_id) fail("Purchase order line requires an account before billing");
    const bill = (await client.query(
      `INSERT INTO vendor_bills (bill_number, po_id, vendor_id, bill_date, reference, status, subtotal, tax_total, grand_total)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, 'draft', 0, 0, 0) RETURNING *`,
      [`BILL-PO-${order.id}`, order.id, order.vendor_id, order.po_number],
    )).rows[0];
    for (const line of lines) {
      await client.query(
        `INSERT INTO vendor_bill_lines
         (bill_id, purchase_order_line_id, product_id, analytic_account_id, account_id, tax_id, tax_rate, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [bill.id, line.id, line.product_id, line.analytic_account_id, line.account_id, line.tax_id, line.tax_rate, line.quantity, line.unit_price],
      );
    }
    await model.refreshTotals(bill.id, client);
    const result = await model.getById(bill.id, client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getVendorBills, getVendorBill, createVendorBill, updateVendorBill, deleteVendorBill,
  getLines, getLine, createLine, updateLine, deleteLine, createFromPurchaseOrder,
};
