const { pool } = require("../config/db");

async function findByEmail(email) {
	const result = await pool.query(
		`SELECT id, login_id, full_name, email, password_hash, role, contact_id
		 FROM users
		 WHERE LOWER(email) = LOWER($1) AND is_active = true`,
		[email],
	);

	return result.rows[0];
}

module.exports = {
	findByEmail,
};
