const { pool } = require("../config/db");
const model = require("../models/customerInvoiceModel");
const salesModel = require("../models/salesOrderModel");
const STATUSES = ["draft", "confirmed", "paid", "cancelled"];
function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}
function id(value, label, required = false) {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${label} is required`);
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0)
    fail(`${label} must be a valid ID`);
  return parsed;
}
function date(value, label) {
  if (!value || Number.isNaN(Date.parse(value)))
    fail(`${label} is required and must be a valid date`);
  return String(value).slice(0, 10);
}
function decimal(value, label, minimum) {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    !Number.isFinite(Number(value)) ||
    Number(value) < minimum
  )
    fail(
      `${label} must be ${minimum === 0 ? "zero or greater" : "greater than zero"}`,
    );
  return Number(value);
}
function normalizeInvoice(data = {}) {
  const status = String(data.status ?? "draft").toLowerCase();
  if (!STATUSES.includes(status))
    fail("Status must be draft, confirmed, paid, or cancelled");
  const invoiceDate = date(
    data.invoiceDate ?? new Date().toISOString().slice(0, 10),
    "Invoice date",
  );
  const dueDate =
    data.dueDate == null || data.dueDate === ""
      ? null
      : date(data.dueDate, "Due date");
  if (dueDate && dueDate < invoiceDate)
    fail("Due date must be on or after invoice date");
  if (typeof data.invoiceNumber !== "string" || !data.invoiceNumber.trim())
    fail("Invoice number is required");
  return {
    invoiceNumber: data.invoiceNumber.trim(),
    soId: id(data.soId, "Sales order"),
    customerId: id(data.customerId, "Customer", true),
    invoiceDate,
    dueDate,
    reference:
      data.reference == null ? null : String(data.reference).trim() || null,
    status,
    createdBy: id(data.createdBy, "Created by"),
  };
}
function normalizeLine(data = {}) {
  return {
    salesOrderLineId: id(data.salesOrderLineId, "Sales order line"),
    productId: id(data.productId, "Product", true),
    analyticAccountId: id(data.analyticAccountId, "Analytic account"),
    accountId: id(data.accountId, "Account", true),
    taxId: id(data.taxId, "Tax"),
    quantity: decimal(data.quantity, "Quantity", 0.0000001),
    unitPrice: decimal(data.unitPrice, "Unit price", 0),
  };
}
async function validateInvoice(data) {
  if (!(await model.activeCustomer(data.customerId)))
    fail("Customer not found, inactive, or not a customer");
  if (data.createdBy && !(await model.activeUser(data.createdBy)))
    fail("Created by user not found or inactive");
}
async function validateLine(data) {
  if (!(await model.activeProduct(data.productId)))
    fail("Product not found or inactive");
  if (!(await model.activeAccount(data.accountId)))
    fail("Account not found or inactive");
  if (
    data.analyticAccountId &&
    !(await model.activeAnalytic(data.analyticAccountId))
  )
    fail("Analytic account not found or inactive");
  if (data.taxId) {
    const tax = await model.activeTax(data.taxId);
    if (!tax) fail("Tax not found or inactive");
    data.taxRate = Number(tax.rate);
  } else data.taxRate = 0;
}
function transition(existing, next) {
  if (existing === next) return;
  if (existing === "draft" && ["confirmed", "cancelled"].includes(next)) return;
  if (existing === "confirmed" && ["paid", "cancelled"].includes(next)) return;
  fail(`Invalid invoice status transition from ${existing} to ${next}`);
}
async function getInvoices() {
  return model.getAll();
}
async function getInvoice(invoiceId) {
  const item = await model.getById(invoiceId);
  if (!item) fail("Customer invoice not found", 404);
  return item;
}
async function createInvoice(data) {
  data = normalizeInvoice(data);
  await validateInvoice(data);
  const invoice = await model.create(data);
  return invoice;
}
async function updateInvoice(invoiceId, data) {
  const existing = await getInvoice(invoiceId);
  data = normalizeInvoice({ ...data, soId: existing.so_id });
  await validateInvoice(data);
  transition(existing.status, data.status);
  if (
    existing.status !== "draft" &&
    (String(existing.customer_id) !== String(data.customerId) ||
      String(existing.invoice_date).slice(0, 10) !== data.invoiceDate)
  )
    fail(
      "Confirmed, paid, or cancelled invoices cannot change customer or invoice date",
    );
  return model.update(invoiceId, data);
}
async function deleteInvoice(invoiceId) {
  const item = await getInvoice(invoiceId);
  if (item.status !== "draft") fail("Only draft invoices can be deleted");
  return model.remove(invoiceId);
}
async function editableInvoice(invoiceId) {
  const invoice = await getInvoice(invoiceId);
  if (invoice.status !== "draft")
    fail("Lines can only be changed on draft invoices");
  return invoice;
}
async function getLines(invoiceId) {
  await getInvoice(invoiceId);
  return model.getLines(invoiceId);
}
async function getLine(invoiceId, lineId) {
  await getInvoice(invoiceId);
  const line = await model.getLine(invoiceId, lineId);
  if (!line) fail("Invoice line not found for this invoice", 404);
  return line;
}
async function createLine(invoiceId, data) {
  await editableInvoice(invoiceId);
  data = normalizeLine(data);
  await validateLine(data);
  const line = await model.createLine(invoiceId, data);
  await model.refreshTotals(invoiceId);
  return line;
}
async function updateLine(invoiceId, lineId, data) {
  await editableInvoice(invoiceId);
  await getLine(invoiceId, lineId);
  data = normalizeLine(data);
  await validateLine(data);
  const line = await model.updateLine(invoiceId, lineId, data);
  await model.refreshTotals(invoiceId);
  return line;
}
async function deleteLine(invoiceId, lineId) {
  await editableInvoice(invoiceId);
  await getLine(invoiceId, lineId);
  const line = await model.removeLine(invoiceId, lineId);
  await model.refreshTotals(invoiceId);
  return line;
}
async function createFromSalesOrder(orderId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const order = await salesModel.getById(orderId, client);
    if (!order) fail("Sales order not found", 404);
    if (order.status !== "confirmed")
      fail("Only confirmed sales orders can be converted to an invoice");
    const existing = await client.query(
      "SELECT id FROM customer_invoices WHERE so_id = $1",
      [orderId],
    );
    if (existing.rows[0]) fail("Sales order already has an invoice", 409);
    const lines = (
      await client.query(
        "SELECT * FROM sales_order_lines WHERE sales_order_id = $1 ORDER BY id",
        [orderId],
      )
    ).rows;
    if (!lines.length)
      fail("Sales order must have at least one line before invoicing");
    const invoice = (
      await client.query(
        `INSERT INTO customer_invoices (invoice_number, so_id, customer_id, invoice_date, reference, status, subtotal, tax_total, grand_total) VALUES ($1, $2, $3, CURRENT_DATE, $4, 'draft', 0, 0, 0) RETURNING *`,
        [`INV-SO-${order.id}`, order.id, order.customer_id, order.so_number],
      )
    ).rows[0];
    for (const line of lines) {
      if (!line.account_id)
        fail("Sales order line requires an account before invoicing");
      await client.query(
        `INSERT INTO customer_invoice_lines (invoice_id, sales_order_line_id, product_id, analytic_account_id, account_id, tax_id, tax_rate, quantity, unit_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          invoice.id,
          line.id,
          line.product_id,
          line.analytic_account_id,
          line.account_id,
          line.tax_id,
          line.tax_rate,
          line.quantity,
          line.unit_price,
        ],
      );
    }
    await model.refreshTotals(invoice.id, client);
    const result = await model.getById(invoice.id, client);
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
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getLines,
  getLine,
  createLine,
  updateLine,
  deleteLine,
  createFromSalesOrder,
};
