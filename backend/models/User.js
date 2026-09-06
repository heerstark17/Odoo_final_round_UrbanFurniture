const { pool } = require("../config/db");

async function findByEmail(identifier) {
	const result = await pool.query(
		`SELECT id, login_id, full_name, email, password_hash, role, contact_id
		 FROM users
		 WHERE (LOWER(email) = LOWER($1) OR LOWER(login_id) = LOWER($1)) AND is_active = true`,
		[identifier],
	);

	return result.rows[0];
}

async function createUser({ login_id, full_name, email, password_hash, role, contact_id }) {
	const result = await pool.query(
		`INSERT INTO users (login_id, full_name, email, password_hash, role, contact_id, is_active)
		 VALUES ($1, $2, $3, $4, $5, $6, true)
		 RETURNING id, login_id, full_name, email, role, contact_id`,
		[login_id, full_name, email, password_hash, role, contact_id],
	);
	return result.rows[0];
}

module.exports = {
	findByEmail,
	createUser,
};
