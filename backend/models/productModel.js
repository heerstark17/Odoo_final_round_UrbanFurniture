const { pool } = require("../config/db");

async function getAllProducts() {
    const result = await pool.query(`
        SELECT
            id,
            name,
            product_type,
            category,
            sales_price,
            purchase_price,
            image_url,
            is_active,
            created_at,
            updated_at
        FROM products
        ORDER BY id DESC
    `);

    return result.rows;
}

async function getProductById(id) {
    const result = await pool.query(`
        SELECT
            id,
            name,
            product_type,
            category,
            sales_price,
            purchase_price,
            image_url,
            is_active,
            created_at,
            updated_at
        FROM products
        WHERE id = $1
    `, [id]);

    return result.rows[0];
}

async function createProduct(data) {
    const result = await pool.query(`
        INSERT INTO products (
            name,
            product_type,
            category,
            sales_price,
            purchase_price,
            image_url
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id,
            name,
            product_type,
            category,
            sales_price,
            purchase_price,
            image_url,
            is_active,
            created_at,
            updated_at
    `, [
        data.name,
        data.productType,
        data.category,
        data.salesPrice,
        data.purchasePrice,
        data.imageUrl
    ]);

    return result.rows[0];
}

async function updateProduct(id, data) {
    const result = await pool.query(`
        UPDATE products
        SET
            name = $1,
            product_type = $2,
            category = $3,
            sales_price = $4,
            purchase_price = $5,
            image_url = $6
        WHERE id = $7
        RETURNING
            id,
            name,
            product_type,
            category,
            sales_price,
            purchase_price,
            image_url,
            is_active,
            created_at,
            updated_at
    `, [
        data.name,
        data.productType,
        data.category,
        data.salesPrice,
        data.purchasePrice,
        data.imageUrl,
        id
    ]);

    return result.rows[0];
}

async function deactivateProduct(id) {
    const result = await pool.query(`
        UPDATE products
        SET is_active = false
        WHERE id = $1
        RETURNING
            id,
            name,
            product_type,
            category,
            sales_price,
            purchase_price,
            image_url,
            is_active,
            created_at,
            updated_at
    `, [id]);

    return result.rows[0];
}

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deactivateProduct
};