const { pool } = require("../config/db");

const lineSelect = `SELECT vbl.*, p.name AS product_name, t.name AS tax_name
    FROM vendor_bill_lines vbl
    JOIN products p ON p.id = vbl.product_id
    LEFT JOIN taxes t ON t.id = vbl.tax_id`;

async function getAll() {
  return (await pool.query("SELECT * FROM vendor_bills ORDER BY id DESC")).rows;
}

async function getById(id, db = pool) {
  return (await db.query("SELECT * FROM vendor_bills WHERE id = $1", [id])).rows[0];
}

async function create(data) {
  return (
    await pool.query(
      `INSERT INTO vendor_bills
       (bill_number, po_id, vendor_id, bill_date, due_date, reference, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [data.billNumber, data.poId, data.vendorId, data.billDate, data.dueDate, data.reference, data.status, data.createdBy],
    )
  ).rows[0];
}

async function update(id, data, db = pool) {
  return (
    await db.query(
      `UPDATE vendor_bills
       SET bill_number = $1, vendor_id = $2, bill_date = $3, due_date = $4,
           reference = $5, status = $6, created_by = $7, updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [data.billNumber, data.vendorId, data.billDate, data.dueDate, data.reference, data.status, data.createdBy, id],
    )
  ).rows[0];
}

async function remove(id) {
  return (await pool.query("DELETE FROM vendor_bills WHERE id = $1 RETURNING *", [id])).rows[0];
}

async function getLines(billId, db = pool) {
  return (await db.query(`${lineSelect} WHERE vbl.bill_id = $1 ORDER BY vbl.id DESC`, [billId])).rows;
}

async function getLine(billId, id) {
  return (await pool.query(`${lineSelect} WHERE vbl.bill_id = $1 AND vbl.id = $2`, [billId, id])).rows[0];
}

async function createLine(billId, data) {
  return (
    await pool.query(
      `INSERT INTO vendor_bill_lines
       (bill_id, purchase_order_line_id, product_id, analytic_account_id, account_id, tax_id, tax_rate, quantity, unit_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [billId, data.purchaseOrderLineId, data.productId, data.analyticAccountId, data.accountId, data.taxId, data.taxRate, data.quantity, data.unitPrice],
    )
  ).rows[0];
}

async function updateLine(billId, id, data) {
  return (
    await pool.query(
      `UPDATE vendor_bill_lines
       SET product_id = $1, analytic_account_id = $2, account_id = $3, tax_id = $4,
           tax_rate = $5, quantity = $6, unit_price = $7
       WHERE bill_id = $8 AND id = $9 RETURNING *`,
      [data.productId, data.analyticAccountId, data.accountId, data.taxId, data.taxRate, data.quantity, data.unitPrice, billId, id],
    )
  ).rows[0];
}

async function removeLine(billId, id) {
  return (await pool.query("DELETE FROM vendor_bill_lines WHERE bill_id = $1 AND id = $2 RETURNING *", [billId, id])).rows[0];
}

async function refreshTotals(billId, db = pool) {
  return (
    await db.query(
      `UPDATE vendor_bills
       SET subtotal = totals.subtotal, tax_total = totals.tax_total, grand_total = totals.grand_total, updated_at = NOW()
       FROM (
         SELECT COALESCE(SUM(line_subtotal), 0)::NUMERIC(14,2) AS subtotal,
                COALESCE(SUM(tax_amount), 0)::NUMERIC(14,2) AS tax_total,
                COALESCE(SUM(line_total), 0)::NUMERIC(14,2) AS grand_total
         FROM vendor_bill_lines WHERE bill_id = $1
       ) totals
       WHERE vendor_bills.id = $1 RETURNING vendor_bills.*`,
      [billId],
    )
  ).rows[0];
}

async function getForUpdate(id, db) { return (await db.query("SELECT * FROM vendor_bills WHERE id = $1 FOR UPDATE", [id])).rows[0]; }
async function activeVendor(id, db = pool) { return (await db.query("SELECT id FROM contacts WHERE id = $1 AND is_active = true AND contact_type IN ('vendor', 'both')", [id])).rows[0]; }
async function activeProduct(id, db = pool) { return (await db.query("SELECT id FROM products WHERE id = $1 AND is_active = true", [id])).rows[0]; }
async function activeTax(id, db = pool) { return (await db.query(
  `SELECT t.id, t.rate, t.purchase_tax_account_id
   FROM taxes t JOIN chart_of_accounts a ON a.id = t.purchase_tax_account_id
   WHERE t.id = $1 AND t.is_active = true AND a.is_active = true`, [id],
)).rows[0]; }
async function activeAnalytic(id, db = pool) { return (await db.query("SELECT id FROM analytic_accounts WHERE id = $1 AND is_active = true", [id])).rows[0]; }
async function activeAccount(id, db = pool) { return (await db.query("SELECT id FROM chart_of_accounts WHERE id = $1 AND is_active = true", [id])).rows[0]; }
async function activeUser(id, db = pool) { return (await db.query("SELECT id FROM users WHERE id = $1 AND is_active = true", [id])).rows[0]; }

module.exports = {
  getAll, getById, getForUpdate, create, update, remove, getLines, getLine, createLine,
  updateLine, removeLine, refreshTotals, activeVendor, activeProduct, activeTax,
  activeAnalytic, activeAccount, activeUser,
};
