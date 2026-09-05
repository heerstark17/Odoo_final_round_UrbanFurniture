const { pool } = require("../config/db");

async function getAll() {
  return (await pool.query("SELECT * FROM analytic_accounts ORDER BY id DESC"))
    .rows;
}
async function getById(id) {
  return (
    await pool.query("SELECT * FROM analytic_accounts WHERE id = $1", [id])
  ).rows[0];
}
async function getActiveById(id) {
  return (
    await pool.query(
      "SELECT * FROM analytic_accounts WHERE id = $1 AND is_active = true",
      [id],
    )
  ).rows[0];
}
async function create(data) {
  return (
    await pool.query(
      "INSERT INTO analytic_accounts (name, analytic_type) VALUES ($1, $2) RETURNING *",
      [data.name, data.analyticType],
    )
  ).rows[0];
}
async function update(id, data) {
  return (
    await pool.query(
      "UPDATE analytic_accounts SET name = $1, analytic_type = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
      [data.name, data.analyticType, id],
    )
  ).rows[0];
}
async function deactivate(id) {
  return (
    await pool.query(
      "UPDATE analytic_accounts SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *",
      [id],
    )
  ).rows[0];
}

module.exports = { getAll, getById, getActiveById, create, update, deactivate };
