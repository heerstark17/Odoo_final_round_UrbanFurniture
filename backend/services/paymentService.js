const { pool } = require("../config/db");
const model = require("../models/paymentModel");
const journalEntryModel = require("../models/journalEntryModel");
const journalEntryService = require("./journalEntryService");

const STATUSES = ["draft", "posted", "cancelled"];
const METHODS = ["cash", "bank"];

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
  if (!Number.isInteger(parsed) || parsed <= 0) {
    fail(`${label} must be a valid ID`);
  }
  return parsed;
}

function date(value, label) {
  if (!value || Number.isNaN(Date.parse(value))) {
    fail(`${label} is required and must be a valid date`);
  }
  return String(value).slice(0, 10);
}

function amount(value) {
  if (value === undefined || value === null || value === "" || !Number.isFinite(Number(value)) || Number(value) <= 0) {
    fail("Payment amount must be greater than zero");
  }
  return Number(value);
}

function normalizePayment(data = {}) {
  const invoiceId = id(data.invoiceId, "Invoice");
  const billId = id(data.billId, "Vendor bill");

  if ((invoiceId && billId) || (!invoiceId && !billId)) {
    fail("Provide exactly one of invoiceId or billId");
  }

  if (typeof data.paymentNumber !== "string" || !data.paymentNumber.trim()) {
    fail("Payment number is required");
  }

  const status = String(data.status ?? "posted").toLowerCase();
  if (!STATUSES.includes(status)) {
    fail("Status must be draft, posted, or cancelled");
  }

  const method = String(data.method ?? "").toLowerCase();
  if (!METHODS.includes(method)) {
    fail("Method must be cash or bank");
  }

  return {
    paymentNumber: data.paymentNumber.trim(),
    customerId: id(data.customerId, "Customer", Boolean(invoiceId)),
    invoiceId,
    vendorId: id(data.vendorId, "Vendor", Boolean(billId)),
    billId,
    paymentDate: date(
      data.paymentDate ?? new Date().toISOString().slice(0, 10),
      "Payment date",
    ),
    direction: String(data.direction ?? "").toLowerCase(),
    method,
    amount: amount(data.amount),
    reference:
      data.reference == null ? null : String(data.reference).trim() || null,
    status,
    createdBy: id(data.createdBy, "Created by"),
  };
}

async function validatePayment(data, excludePaymentId, db) {
  if (data.createdBy && !(await model.activeUser(data.createdBy, db))) {
    fail("Created by user not found or inactive");
  }

  if (data.invoiceId) {
    if (data.direction !== "in") {
      fail("Customer invoice payments must use direction 'in'");
    }

    const invoice = await model.getInvoiceForUpdate(data.invoiceId, db);
    if (!invoice) fail("Customer invoice not found", 404);
    if (invoice.status === "cancelled") fail("Cancelled customer invoices cannot receive payments");
    if (invoice.status !== "confirmed") fail("Only confirmed customer invoices can receive payments");
    if (String(invoice.customer_id) !== String(data.customerId)) {
      fail("Payment customer must match the invoice customer");
    }

    const paidTotal = Number(
      await model.getPostedTotalForInvoice(data.invoiceId, excludePaymentId, db),
    );
    const outstanding = Number(invoice.grand_total) - paidTotal;
    if (outstanding <= 0) fail("Customer invoice has no outstanding amount");
    if (data.amount > outstanding) {
      fail("Payment amount cannot exceed the invoice outstanding amount");
    }
    return;
  }

  if (data.direction !== "out") {
    fail("Vendor bill payments must use direction 'out'");
  }

  const bill = await model.getBillForUpdate(data.billId, db);
  if (!bill) fail("Vendor bill not found", 404);
  if (bill.status === "cancelled") fail("Cancelled vendor bills cannot receive payments");
  if (bill.status !== "confirmed") fail("Only confirmed vendor bills can receive payments");
  if (String(bill.vendor_id) !== String(data.vendorId)) {
    fail("Payment vendor must match the vendor bill vendor");
  }

  const paidTotal = Number(
    await model.getPostedTotalForBill(data.billId, excludePaymentId, db),
  );
  const outstanding = Number(bill.grand_total) - paidTotal;
  if (outstanding <= 0) fail("Vendor bill has no outstanding amount");
  if (data.amount > outstanding) {
    fail("Payment amount cannot exceed the vendor bill outstanding amount");
  }
}

async function getPayments() {
  return model.getAll();
}

async function getPayment(paymentId) {
  const payment = await model.getById(paymentId);
  if (!payment) fail("Payment not found", 404);
  return payment;
}

async function createPayment(data) {
  data = normalizePayment(data);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await validatePayment(data, null, client);
    const payment = await model.create(data, client);
    if (isPostedPayment(data)) {
      await createPaymentJournalEntry(payment, data, client);
    }
    await client.query("COMMIT");
    return payment;
  } catch (error) {
    await client.query("ROLLBACK");
    translateJournalEntryConflict(error);
    throw error;
  } finally {
    client.release();
  }
}

async function updatePayment(paymentId, data) {
  data = normalizePayment(data);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const existing = await model.getForUpdate(paymentId, client);
    if (!existing) fail("Payment not found", 404);
    if (isPostedPayment(existing)) {
      fail("Posted payments cannot be modified", 409);
    }
    await validatePayment(data, existing.id, client);
    const payment = await model.update(paymentId, data, client);
    if (isPostedPayment(data)) {
      if (await journalEntryModel.getBySource("payment", payment.id, client)) {
        fail("Payment already has a journal entry", 409);
      }
      await createPaymentJournalEntry(payment, data, client);
    }
    await client.query("COMMIT");
    return payment;
  } catch (error) {
    await client.query("ROLLBACK");
    translateJournalEntryConflict(error);
    throw error;
  } finally {
    client.release();
  }
}

function isPostedPayment(data) {
  return data.status === "posted" && (
    (data.invoiceId ?? data.invoice_id) != null ||
    (data.billId ?? data.bill_id) != null
  );
}

function translateJournalEntryConflict(error) {
  if (error.code === "23505" && error.constraint === "journal_entries_entry_number_key") {
    error.code = undefined;
    error.statusCode = 409;
    error.message = "A journal entry already uses the generated payment entry number";
  }
}

async function createPaymentJournalEntry(payment, data, client) {
  if (await journalEntryModel.getBySource("payment", payment.id, client)) {
    fail("Payment already has a journal entry", 409);
  }
  const paymentJournal = (await client.query(
    `SELECT j.id, j.default_account_id
     FROM journals j
     JOIN chart_of_accounts a ON a.id = j.default_account_id
     WHERE j.journal_type = $1 AND j.is_active = true AND a.is_active = true
     ORDER BY j.id LIMIT 1`,
    [data.method],
  )).rows[0];
  if (!paymentJournal) fail(`An active ${data.method} journal with an active default account is required`, 404);

  const counterpartJournalType = data.direction === "in" ? "sales" : "purchase";
  const counterpartJournal = (await client.query(
    `SELECT j.default_account_id
     FROM journals j
     JOIN chart_of_accounts a ON a.id = j.default_account_id
     WHERE j.journal_type = $1 AND j.is_active = true AND a.is_active = true
     ORDER BY j.id LIMIT 1`,
    [counterpartJournalType],
  )).rows[0];
  if (!counterpartJournal) {
    fail(`An active ${data.direction === "in" ? "Sales" : "Purchase"} Journal with an active default account is required`, 404);
  }

  const entryData = {
    entryNumber: `PAY-${payment.id}`,
    journalId: paymentJournal.id,
    accountingDate: data.paymentDate,
    reference: data.reference || payment.payment_number,
    sourceType: "payment",
    sourceId: payment.id,
    status: "posted",
    createdBy: data.createdBy,
  };
  await journalEntryService.validateEntry(entryData, client);
  const entry = await journalEntryModel.create(entryData, client);
  const isCustomerPayment = data.direction === "in";
  const partnerId = isCustomerPayment ? data.customerId : data.vendorId;
  const paymentLine = {
    accountId: paymentJournal.default_account_id,
    partnerId,
    analyticAccountId: null,
    description: `${isCustomerPayment ? "Customer" : "Vendor"} payment ${payment.payment_number}`,
    debit: isCustomerPayment ? data.amount : 0,
    credit: isCustomerPayment ? 0 : data.amount,
  };
  const counterpartLine = {
    accountId: counterpartJournal.default_account_id,
    partnerId,
    analyticAccountId: null,
    description: `${isCustomerPayment ? "Customer" : "Vendor"} payment ${payment.payment_number}`,
    debit: isCustomerPayment ? 0 : data.amount,
    credit: isCustomerPayment ? data.amount : 0,
  };
  await journalEntryService.validateLine(paymentLine, client);
  await journalEntryModel.createLine(entry.id, paymentLine, client);
  await journalEntryService.validateLine(counterpartLine, client);
  await journalEntryModel.createLine(entry.id, counterpartLine, client);
  await journalEntryService.assertBalanced(entry.id, client);
}

async function deletePayment(paymentId) {
  const payment = await getPayment(paymentId);
  if (isPostedPayment(payment)) {
    fail("Posted payments cannot be deleted", 409);
  }
  return model.remove(paymentId);
}

module.exports = {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
};
