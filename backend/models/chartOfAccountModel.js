const { pool } = require("../config/db");

async function getAllAccounts() {
    const result = await pool.query(`
        SELECT
            id,
            account_code,
            account_name,
            account_type,
            account_subtype,
            is_active,
            created_at,
            updated_at
        FROM chart_of_accounts
        ORDER BY id DESC
    `);

    return result.rows;
}

async function getAccountById(id) {
    const result = await pool.query(`
        SELECT
            id,
            account_code,
            account_name,
            account_type,
            account_subtype,
            is_active,
            created_at,
            updated_at
        FROM chart_of_accounts
        WHERE id = $1
    `, [id]);

    return result.rows[0];
}

async function createAccount(data) {
    const result = await pool.query(`
        INSERT INTO chart_of_accounts (
            account_code,
            account_name,
            account_type,
            account_subtype
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
            id,
            account_code,
            account_name,
            account_type,
            account_subtype,
            is_active,
            created_at,
            updated_at
    `, [
        data.accountCode,
        data.accountName,
        data.accountType,
        data.accountSubtype
    ]);

    return result.rows[0];
}

async function updateAccount(id, data) {
    const result = await pool.query(`
        UPDATE chart_of_accounts
        SET
            account_code = $1,
            account_name = $2,
            account_type = $3,
            account_subtype = $4
        WHERE id = $5
        RETURNING
            id,
            account_code,
            account_name,
            account_type,
            account_subtype,
            is_active,
            created_at,
            updated_at
    `, [
        data.accountCode,
        data.accountName,
        data.accountType,
        data.accountSubtype,
        id
    ]);

    return result.rows[0];
}

async function deactivateAccount(id) {
    const result = await pool.query(`
        UPDATE chart_of_accounts
        SET is_active = false
        WHERE id = $1
        RETURNING
            id,
            account_code,
            account_name,
            account_type,
            account_subtype,
            is_active,
            created_at,
            updated_at
    `, [id]);

    return result.rows[0];
}

module.exports = {
    getAllAccounts,
    getAccountById,
    createAccount,
    updateAccount,
    deactivateAccount
};