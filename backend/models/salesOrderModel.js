const { pool } = require("../config/db");

const orderSelect = `SELECT so.*, c.name AS customer_name,
    COALESCE(SUM(sol.line_subtotal), 0)::NUMERIC(14,2) AS subtotal,
    COALESCE(SUM(sol.tax_amount), 0)::NUMERIC(14,2) AS tax_total,
    COALESCE(SUM(sol.line_total), 0)::NUMERIC(14,2) AS grand_total,
    COALESCE(SUM(sol.line_total), 0)::NUMERIC(14,2) AS total_amount
    FROM sales_orders so
    LEFT JOIN contacts c ON c.id = so.customer_id
    LEFT JOIN sales_order_lines sol ON sol.sales_order_id = so.id`;
const lineSelect = `SELECT sol.*, p.name AS product_name, t.name AS tax_name
    FROM sales_order_lines sol JOIN products p ON p.id = sol.product_id
    LEFT JOIN taxes t ON t.id = sol.tax_id`;

async function getAll(contactId = null) {
  return (await pool.query(
    `${orderSelect} ${contactId ? "WHERE so.customer_id = $1" : ""} GROUP BY so.id, c.name ORDER BY so.id DESC`,
    contactId ? [contactId] : [],
  )).rows;
}
async function getById(id, db = pool) {
  return (
    await db.query(`${orderSelect} WHERE so.id = $1 GROUP BY so.id, c.name`, [id])
  ).rows[0];
}
async function getByIdForContact(id, contactId) {
  return (
    await pool.query(`${orderSelect} WHERE so.id = $1 AND so.customer_id = $2 GROUP BY so.id, c.name`, [id, contactId])
  ).rows[0];
}
async function create(data) {
  return (
    await pool.query(
      `INSERT INTO sales_orders (so_number, customer_id, order_date, status, notes, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        data.soNumber,
        data.customerId,
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
      `UPDATE sales_orders SET so_number = $1, customer_id = $2, order_date = $3, status = $4, notes = $5, created_by = $6, updated_at = NOW() WHERE id = $7 RETURNING *`,
      [
        data.soNumber,
        data.customerId,
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
    await pool.query("DELETE FROM sales_orders WHERE id = $1 RETURNING *", [id])
  ).rows[0];
}
async function getLines(orderId) {
  return (
    await pool.query(
      `${lineSelect} WHERE sol.sales_order_id = $1 ORDER BY sol.id DESC`,
      [orderId],
    )
  ).rows;
}
async function getLine(orderId, id) {
  return (
    await pool.query(
      `${lineSelect} WHERE sol.sales_order_id = $1 AND sol.id = $2`,
      [orderId, id],
    )
  ).rows[0];
}
async function createLine(orderId, data) {
  return (
    await pool.query(
      `INSERT INTO sales_order_lines (sales_order_id, product_id, analytic_account_id, account_id, tax_id, tax_rate, quantity, unit_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
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
      `UPDATE sales_order_lines SET product_id = $1, analytic_account_id = $2, account_id = $3, tax_id = $4, tax_rate = $5, quantity = $6, unit_price = $7 WHERE sales_order_id = $8 AND id = $9 RETURNING *`,
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
      "DELETE FROM sales_order_lines WHERE sales_order_id = $1 AND id = $2 RETURNING *",
      [orderId, id],
    )
  ).rows[0];
}
async function activeCustomer(id) {
  return (
    await pool.query(
      "SELECT id FROM contacts WHERE id = $1 AND is_active = true AND contact_type IN ('customer', 'both')",
      [id],
    )
  ).rows[0];
}
async function activeProduct(id) {
  return (
    await pool.query(
      "SELECT id FROM products WHERE id = $1 AND is_active = true",
      [id],
    )
  ).rows[0];
}
async function activeTax(id) {
  return (
    await pool.query(
      "SELECT id, rate FROM taxes WHERE id = $1 AND is_active = true",
      [id],
    )
  ).rows[0];
}
async function activeAnalytic(id) {
  return (
    await pool.query(
      "SELECT id FROM analytic_accounts WHERE id = $1 AND is_active = true",
      [id],
    )
  ).rows[0];
}
async function activeAccount(id) {
  return (
    await pool.query(
      "SELECT id FROM chart_of_accounts WHERE id = $1 AND is_active = true",
      [id],
    )
  ).rows[0];
}
async function activeUser(id) {
  return (
    await pool.query(
      "SELECT id FROM users WHERE id = $1 AND is_active = true",
      [id],
    )
  ).rows[0];
}
module.exports = {
  getAll,
  getById,
  getByIdForContact,
  create,
  update,
  remove,
  getLines,
  getLine,
  createLine,
  updateLine,
  removeLine,
  activeCustomer,
  activeProduct,
  activeTax,
  activeAnalytic,
  activeAccount,
  activeUser,
};
