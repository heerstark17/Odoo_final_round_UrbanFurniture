const { pool } = require("../config/db");
const lineSelect = `SELECT bl.*, a.name AS analytic_account_name, a.analytic_type
    FROM budget_lines bl JOIN analytic_accounts a ON a.id = bl.analytic_account_id`;
async function getAll(budgetId) {
  return (
    await pool.query(
      `${lineSelect} WHERE bl.budget_id = $1 ORDER BY bl.id DESC`,
      [budgetId],
    )
  ).rows;
}
async function getById(budgetId, id) {
  return (
    await pool.query(`${lineSelect} WHERE bl.budget_id = $1 AND bl.id = $2`, [
      budgetId,
      id,
    ])
  ).rows[0];
}
async function budgetExists(id) {
  return (await pool.query("SELECT id FROM budgets WHERE id = $1", [id]))
    .rows[0];
}
async function activeAnalytic(id) {
  return (
    await pool.query(
      "SELECT id FROM analytic_accounts WHERE id = $1 AND is_active = true",
      [id],
    )
  ).rows[0];
}
async function create(budgetId, data) {
  return (
    await pool.query(
      "INSERT INTO budget_lines (budget_id, analytic_account_id, planned_amount) VALUES ($1, $2, $3) RETURNING *",
      [budgetId, data.analyticAccountId, data.plannedAmount],
    )
  ).rows[0];
}
async function update(budgetId, id, data) {
  return (
    await pool.query(
      "UPDATE budget_lines SET analytic_account_id = $1, planned_amount = $2 WHERE budget_id = $3 AND id = $4 RETURNING *",
      [data.analyticAccountId, data.plannedAmount, budgetId, id],
    )
  ).rows[0];
}
async function remove(budgetId, id) {
  return (
    await pool.query(
      "DELETE FROM budget_lines WHERE budget_id = $1 AND id = $2 RETURNING *",
      [budgetId, id],
    )
  ).rows[0];
}
module.exports = {
  getAll,
  getById,
  budgetExists,
  activeAnalytic,
  create,
  update,
  remove,
};
