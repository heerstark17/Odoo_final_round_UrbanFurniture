const { pool } = require("../config/db");

const orderSelect = `SELECT po.*, COALESCE(SUM(pol.line_subtotal), 0)::NUMERIC(14,2) AS subtotal,
    COALESCE(SUM(pol.tax_amount), 0)::NUMERIC(14,2) AS tax_total,
    COALESCE(SUM(pol.line_total), 0)::NUMERIC(14,2) AS grand_total
    FROM purchase_orders po
    LEFT JOIN purchase_order_lines pol ON pol.purchase_order_id = po.id`;

const lineSelect = `SELECT pol.*, p.name AS product_name, t.name AS tax_name
    FROM purchase_order_lines pol
    JOIN products p ON p.id = pol.product_id
    LEFT JOIN taxes t ON t.id = pol.tax_id`;

async function getAll() {
  return (await pool.query(`${orderSelect} GROUP BY po.id ORDER BY po.id DESC`))
    .rows;
}

async function getById(id, db = pool) {
  return (
    await db.query(`${orderSelect} WHERE po.id = $1 GROUP BY po.id`, [id])
  ).rows[0];
}

async function getForUpdate(id, db) {
  return (
    await db.query("SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE", [id])
  ).rows[0];
}

async function create(data) {
  return (
    await pool.query(
      `INSERT INTO purchase_orders (po_number, vendor_id, order_date, status, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        data.poNumber,
        data.vendorId,
        data.orderDate,
        data.status,
        data.notes,
        data.createdBy,
      ],
    )
  ).rows[0];
}

async function update(id, data) {
  return (
    await pool.query(
      `UPDATE purchase_orders
       SET po_number = $1, vendor_id = $2, order_date = $3, status = $4,
           notes = $5, created_by = $6, updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [
        data.poNumber,
        data.vendorId,
        data.orderDate,
        data.status,
        data.notes,
        data.createdBy,
        id,
      ],
    )
  ).rows[0];
}

async function remove(id) {
  return (
    await pool.query("DELETE FROM purchase_orders WHERE id = $1 RETURNING *", [id])
  ).rows[0];
}

async function getLines(orderId) {
  return (
    await pool.query(
      `${lineSelect} WHERE pol.purchase_order_id = $1 ORDER BY pol.id DESC`,
      [orderId],
    )
  ).rows;
}

async function getLine(orderId, id) {
  return (
    await pool.query(
      `${lineSelect} WHERE pol.purchase_order_id = $1 AND pol.id = $2`,
      [orderId, id],
    )
  ).rows[0];
}

async function createLine(orderId, data) {
  return (
    await pool.query(
      `INSERT INTO purchase_order_lines
       (purchase_order_id, product_id, analytic_account_id, account_id, tax_id, tax_rate, quantity, unit_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        orderId,
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

async function updateLine(orderId, id, data) {
  return (
    await pool.query(
      `UPDATE purchase_order_lines
       SET product_id = $1, analytic_account_id = $2, account_id = $3, tax_id = $4,
           tax_rate = $5, quantity = $6, unit_price = $7
       WHERE purchase_order_id = $8 AND id = $9 RETURNING *`,
      [
        data.productId,
        data.analyticAccountId,
        data.accountId,
        data.taxId,
        data.taxRate,
        data.quantity,
        data.unitPrice,
        orderId,
        id,
      ],
    )
  ).rows[0];
}

async function removeLine(orderId, id) {
  return (
    await pool.query(
      "DELETE FROM purchase_order_lines WHERE purchase_order_id = $1 AND id = $2 RETURNING *",
      [orderId, id],
    )
  ).rows[0];
}

async function activeVendor(id) {
  return (
    await pool.query(
      "SELECT id FROM contacts WHERE id = $1 AND is_active = true AND contact_type IN ('vendor', 'both')",
      [id],
    )
  ).rows[0];
}

async function activeProduct(id) {
  return (await pool.query("SELECT id FROM products WHERE id = $1 AND is_active = true", [id])).rows[0];
}

async function activeAnalytic(id) {
  return (await pool.query("SELECT id FROM analytic_accounts WHERE id = $1 AND is_active = true", [id])).rows[0];
}

async function activeAccount(id) {
  return (await pool.query("SELECT id FROM chart_of_accounts WHERE id = $1 AND is_active = true", [id])).rows[0];
}

async function activeTax(id) {
  return (await pool.query("SELECT id, rate FROM taxes WHERE id = $1 AND is_active = true", [id])).rows[0];
}

async function activeUser(id) {
  return (await pool.query("SELECT id FROM users WHERE id = $1 AND is_active = true", [id])).rows[0];
}

module.exports = {
  getAll, getById, getForUpdate, create, update, remove, getLines, getLine,
  createLine, updateLine, removeLine, activeVendor, activeProduct,
  activeAnalytic, activeAccount, activeTax, activeUser,
};
