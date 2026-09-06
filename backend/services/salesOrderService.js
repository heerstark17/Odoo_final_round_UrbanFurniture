const model = require("../models/salesOrderModel");
const invoiceService = require("./customerInvoiceService");

const STATUSES = ["draft", "confirmed", "cancelled"];
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
function normalizeOrder(data = {}, actorId) {
  const status = String(data.status ?? "draft").toLowerCase();
  if (!STATUSES.includes(status))
    fail("Status must be draft, confirmed, or cancelled");
  const soNumber = String(data.soNumber || data.so_number || "").trim();
  if (!soNumber)
    fail("Sales order number is required");
  return {
    soNumber,
    customerId: id(data.customerId ?? data.customer_id, "Customer", true),
    orderDate: date(
      data.orderDate ?? data.order_date ?? new Date().toISOString().slice(0, 10),
      "Order date",
    ),
    status,
    notes: data.notes == null ? null : String(data.notes).trim() || null,
    createdBy: id(actorId, "Created by", true),
  };
}
function normalizeLine(data = {}) {
  return {
    productId: id(data.productId, "Product", true),
    analyticAccountId: id(data.analyticAccountId, "Analytic account"),
    accountId: id(data.accountId, "Account"),
    taxId: id(data.taxId, "Tax"),
    quantity: decimal(data.quantity, "Quantity", 0.0000001),
    unitPrice: decimal(data.unitPrice, "Unit price", 0),
  };
}
async function validateOrder(data) {
  if (!(await model.activeCustomer(data.customerId)))
    fail("Customer not found, inactive, or not a customer");
  if (data.createdBy && !(await model.activeUser(data.createdBy)))
    fail("Created by user not found or inactive");
}
async function validateLine(data) {
  if (!(await model.activeProduct(data.productId)))
    fail("Product not found or inactive");
  if (data.taxId) {
    const tax = await model.activeTax(data.taxId);
    if (!tax) fail("Tax not found or inactive");
    data.taxRate = Number(tax.rate);
  } else data.taxRate = 0;
  if (
    data.analyticAccountId &&
    !(await model.activeAnalytic(data.analyticAccountId))
  )
    fail("Analytic account not found or inactive");
  if (data.accountId && !(await model.activeAccount(data.accountId)))
    fail("Account not found or inactive");
}
function transition(existing, next) {
  if (existing === next) return;
  if (existing === "draft" && ["confirmed", "cancelled"].includes(next)) return;
  fail(`Invalid sales order status transition from ${existing} to ${next}`);
}
async function getSalesOrders(contactId) {
  return model.getAll(contactId);
}
async function getSalesOrder(id, contactId) {
  const item = contactId ? await model.getByIdForContact(id, contactId) : await model.getById(id);
  if (!item) fail("Sales order not found", 404);
  item.lines = await model.getLines(id);
  return item;
}
async function createSalesOrder(data, actorId) {
  const lines = Array.isArray(data.lines) ? data.lines : [];
  const orderData = normalizeOrder(data, actorId);
  await validateOrder(orderData);
  const created = await model.create(orderData);
  if (lines.length > 0) {
    for (const l of lines) {
      const lineData = normalizeLine(l);
      await validateLine(lineData);
      await model.createLine(created.id, lineData);
    }
  }
  return model.getById(created.id);
}
async function updateSalesOrder(orderId, data, actorId) {
  const existing = await getSalesOrder(orderId);
  data = normalizeOrder(data, actorId);
  await validateOrder(data);
  transition(existing.status, data.status);
  if (
    existing.status !== "draft" &&
    (existing.customer_id !== String(data.customerId) ||
      existing.order_date.toISOString?.().slice(0, 10) !== data.orderDate)
  )
    fail("Confirmed or cancelled sales orders cannot change customer or date");
  return model.update(orderId, data);
}
async function deleteSalesOrder(id) {
  const existing = await getSalesOrder(id);
  if (existing.status !== "draft")
    fail("Only draft sales orders can be deleted");
  return model.remove(id);
}
async function editableOrder(id) {
  const order = await getSalesOrder(id);
  if (order.status !== "draft")
    fail("Lines can only be changed on draft sales orders");
  return order;
}
async function getLines(orderId, contactId) {
  await getSalesOrder(orderId, contactId);
  return model.getLines(orderId);
}
async function getLine(orderId, lineId, contactId) {
  await getSalesOrder(orderId, contactId);
  const line = await model.getLine(orderId, lineId);
  if (!line) fail("Sales order line not found for this sales order", 404);
  return line;
}
async function createLine(orderId, data) {
  await editableOrder(orderId);
  data = normalizeLine(data);
  await validateLine(data);
  return model.createLine(orderId, data);
}
async function updateLine(orderId, lineId, data) {
  await editableOrder(orderId);
  await getLine(orderId, lineId);
  data = normalizeLine(data);
  await validateLine(data);
  return model.updateLine(orderId, lineId, data);
}
async function deleteLine(orderId, lineId) {
  await editableOrder(orderId);
  await getLine(orderId, lineId);
  return model.removeLine(orderId, lineId);
}
async function convertToInvoice(orderId, actorId) {
  return invoiceService.createFromSalesOrder(orderId, actorId);
}
module.exports = {
  getSalesOrders,
  getSalesOrder,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  getLines,
  getLine,
  createLine,
  updateLine,
  deleteLine,
  convertToInvoice,
};
