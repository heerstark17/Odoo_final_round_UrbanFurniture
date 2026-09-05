const { pool } = require("../config/db");

const journalSelect = `
    SELECT j.*, a.account_code AS default_account_code,
        a.account_name AS default_account_name
    FROM journals j
    JOIN chart_of_accounts a ON a.id = j.default_account_id
`;

async function getAllJournals() {
    return (await pool.query(`${journalSelect} ORDER BY j.id DESC`)).rows;
}
async function getJournalById(id) {
    return (await pool.query(`${journalSelect} WHERE j.id = $1`, [id])).rows[0];
}
async function getActiveAccountById(id) {
    return (await pool.query("SELECT id FROM chart_of_accounts WHERE id = $1 AND is_active = true", [id])).rows[0];
}
async function createJournal(data) {
    const result = await pool.query(`
        INSERT INTO journals (journal_name, journal_type, default_account_id)
        VALUES ($1, $2, $3) RETURNING *
    `, [data.journalName, data.journalType, data.defaultAccountId]);
    return result.rows[0];
}
async function updateJournal(id, data) {
    const result = await pool.query(`
        UPDATE journals SET journal_name = $1, journal_type = $2,
            default_account_id = $3, updated_at = NOW()
        WHERE id = $4 RETURNING *
    `, [data.journalName, data.journalType, data.defaultAccountId, id]);
    return result.rows[0];
}
async function deactivateJournal(id) {
    return (await pool.query(`UPDATE journals SET is_active = false,
        updated_at = NOW() WHERE id = $1 RETURNING *`, [id])).rows[0];
}

module.exports = { getAllJournals, getJournalById, getActiveAccountById, createJournal, updateJournal, deactivateJournal };
