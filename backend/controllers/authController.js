const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/User");
const { JWT_SECRET } = require("../middleware/authMiddleware");

async function login(req, res, next) {
	try {
		const email = String(req.body?.email || "").trim();
		const password = String(req.body?.password || "");

		if (!email || !password) {
			const error = new Error("Email and password are required");
			error.statusCode = 400;
			throw error;
		}

		const user = await userModel.findByEmail(email);
		const passwordMatches = user && await bcrypt.compare(password, user.password_hash);

		if (!passwordMatches) {
			const error = new Error("Invalid email or password");
			error.statusCode = 401;
			throw error;
		}

		const payload = {
			id: user.id,
			login_id: user.login_id,
			full_name: user.full_name,
			email: user.email,
			role: user.role,
			contact_id: user.contact_id,
		};

		res.json({
			token: jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" }),
			user: payload,
		});
	} catch (error) {
		next(error);
	}
}

module.exports = {
	login,
};
