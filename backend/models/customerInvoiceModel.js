const { pool } = require("../config/db");

const lineSelect = `SELECT cil.*, p.name AS product_name, t.name AS tax_name
    FROM customer_invoice_lines cil JOIN products p ON p.id = cil.product_id
    LEFT JOIN taxes t ON t.id = cil.tax_id`;
async function getAll() {
  return (await pool.query("SELECT * FROM customer_invoices ORDER BY id DESC"))
    .rows;
}
async function getById(id, db = pool) {
  return (await db.query("SELECT * FROM customer_invoices WHERE id = $1", [id]))
    .rows[0];
}
async function create(data) {
  return (
    await pool.query(
      `INSERT INTO customer_invoices (invoice_number, so_id, customer_id, invoice_date, due_date, reference, status, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        data.invoiceNumber,
        data.soId,
        data.customerId,
        data.invoiceDate,
        data.dueDate,
        data.reference,
        data.status,
        data.createdBy,
      ],
    )
  ).rows[0];
}
async function update(id, data, db = pool) {
  return (
    await db.query(
      `UPDATE customer_invoices SET invoice_number = $1, customer_id = $2, invoice_date = $3, due_date = $4, reference = $5, status = $6, created_by = $7, updated_at = NOW() WHERE id = $8 RETURNING *`,
      [
        data.invoiceNumber,
        data.customerId,
        data.invoiceDate,
        data.dueDate,
        data.reference,
        data.status,
        data.createdBy,
        id,
      ],
    )
  ).rows[0];
}
async function remove(id) {
  return (
    await pool.query(
      "DELETE FROM customer_invoices WHERE id = $1 RETURNING *",
      [id],
    )
  ).rows[0];
}
async function getLines(invoiceId, db = pool) {
  return (
    await db.query(
      `${lineSelect} WHERE cil.invoice_id = $1 ORDER BY cil.id DESC`,
      [invoiceId],
    )
  ).rows;
}
async function getLine(invoiceId, id) {
  return (
    await pool.query(
      `${lineSelect} WHERE cil.invoice_id = $1 AND cil.id = $2`,
      [invoiceId, id],
    )
  ).rows[0];
}
async function createLine(invoiceId, data) {
  return (
    await pool.query(
      `INSERT INTO customer_invoice_lines (invoice_id, sales_order_line_id, product_id, analytic_account_id, account_id, tax_id, tax_rate, quantity, unit_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        invoiceId,
        data.salesOrderLineId,
        data.productId,
        data.analyticAccountId,
        data.accountId,
        data.taxId,
        data.taxRate,
        data.quantity,
        data.unitPrice,
      ],
    )
  ).rows[0];
}
async function updateLine(invoiceId, id, data) {
  return (
    await pool.query(
      `UPDATE customer_invoice_lines SET product_id = $1, analytic_account_id = $2, account_id = $3, tax_id = $4, tax_rate = $5, quantity = $6, unit_price = $7 WHERE invoice_id = $8 AND id = $9 RETURNING *`,
      [
        data.productId,
        data.analyticAccountId,
        data.accountId,
        data.taxId,
        data.taxRate,
        data.quantity,
        data.unitPrice,
        invoiceId,
        id,
      ],
    )
  ).rows[0];
}
async function removeLine(invoiceId, id) {
  return (
    await pool.query(
      "DELETE FROM customer_invoice_lines WHERE invoice_id = $1 AND id = $2 RETURNING *",
      [invoiceId, id],
    )
  ).rows[0];
}
async function refreshTotals(invoiceId, db = pool) {
  return (
    await db.query(
      `UPDATE customer_invoices SET subtotal = totals.subtotal, tax_total = totals.tax_total, grand_total = totals.grand_total, updated_at = NOW() FROM (SELECT COALESCE(SUM(line_subtotal), 0)::NUMERIC(14,2) AS subtotal, COALESCE(SUM(tax_amount), 0)::NUMERIC(14,2) AS tax_total, COALESCE(SUM(line_total), 0)::NUMERIC(14,2) AS grand_total FROM customer_invoice_lines WHERE invoice_id = $1) totals WHERE customer_invoices.id = $1 RETURNING customer_invoices.*`,
      [invoiceId],
    )
  ).rows[0];
}
async function getForUpdate(id, db) {
  return (
    await db.query("SELECT * FROM customer_invoices WHERE id = $1 FOR UPDATE", [id])
  ).rows[0];
}
async function activeCustomer(id, db = pool) {
  return (
    await db.query(
      "SELECT id FROM contacts WHERE id = $1 AND is_active = true AND contact_type IN ('customer', 'both')",
      [id],
    )
  ).rows[0];
}
async function activeProduct(id, db = pool) {
  return (
    await db.query(
      "SELECT id FROM products WHERE id = $1 AND is_active = true",
      [id],
    )
  ).rows[0];
}
async function activeTax(id, db = pool) {
  return (
    await db.query(
      `SELECT t.id, t.rate, t.sales_tax_account_id
       FROM taxes t
       JOIN chart_of_accounts a ON a.id = t.sales_tax_account_id
       WHERE t.id = $1 AND t.is_active = true AND a.is_active = true`,
      [id],
    )
  ).rows[0];
}
async function activeAnalytic(id, db = pool) {
  return (
    await db.query(
      "SELECT id FROM analytic_accounts WHERE id = $1 AND is_active = true",
      [id],
    )
  ).rows[0];
}
async function activeAccount(id, db = pool) {
  return (
    await db.query(
      "SELECT id FROM chart_of_accounts WHERE id = $1 AND is_active = true",
      [id],
    )
  ).rows[0];
}
async function activeUser(id, db = pool) {
  return (
    await db.query(
      "SELECT id FROM users WHERE id = $1 AND is_active = true",
      [id],
    )
  ).rows[0];
}
module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getLines,
  getLine,
  createLine,
  updateLine,
  removeLine,
  refreshTotals,
  getForUpdate,
  activeCustomer,
  activeProduct,
  activeTax,
  activeAnalytic,
  activeAccount,
  activeUser,
};
