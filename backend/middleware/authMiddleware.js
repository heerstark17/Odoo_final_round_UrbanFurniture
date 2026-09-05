const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "development-only-secret";

function authenticateToken(req, res, next) {
	const authorization = req.headers.authorization || "";
	const [scheme, token] = authorization.split(" ");

	if (scheme !== "Bearer" || !token) {
		const error = new Error("Authentication token is required");
		error.statusCode = 401;
		return next(error);
	}

	try {
		req.user = jwt.verify(token, JWT_SECRET);
		if (
			!["admin", "accountant", "contact"].includes(req.user.role) ||
			(req.user.role === "contact" && !req.user.contact_id)
		) {
			throw new Error("Invalid authentication claims");
		}
		return next();
	} catch (error) {
		const authenticationError = new Error("Invalid or expired authentication token");
		authenticationError.statusCode = 401;
		return next(authenticationError);
	}
}

function requireRole(...roles) {
	return (req, res, next) => {
		if (!req.user || !roles.includes(req.user.role)) {
			const error = new Error("You do not have permission to access this resource");
			error.statusCode = 403;
			return next(error);
		}

		return next();
	};
}

function requireOwnContact(req, res, next) {
	if (req.user.role !== "contact" || String(req.params.id) !== String(req.user.contact_id)) {
		const error = new Error("You do not have permission to access this contact");
		error.statusCode = 403;
		return next(error);
	}

	return next();
}

module.exports = {
	authenticateToken,
	requireRole,
	requireOwnContact,
	JWT_SECRET,
};
