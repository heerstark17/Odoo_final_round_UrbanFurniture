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

function normalizeOrder(data = {}, actorId) {
  const status = String(data.status ?? "draft").toLowerCase();
  if (!STATUSES.includes(status)) fail("Status must be draft, confirmed, or cancelled");
  const poNumber = String(data.poNumber || data.po_number || "").trim();
  if (!poNumber) fail("Purchase order number is required");
  return {
    poNumber,
    vendorId: id(data.vendorId ?? data.vendor_id, "Vendor", true),
    orderDate: date(data.orderDate ?? data.order_date ?? new Date().toISOString().slice(0, 10), "Order date"),
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
  item.lines = await model.getLines(orderId);
  return item;
}
async function createPurchaseOrder(data, actorId) {
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
async function updatePurchaseOrder(orderId, data, actorId, contactId = null) {
  const existing = await getPurchaseOrder(orderId, contactId);
  data = normalizeOrder(data, actorId);
  await validateOrder(data);
  transition(existing.status, data.status);
  if (existing.status !== "draft" && (String(existing.vendor_id) !== String(data.vendorId) || String(existing.order_date).slice(0, 10) !== data.orderDate)) {
    fail("Confirmed or cancelled purchase orders cannot change vendor or date");
  }
  return model.update(orderId, data);
}
async function deletePurchaseOrder(orderId, contactId = null) {
  const item = await getPurchaseOrder(orderId, contactId);
  if (item.status !== "draft") fail("Only draft purchase orders can be deleted");
  return model.remove(orderId);
}
async function editableOrder(orderId, contactId = null) {
  const item = await getPurchaseOrder(orderId, contactId);
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
async function createLine(orderId, data, contactId = null) {
  await editableOrder(orderId, contactId);
  data = normalizeLine(data);
  await validateLine(data);
  return model.createLine(orderId, data);
}
async function updateLine(orderId, lineId, data, contactId = null) {
  await editableOrder(orderId, contactId);
  await getLine(orderId, lineId, contactId);
  data = normalizeLine(data);
  await validateLine(data);
  return model.updateLine(orderId, lineId, data);
}
async function deleteLine(orderId, lineId, contactId = null) {
  await editableOrder(orderId, contactId);
  await getLine(orderId, lineId, contactId);
  return model.removeLine(orderId, lineId);
}
async function convertToBill(orderId) { return billService.createFromPurchaseOrder(orderId); }

module.exports = {
  getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder,
  deletePurchaseOrder, getLines, getLine, createLine, updateLine, deleteLine,
  convertToBill,
};
