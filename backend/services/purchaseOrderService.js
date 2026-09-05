const model = require("../models/purchaseOrderModel");
const billService = require("./vendorBillService");

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
  if (!Number.isInteger(parsed) || parsed <= 0) fail(`${label} must be a valid ID`);
  return parsed;
}

function date(value, label) {
  if (!value || Number.isNaN(Date.parse(value))) fail(`${label} is required and must be a valid date`);
  return String(value).slice(0, 10);
}

function decimal(value, label, minimum) {
  if (value === undefined || value === null || value === "" || !Number.isFinite(Number(value)) || Number(value) < minimum) {
    fail(`${label} must be ${minimum === 0 ? "zero or greater" : "greater than zero"}`);
  }
  return Number(value);
}

function normalizeOrder(data = {}) {
  const status = String(data.status ?? "draft").toLowerCase();
  if (!STATUSES.includes(status)) fail("Status must be draft, confirmed, or cancelled");
  if (typeof data.poNumber !== "string" || !data.poNumber.trim()) fail("Purchase order number is required");
  return {
    poNumber: data.poNumber.trim(),
    vendorId: id(data.vendorId, "Vendor", true),
    orderDate: date(data.orderDate ?? new Date().toISOString().slice(0, 10), "Order date"),
    status,
    notes: data.notes == null ? null : String(data.notes).trim() || null,
    createdBy: id(data.createdBy, "Created by"),
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
  if (!(await model.activeVendor(data.vendorId))) fail("Vendor not found, inactive, or not a vendor");
  if (data.createdBy && !(await model.activeUser(data.createdBy))) fail("Created by user not found or inactive");
}

async function validateLine(data) {
  if (!(await model.activeProduct(data.productId))) fail("Product not found or inactive");
  if (data.analyticAccountId && !(await model.activeAnalytic(data.analyticAccountId))) fail("Analytic account not found or inactive");
  if (data.accountId && !(await model.activeAccount(data.accountId))) fail("Account not found or inactive");
  if (data.taxId) {
    const tax = await model.activeTax(data.taxId);
    if (!tax) fail("Tax not found or inactive");
    data.taxRate = Number(tax.rate);
  } else data.taxRate = 0;
}

function transition(existing, next) {
  if (existing === next) return;
  if (existing === "draft" && ["confirmed", "cancelled"].includes(next)) return;
  fail(`Invalid purchase order status transition from ${existing} to ${next}`);
}

async function getPurchaseOrders(contactId) { return model.getAll(contactId); }
async function getPurchaseOrder(orderId, contactId) {
  const item = contactId ? await model.getByIdForContact(orderId, contactId) : await model.getById(orderId);
  if (!item) fail("Purchase order not found", 404);
  return item;
}
async function createPurchaseOrder(data) {
  data = normalizeOrder(data);
  await validateOrder(data);
  return model.create(data);
}
async function updatePurchaseOrder(orderId, data) {
  const existing = await getPurchaseOrder(orderId);
  data = normalizeOrder(data);
  await validateOrder(data);
  transition(existing.status, data.status);
  if (existing.status !== "draft" && (String(existing.vendor_id) !== String(data.vendorId) || String(existing.order_date).slice(0, 10) !== data.orderDate)) {
    fail("Confirmed or cancelled purchase orders cannot change vendor or date");
  }
  return model.update(orderId, data);
}
async function deletePurchaseOrder(orderId) {
  const item = await getPurchaseOrder(orderId);
  if (item.status !== "draft") fail("Only draft purchase orders can be deleted");
  return model.remove(orderId);
}
async function editableOrder(orderId) {
  const item = await getPurchaseOrder(orderId);
  if (item.status !== "draft") fail("Lines can only be changed on draft purchase orders");
  return item;
}
async function getLines(orderId, contactId) { await getPurchaseOrder(orderId, contactId); return model.getLines(orderId); }
async function getLine(orderId, lineId, contactId) {
  await getPurchaseOrder(orderId, contactId);
  const line = await model.getLine(orderId, lineId);
  if (!line) fail("Purchase order line not found for this purchase order", 404);
  return line;
}
async function createLine(orderId, data) { await editableOrder(orderId); data = normalizeLine(data); await validateLine(data); return model.createLine(orderId, data); }
async function updateLine(orderId, lineId, data) { await editableOrder(orderId); await getLine(orderId, lineId); data = normalizeLine(data); await validateLine(data); return model.updateLine(orderId, lineId, data); }
async function deleteLine(orderId, lineId) { await editableOrder(orderId); await getLine(orderId, lineId); return model.removeLine(orderId, lineId); }
async function convertToBill(orderId) { return billService.createFromPurchaseOrder(orderId); }

module.exports = {
  getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder,
  deletePurchaseOrder, getLines, getLine, createLine, updateLine, deleteLine,
  convertToBill,
};
