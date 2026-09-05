const { pool } = require("../config/db");

const paymentSelect = `SELECT p.*, customer.name AS customer_name,
    vendor.name AS vendor_name, ci.invoice_number, vb.bill_number
    FROM payments p
    LEFT JOIN contacts customer ON customer.id = p.customer_id
    LEFT JOIN contacts vendor ON vendor.id = p.vendor_id
    LEFT JOIN customer_invoices ci ON ci.id = p.invoice_id
    LEFT JOIN vendor_bills vb ON vb.id = p.bill_id`;

async function getAll() {
  return (await pool.query(`${paymentSelect} ORDER BY p.id DESC`)).rows;
}

async function getById(id, db = pool) {
  return (await db.query(`${paymentSelect} WHERE p.id = $1`, [id])).rows[0];
}

async function create(data, db = pool) {
  return (
    await db.query(
      `INSERT INTO payments
       (payment_number, customer_id, invoice_id, vendor_id, bill_id,
        payment_date, direction, method, amount, reference, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        data.paymentNumber,
        data.customerId,
        data.invoiceId,
        data.vendorId,
        data.billId,
        data.paymentDate,
        data.direction,
        data.method,
        data.amount,
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
      `UPDATE payments
       SET payment_number = $1, customer_id = $2, invoice_id = $3,
           vendor_id = $4, bill_id = $5, payment_date = $6, direction = $7,
           method = $8, amount = $9, reference = $10, status = $11,
           created_by = $12, updated_at = NOW()
       WHERE id = $13 RETURNING *`,
      [
        data.paymentNumber,
        data.customerId,
        data.invoiceId,
        data.vendorId,
        data.billId,
        data.paymentDate,
        data.direction,
        data.method,
        data.amount,
        data.reference,
        data.status,
        data.createdBy,
        id,
      ],
    )
  ).rows[0];
}

async function remove(id) {
  return (await pool.query("DELETE FROM payments WHERE id = $1 RETURNING *", [id])).rows[0];
}

async function getInvoiceForUpdate(id, db) {
  return (
    await db.query(
      "SELECT * FROM customer_invoices WHERE id = $1 FOR UPDATE",
      [id],
    )
  ).rows[0];
}

async function getBillForUpdate(id, db) {
  return (
    await db.query("SELECT * FROM vendor_bills WHERE id = $1 FOR UPDATE", [id])
  ).rows[0];
}

async function getPostedTotalForInvoice(invoiceId, excludePaymentId, db) {
  return (
    await db.query(
      `SELECT COALESCE(SUM(amount), 0)::NUMERIC(14,2) AS paid_total
       FROM payments
       WHERE invoice_id = $1 AND status = 'posted'
         AND ($2::BIGINT IS NULL OR id <> $2)`,
      [invoiceId, excludePaymentId],
    )
  ).rows[0].paid_total;
}

async function getPostedTotalForBill(billId, excludePaymentId, db) {
  return (
    await db.query(
      `SELECT COALESCE(SUM(amount), 0)::NUMERIC(14,2) AS paid_total
       FROM payments
       WHERE bill_id = $1 AND status = 'posted'
         AND ($2::BIGINT IS NULL OR id <> $2)`,
      [billId, excludePaymentId],
    )
  ).rows[0].paid_total;
}

async function activeUser(id, db = pool) {
  return (await db.query("SELECT id FROM users WHERE id = $1 AND is_active = true", [id])).rows[0];
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getInvoiceForUpdate,
  getBillForUpdate,
  getPostedTotalForInvoice,
  getPostedTotalForBill,
  activeUser,
};
