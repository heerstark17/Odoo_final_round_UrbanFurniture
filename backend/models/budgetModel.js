const { pool } = require("../config/db");

async function getAll() {
    return (await pool.query("SELECT * FROM budgets ORDER BY id DESC")).rows;
}
async function getById(id) {
    return (await pool.query("SELECT * FROM budgets WHERE id = $1", [id])).rows[0];
}
async function userExists(id) {
    return (await pool.query("SELECT id FROM users WHERE id = $1", [id])).rows[0];
}
async function create(data) {
    const result = await pool.query(`INSERT INTO budgets
        (budget_name, start_date, end_date, responsible_user_id, status, revised_from_id, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.budgetName, data.startDate, data.endDate, data.responsibleUserId, data.status, data.revisedFromId, data.createdBy]);
    return result.rows[0];
}
async function update(id, data) {
    const result = await pool.query(`UPDATE budgets SET budget_name = $1, start_date = $2,
        end_date = $3, responsible_user_id = $4, status = $5, revised_from_id = $6,
        created_by = $7, updated_at = NOW() WHERE id = $8 RETURNING *`,
    [data.budgetName, data.startDate, data.endDate, data.responsibleUserId, data.status, data.revisedFromId, data.createdBy, id]);
    return result.rows[0];
}
async function remove(id) { return (await pool.query("DELETE FROM budgets WHERE id = $1 RETURNING *", [id])).rows[0]; }
module.exports = { getAll, getById, userExists, create, update, remove };
