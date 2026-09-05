const { pool } = require("../config/db");
const model = require("../models/journalEntryModel");

const STATUSES = ["draft", "posted", "cancelled"];
const SOURCE_TYPES = ["invoice", "bill", "payment", "manual"];

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
function date(value) {
  if (!value || Number.isNaN(Date.parse(value))) fail("Accounting date is required and must be a valid date");
  return String(value).slice(0, 10);
}
function amount(value, label) {
  if (value === undefined || value === null || value === "") return 0;
  if (!Number.isFinite(Number(value)) || Number(value) < 0) fail(`${label} must be a non-negative number`);
  return Number(value);
}
function normalizeEntry(data = {}) {
  if (typeof data.entryNumber !== "string" || !data.entryNumber.trim()) fail("Entry number is required");
  const sourceType = String(data.sourceType ?? "manual").toLowerCase();
  if (!SOURCE_TYPES.includes(sourceType)) fail("Source type must be invoice, bill, payment, or manual");
  const sourceId = id(data.sourceId, "Source");
  if (sourceType !== "manual" && !sourceId) fail("Source is required for invoice, bill, or payment entries");
  const status = String(data.status ?? "draft").toLowerCase();
  if (!STATUSES.includes(status)) fail("Status must be draft, posted, or cancelled");
  return { entryNumber: data.entryNumber.trim(), journalId: id(data.journalId, "Journal", true),
    accountingDate: date(data.accountingDate ?? new Date().toISOString().slice(0, 10)),
    reference: data.reference == null ? null : String(data.reference).trim() || null,
    sourceType, sourceId, status, createdBy: id(data.createdBy, "Created by") };
}
function normalizeLine(data = {}) {
  const debit = amount(data.debit, "Debit");
  const credit = amount(data.credit, "Credit");
  if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
    fail("A journal entry line must have either a positive debit or a positive credit, but not both");
  }
  return { accountId: id(data.accountId, "Account", true), partnerId: id(data.partnerId, "Partner"),
    analyticAccountId: id(data.analyticAccountId, "Analytic account"),
    description: data.description == null ? null : String(data.description).trim() || null,
    debit, credit };
}
async function validateEntry(data, db) {
  if (!await model.activeJournal(data.journalId, db)) fail("Journal not found or inactive", 404);
  if (data.createdBy && !await model.activeUser(data.createdBy, db)) fail("Created by user not found or inactive", 404);
  if (data.sourceId && !await model.sourceExists(data.sourceType, data.sourceId, db)) fail(`${data.sourceType[0].toUpperCase()}${data.sourceType.slice(1)} source not found`, 404);
}
async function validateLine(data, db) {
  if (!await model.activeAccount(data.accountId, db)) fail("Account not found or inactive", 404);
  if (data.analyticAccountId && !await model.activeAnalyticAccount(data.analyticAccountId, db)) fail("Analytic account not found or inactive", 404);
  if (data.partnerId && !await model.activeContact(data.partnerId, db)) fail("Partner not found or inactive", 404);
}
async function assertBalanced(journalEntryId, db) {
  const totals = await model.calculateTotals(journalEntryId, db);
  if (Number(totals.line_count) === 0 || Number(totals.total_debit) <= 0 || Number(totals.total_debit) !== Number(totals.total_credit)) {
    fail("A posted journal entry must contain balanced debit and credit totals");
  }
}
async function getJournalEntries() { return model.getAll(); }
async function getJournalEntry(journalEntryId) {
  const entry = await model.getById(journalEntryId);
  if (!entry) fail("Journal entry not found", 404);
  return entry;
}
async function createJournalEntry(data) {
  data = normalizeEntry(data);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await validateEntry(data, client);
    if (data.status === "posted") fail("Create journal entries as draft, add balanced lines, then post the entry");
    const entry = await model.create(data, client);
    await client.query("COMMIT");
    return entry;
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}
async function updateJournalEntry(journalEntryId, data) {
  data = normalizeEntry(data);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await model.getForUpdate(journalEntryId, client);
    if (!existing) fail("Journal entry not found", 404);
    if (existing.status !== "draft") fail("Only draft journal entries can be modified", 409);
    await validateEntry(data, client);
    if (data.status === "posted") await assertBalanced(journalEntryId, client);
    const entry = await model.update(journalEntryId, data, client);
    await client.query("COMMIT");
    return entry;
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}
async function deleteJournalEntry(journalEntryId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const entry = await model.getForUpdate(journalEntryId, client);
    if (!entry) fail("Journal entry not found", 404);
    if (entry.status !== "draft") fail("Only draft journal entries can be deleted", 409);
    const removed = await model.remove(journalEntryId, client);
    await client.query("COMMIT");
    return removed;
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}
async function editableEntry(journalEntryId, db) {
  const entry = await model.getForUpdate(journalEntryId, db);
  if (!entry) fail("Journal entry not found", 404);
  if (entry.status !== "draft") fail("Only draft journal entry lines can be modified", 409);
  return entry;
}
async function getLines(journalEntryId) { await getJournalEntry(journalEntryId); return model.getLines(journalEntryId); }
async function getLine(journalEntryId, lineId) {
  await getJournalEntry(journalEntryId);
  const line = await model.getLineById(journalEntryId, lineId);
  if (!line) fail("Journal entry line not found for this journal entry", 404);
  return line;
}
async function createLine(journalEntryId, data) {
  data = normalizeLine(data); const client = await pool.connect();
  try { await client.query("BEGIN"); await editableEntry(journalEntryId, client); await validateLine(data, client);
    const line = await model.createLine(journalEntryId, data, client); await client.query("COMMIT"); return line;
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}
async function updateLine(journalEntryId, lineId, data) {
  data = normalizeLine(data); const client = await pool.connect();
  try { await client.query("BEGIN"); await editableEntry(journalEntryId, client);
    if (!await model.getLineById(journalEntryId, lineId, client)) fail("Journal entry line not found for this journal entry", 404);
    await validateLine(data, client); const line = await model.updateLine(journalEntryId, lineId, data, client);
    await client.query("COMMIT"); return line;
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}
async function deleteLine(journalEntryId, lineId) {
  const client = await pool.connect();
  try { await client.query("BEGIN"); await editableEntry(journalEntryId, client);
    const line = await model.deleteLine(journalEntryId, lineId, client);
    if (!line) fail("Journal entry line not found for this journal entry", 404);
    await client.query("COMMIT"); return line;
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}
module.exports = { getJournalEntries, getJournalEntry, createJournalEntry, updateJournalEntry,
  deleteJournalEntry, getLines, getLine, createLine, updateLine, deleteLine,
  validateEntry, validateLine, assertBalanced };
