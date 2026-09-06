const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/User");
const { JWT_SECRET } = require("../middleware/authMiddleware");
const { pool } = require("../config/db");

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

async function register(req, res, next) {
	try {
		const name = String(req.body?.name || "").trim();
		const email = String(req.body?.email || "").trim().toLowerCase();
		const password = String(req.body?.password || "");
		const phone = String(req.body?.phone || "").trim() || null;
		const city = String(req.body?.city || "").trim() || null;
		const state = String(req.body?.state || "").trim() || null;
		const pincode = String(req.body?.pincode || "").trim() || null;
		const contactType = String(req.body?.role || req.body?.contactType || "customer").toLowerCase();

		if (!name) {
			const error = new Error("Full name is required");
			error.statusCode = 400;
			throw error;
		}
		if (!email) {
			const error = new Error("Email is required");
			error.statusCode = 400;
			throw error;
		}
		if (!password || password.length < 4) {
			const error = new Error("Password must be at least 4 characters long");
			error.statusCode = 400;
			throw error;
		}
		if (!["customer", "vendor"].includes(contactType)) {
			const error = new Error("Role must be either customer or vendor");
			error.statusCode = 400;
			throw error;
		}

		// Check if user with this email or login_id already exists
		const existingUser = await userModel.findByEmail(email);
		if (existingUser) {
			const error = new Error("An account with this email already exists");
			error.statusCode = 409;
			throw error;
		}

		// 1. Create Contact entry
		const contactResult = await pool.query(
			`INSERT INTO contacts (name, contact_type, email, phone, city, state, pincode)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)
			 RETURNING id, name, contact_type, email, phone, city, state, pincode`,
			[name, contactType, email, phone, city, state, pincode]
		);
		const contact = contactResult.rows[0];

		// 2. Hash password
		const password_hash = await bcrypt.hash(password, 10);

		// 3. Generate unique login_id from email or name
		const baseLogin = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "user";
		const login_id = `${baseLogin}_${Date.now().toString().slice(-4)}`;

		// 4. Create User entry (contact role linked to contact_id)
		const newUser = await userModel.createUser({
			login_id,
			full_name: name,
			email,
			password_hash,
			role: "contact",
			contact_id: contact.id,
		});

		const payload = {
			id: newUser.id,
			login_id: newUser.login_id,
			full_name: newUser.full_name,
			email: newUser.email,
			role: newUser.role,
			contact_id: newUser.contact_id,
			contact_type: contact.contact_type,
		};

		res.status(201).json({
			message: "Registration successful",
			token: jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" }),
			user: payload,
		});
	} catch (error) {
		next(error);
	}
}

module.exports = {
	login,
	register,
};
