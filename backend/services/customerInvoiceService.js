const { pool } = require("../config/db");
const model = require("../models/customerInvoiceModel");
const salesModel = require("../models/salesOrderModel");
const journalEntryModel = require("../models/journalEntryModel");
const journalEntryService = require("./journalEntryService");
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
async function validateInvoice(data, db = pool) {
  if (!(await model.activeCustomer(data.customerId, db)))
    fail("Customer not found, inactive, or not a customer");
  if (data.createdBy && !(await model.activeUser(data.createdBy, db)))
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
async function getInvoices(contactId) {
  return model.getAll(contactId);
}
async function getInvoice(invoiceId, contactId) {
  const item = contactId ? await model.getByIdForContact(invoiceId, contactId) : await model.getById(invoiceId);
  if (!item) fail("Customer invoice not found", 404);
  return item;
}
async function getInvoiceForPdf(invoiceId, contactId) {
  const item = contactId ? await model.getForPdfForContact(invoiceId, contactId) : await model.getForPdf(invoiceId);
  if (!item) fail("Customer invoice not found", 404);
  return item;
}
async function createInvoice(data) {
  data = normalizeInvoice(data);
  if (data.status !== "draft") fail("Customer invoices must be created as draft");
  await validateInvoice(data);
  const invoice = await model.create(data);
  return invoice;
}
async function updateInvoice(invoiceId, data) {
  const existing = await getInvoice(invoiceId);
  data = normalizeInvoice({ ...data, soId: existing.so_id });
  if (existing.status === "draft" && data.status === "confirmed") {
    return confirmInvoice(invoiceId, data);
  }
  if (data.status === "confirmed") {
    fail("Only draft invoices can be confirmed", 409);
  }
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

async function confirmInvoice(invoiceId, data) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const invoice = await model.getForUpdate(invoiceId, client);
    if (!invoice) fail("Customer invoice not found", 404);
    if (invoice.status === "cancelled") fail("Cancelled invoices cannot be confirmed", 409);
    if (invoice.status !== "draft") fail("Only draft invoices can be confirmed", 409);
    if (await journalEntryModel.getBySource("invoice", invoiceId, client)) {
      fail("Customer invoice already has a journal entry", 409);
    }

    await validateInvoice(data, client);
    const lines = await model.getLines(invoiceId, client);
    if (!lines.length) fail("Customer invoice must have at least one line before confirmation");

    const salesJournal = (await client.query(
      `SELECT j.id, j.default_account_id
       FROM journals j
       JOIN chart_of_accounts a ON a.id = j.default_account_id
       WHERE j.journal_type = 'sales' AND j.is_active = true AND a.is_active = true
       ORDER BY j.id LIMIT 1`,
    )).rows[0];
    if (!salesJournal) fail("An active Sales Journal with an active default account is required", 404);

    const incomeTotals = new Map();
    const taxTotals = new Map();
    for (const line of lines) {
      const incomeAccount = await client.query(
        "SELECT id, account_type, is_active FROM chart_of_accounts WHERE id = $1",
        [line.account_id],
      );
      if (!incomeAccount.rows[0] || !incomeAccount.rows[0].is_active) {
        fail("Invoice line account not found or inactive", 404);
      }
      if (incomeAccount.rows[0].account_type !== "income") {
        fail("Customer invoice line account must be an income account");
      }
      if (line.analytic_account_id && !await model.activeAnalytic(line.analytic_account_id, client)) {
        fail("Invoice line analytic account not found or inactive", 404);
      }
      const incomeKey = `${line.account_id}:${line.analytic_account_id || ""}`;
      incomeTotals.set(incomeKey, {
        accountId: line.account_id,
        analyticAccountId: line.analytic_account_id,
        amount: Number(incomeTotals.get(incomeKey)?.amount || 0) + Number(line.line_subtotal),
      });

      let tax = null;
      if (line.tax_id) {
        tax = await model.activeTax(line.tax_id, client);
        if (!tax) fail("Invoice line tax configuration or sales tax account is inactive", 404);
      }
      if (Number(line.tax_amount) > 0) {
        if (!tax) fail("Invoice line tax amount requires a tax configuration");
        taxTotals.set(tax.sales_tax_account_id, {
          accountId: tax.sales_tax_account_id,
          amount: Number(taxTotals.get(tax.sales_tax_account_id)?.amount || 0) + Number(line.tax_amount),
        });
      }
    }

    const refreshedInvoice = await model.refreshTotals(invoiceId, client);
    if (Number(refreshedInvoice.grand_total) <= 0) fail("Customer invoice total must be greater than zero before confirmation");
    const entryData = {
      entryNumber: `INV-${invoice.id}`,
      journalId: salesJournal.id,
      accountingDate: String(data.invoiceDate),
      reference: data.reference || invoice.invoice_number,
      sourceType: "invoice",
      sourceId: invoice.id,
      status: "posted",
      createdBy: data.createdBy,
    };
    await journalEntryService.validateEntry(entryData, client);
    const entry = await journalEntryModel.create(entryData, client);

    const debitLine = {
      accountId: salesJournal.default_account_id,
      partnerId: data.customerId,
      analyticAccountId: null,
      description: `Invoice ${invoice.invoice_number}`,
      debit: Number(refreshedInvoice.grand_total),
      credit: 0,
    };
    await journalEntryService.validateLine(debitLine, client);
    await journalEntryModel.createLine(entry.id, debitLine, client);
    for (const income of incomeTotals.values()) {
      const creditLine = {
        accountId: income.accountId,
        partnerId: data.customerId,
        analyticAccountId: income.analyticAccountId,
        description: `Invoice ${invoice.invoice_number}`,
        debit: 0,
        credit: income.amount,
      };
      await journalEntryService.validateLine(creditLine, client);
      await journalEntryModel.createLine(entry.id, creditLine, client);
    }
    for (const tax of taxTotals.values()) {
      const taxLine = {
        accountId: tax.accountId,
        partnerId: data.customerId,
        analyticAccountId: null,
        description: `Tax for invoice ${invoice.invoice_number}`,
        debit: 0,
        credit: tax.amount,
      };
      await journalEntryService.validateLine(taxLine, client);
      await journalEntryModel.createLine(entry.id, taxLine, client);
    }
    await journalEntryService.assertBalanced(entry.id, client);

    const confirmedInvoice = await model.update(invoiceId, data, client);
    await client.query("COMMIT");
    return confirmedInvoice;
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505" && error.constraint === "journal_entries_entry_number_key") {
      error.code = undefined;
      error.statusCode = 409;
      error.message = "A journal entry already uses the generated invoice entry number";
    }
    throw error;
  } finally {
    client.release();
  }
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
async function getLines(invoiceId, contactId) {
  await getInvoice(invoiceId, contactId);
  return model.getLines(invoiceId);
}
async function getLine(invoiceId, lineId, contactId) {
  await getInvoice(invoiceId, contactId);
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
  getInvoiceForPdf,
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
