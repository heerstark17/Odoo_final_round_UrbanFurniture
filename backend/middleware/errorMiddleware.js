function notFoundHandler(req, res) {
	res.status(404).json({
		message: "Route not found",
	});
}

function errorHandler(error, req, res, next) {
	let statusCode = error.statusCode || error.status || 500;
	let message = error.message || "Internal server error";

	if (error.code === "23505") {
		statusCode = 409;
		message = "A record with the same value already exists";
	} else if (error.code === "23503") {
		statusCode = 409;
		message = "The requested record cannot be changed because it is referenced by another record";
	} else if (error.code === "23514") {
		statusCode = 400;
		message = "The request violates a data constraint";
	} else if (statusCode >= 500) {
		statusCode = 500;
		message = "Internal server error";
	}

	res.status(statusCode).json({ message });
}

module.exports = {
	notFoundHandler,
	errorHandler,
};
