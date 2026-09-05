const { pool } = require("../config/db");

const entrySelect = `SELECT je.*, j.journal_name, j.journal_type,
    u.full_name AS created_by_name
    FROM journal_entries je
    JOIN journals j ON j.id = je.journal_id
    LEFT JOIN users u ON u.id = je.created_by`;
const lineSelect = `SELECT jel.*, a.account_code, a.account_name,
    p.name AS partner_name, aa.name AS analytic_account_name
    FROM journal_entry_lines jel
    JOIN chart_of_accounts a ON a.id = jel.account_id
    LEFT JOIN contacts p ON p.id = jel.partner_id
    LEFT JOIN analytic_accounts aa ON aa.id = jel.analytic_account_id`;

async function getAll(db = pool) {
  return (await db.query(`${entrySelect} ORDER BY je.id DESC`)).rows;
}
async function getById(id, db = pool) {
  return (await db.query(`${entrySelect} WHERE je.id = $1`, [id])).rows[0];
}
async function getForUpdate(id, db) {
  return (await db.query("SELECT * FROM journal_entries WHERE id = $1 FOR UPDATE", [id])).rows[0];
}
async function getBySource(sourceType, sourceId, db = pool) {
  return (await db.query(
    "SELECT * FROM journal_entries WHERE source_type = $1 AND source_id = $2",
    [sourceType, sourceId],
  )).rows[0];
}
async function create(data, db = pool) {
  return (await db.query(
    `INSERT INTO journal_entries
      (entry_number, journal_id, accounting_date, reference, source_type, source_id, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [data.entryNumber, data.journalId, data.accountingDate, data.reference,
      data.sourceType, data.sourceId, data.status, data.createdBy],
  )).rows[0];
}
async function update(id, data, db = pool) {
  return (await db.query(
    `UPDATE journal_entries SET entry_number = $1, journal_id = $2,
       accounting_date = $3, reference = $4, source_type = $5, source_id = $6,
       status = $7, created_by = $8, updated_at = NOW()
     WHERE id = $9 RETURNING *`,
    [data.entryNumber, data.journalId, data.accountingDate, data.reference,
      data.sourceType, data.sourceId, data.status, data.createdBy, id],
  )).rows[0];
}
async function remove(id, db = pool) {
  return (await db.query("DELETE FROM journal_entries WHERE id = $1 RETURNING *", [id])).rows[0];
}
async function getLines(journalEntryId, db = pool) {
  return (await db.query(`${lineSelect} WHERE jel.journal_entry_id = $1 ORDER BY jel.id DESC`, [journalEntryId])).rows;
}
async function getLineById(journalEntryId, id, db = pool) {
  return (await db.query(`${lineSelect} WHERE jel.journal_entry_id = $1 AND jel.id = $2`, [journalEntryId, id])).rows[0];
}
async function createLine(journalEntryId, data, db = pool) {
  return (await db.query(
    `INSERT INTO journal_entry_lines
      (journal_entry_id, account_id, partner_id, analytic_account_id, description, debit, credit)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [journalEntryId, data.accountId, data.partnerId, data.analyticAccountId,
      data.description, data.debit, data.credit],
  )).rows[0];
}
async function updateLine(journalEntryId, id, data, db = pool) {
  return (await db.query(
    `UPDATE journal_entry_lines SET account_id = $1, partner_id = $2,
       analytic_account_id = $3, description = $4, debit = $5, credit = $6
     WHERE journal_entry_id = $7 AND id = $8 RETURNING *`,
    [data.accountId, data.partnerId, data.analyticAccountId, data.description,
      data.debit, data.credit, journalEntryId, id],
  )).rows[0];
}
async function deleteLine(journalEntryId, id, db = pool) {
  return (await db.query(
    "DELETE FROM journal_entry_lines WHERE journal_entry_id = $1 AND id = $2 RETURNING *",
    [journalEntryId, id],
  )).rows[0];
}
async function calculateTotals(journalEntryId, db = pool) {
  return (await db.query(
    `SELECT COALESCE(SUM(debit), 0)::NUMERIC(14,2) AS total_debit,
            COALESCE(SUM(credit), 0)::NUMERIC(14,2) AS total_credit,
            COUNT(*)::INTEGER AS line_count
     FROM journal_entry_lines WHERE journal_entry_id = $1`,
    [journalEntryId],
  )).rows[0];
}
async function activeJournal(id, db = pool) {
  return (await db.query("SELECT id FROM journals WHERE id = $1 AND is_active = true", [id])).rows[0];
}
async function activeAccount(id, db = pool) {
  return (await db.query("SELECT id FROM chart_of_accounts WHERE id = $1 AND is_active = true", [id])).rows[0];
}
async function activeAnalyticAccount(id, db = pool) {
  return (await db.query("SELECT id FROM analytic_accounts WHERE id = $1 AND is_active = true", [id])).rows[0];
}
async function activeContact(id, db = pool) {
  return (await db.query("SELECT id FROM contacts WHERE id = $1 AND is_active = true", [id])).rows[0];
}
async function activeUser(id, db = pool) {
  return (await db.query("SELECT id FROM users WHERE id = $1 AND is_active = true", [id])).rows[0];
}
async function sourceExists(sourceType, sourceId, db = pool) {
  const tables = { invoice: "customer_invoices", bill: "vendor_bills", payment: "payments" };
  if (!tables[sourceType]) return true;
  return (await db.query(`SELECT id FROM ${tables[sourceType]} WHERE id = $1`, [sourceId])).rows[0];
}

module.exports = { getAll, getById, getForUpdate, getBySource, create, update, remove, getLines,
  getLineById, createLine, updateLine, deleteLine, calculateTotals, activeJournal,
  activeAccount, activeAnalyticAccount, activeContact, activeUser, sourceExists };
