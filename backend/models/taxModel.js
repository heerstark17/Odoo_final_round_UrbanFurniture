const { pool } = require("../config/db");

async function getAllTaxes() {
    const result = await pool.query(`
        SELECT
            t.id,
            t.name,
            t.rate,
            t.sales_tax_account_id,
            sales.account_name AS sales_tax_account_name,
            t.purchase_tax_account_id,
            purchase.account_name AS purchase_tax_account_name,
            t.is_active,
            t.created_at,
            t.updated_at
        FROM taxes t
        JOIN chart_of_accounts sales
            ON t.sales_tax_account_id = sales.id
        JOIN chart_of_accounts purchase
            ON t.purchase_tax_account_id = purchase.id
        ORDER BY t.id DESC
    `);

    return result.rows;
}

async function getTaxById(id) {
    const result = await pool.query(`
        SELECT
            t.id,
            t.name,
            t.rate,
            t.sales_tax_account_id,
            sales.account_name AS sales_tax_account_name,
            t.purchase_tax_account_id,
            purchase.account_name AS purchase_tax_account_name,
            t.is_active,
            t.created_at,
            t.updated_at
        FROM taxes t
        JOIN chart_of_accounts sales
            ON t.sales_tax_account_id = sales.id
        JOIN chart_of_accounts purchase
            ON t.purchase_tax_account_id = purchase.id
        WHERE t.id = $1
    `, [id]);

    return result.rows[0];
}

async function createTax(data) {
    const result = await pool.query(`
        INSERT INTO taxes (
            name,
            rate,
            sales_tax_account_id,
            purchase_tax_account_id
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
            id,
            name,
            rate,
            sales_tax_account_id,
            purchase_tax_account_id,
            is_active,
            created_at,
            updated_at
    `, [
        data.name,
        data.rate,
        data.salesTaxAccountId,
        data.purchaseTaxAccountId
    ]);

    return result.rows[0];
}

async function updateTax(id, data) {
    const result = await pool.query(`
        UPDATE taxes
        SET
            name = $1,
            rate = $2,
            sales_tax_account_id = $3,
            purchase_tax_account_id = $4
        WHERE id = $5
        RETURNING
            id,
            name,
            rate,
            sales_tax_account_id,
            purchase_tax_account_id,
            is_active,
            created_at,
            updated_at
    `, [
        data.name,
        data.rate,
        data.salesTaxAccountId,
        data.purchaseTaxAccountId,
        id
    ]);

    return result.rows[0];
}

async function deactivateTax(id) {
    const result = await pool.query(`
        UPDATE taxes
        SET is_active = false
        WHERE id = $1
        RETURNING
            id,
            name,
            rate,
            sales_tax_account_id,
            purchase_tax_account_id,
            is_active,
            created_at,
            updated_at
    `, [id]);

    return result.rows[0];
}

async function getActiveAccountById(id) {
    const result = await pool.query(`
        SELECT id, account_type, account_subtype
        FROM chart_of_accounts
        WHERE id = $1
          AND is_active = true
    `, [id]);

    return result.rows[0];
}

module.exports = {
    getAllTaxes,
    getTaxById,
    createTax,
    updateTax,
    deactivateTax,
    getActiveAccountById
};
