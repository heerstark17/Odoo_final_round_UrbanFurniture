const { pool } = require("../config/db");

async function getAllContacts() {
    const result = await pool.query(`
        SELECT
            id,
            name,
            contact_type,
            email,
            phone,
            city,
            state,
            pincode,
            profile_image_url,
            is_active,
            created_at,
            updated_at
        FROM contacts
        ORDER BY id DESC
    `);

    return result.rows;
}

async function getContactById(id) {
    const result = await pool.query(`
        SELECT
            id,
            name,
            contact_type,
            email,
            phone,
            city,
            state,
            pincode,
            profile_image_url,
            is_active,
            created_at,
            updated_at
        FROM contacts
        WHERE id = $1
    `, [id]);

    return result.rows[0];
}

async function createContact(data) {
    const result = await pool.query(`
        INSERT INTO contacts (
            name,
            contact_type,
            email,
            phone,
            city,
            state,
            pincode,
            profile_image_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
            id,
            name,
            contact_type,
            email,
            phone,
            city,
            state,
            pincode,
            profile_image_url,
            is_active,
            created_at,
            updated_at
    `, [
        data.name,
        data.contactType,
        data.email,
        data.phone,
        data.city,
        data.state,
        data.pincode,
        data.profileImageUrl
    ]);

    return result.rows[0];
}

async function updateContact(id, data) {
    const result = await pool.query(`
        UPDATE contacts
        SET
            name = $1,
            contact_type = $2,
            email = $3,
            phone = $4,
            city = $5,
            state = $6,
            pincode = $7,
            profile_image_url = $8
        WHERE id = $9
        RETURNING
            id,
            name,
            contact_type,
            email,
            phone,
            city,
            state,
            pincode,
            profile_image_url,
            is_active,
            created_at,
            updated_at
    `, [
        data.name,
        data.contactType,
        data.email,
        data.phone,
        data.city,
        data.state,
        data.pincode,
        data.profileImageUrl,
        id
    ]);

    return result.rows[0];
}

async function deactivateContact(id) {
    const result = await pool.query(`
        UPDATE contacts
        SET is_active = false
        WHERE id = $1
        RETURNING
            id,
            name,
            contact_type,
            email,
            phone,
            city,
            state,
            pincode,
            profile_image_url,
            is_active,
            created_at,
            updated_at
    `, [id]);

    return result.rows[0];
}

module.exports = {
    getAllContacts,
    getContactById,
    createContact,
    updateContact,
    deactivateContact
};