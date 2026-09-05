const service = require("../services/paymentService");

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("Invalid payment ID");
    error.statusCode = 400;
    throw error;
  }
  return id;
}

function writeError(res, error) {
  res.status(error.statusCode || (error.code === "23505" ? 409 : 400)).json({
    message:
      error.code === "23505"
        ? "Payment number already exists"
        : error.message,
  });
}

async function list(req, res) {
  try {
    res.json(await service.getPayments(req.user.role === "contact" ? req.user.contact_id : null));
  } catch (error) {
    writeError(res, error);
  }
}

async function get(req, res) {
  try {
    res.json(await service.getPayment(parseId(req.params.id), req.user.role === "contact" ? req.user.contact_id : null));
  } catch (error) {
    writeError(res, error);
  }
}

async function create(req, res) {
  try {
    res.status(201).json(await service.createPayment(req.body));
  } catch (error) {
    writeError(res, error);
  }
}

async function update(req, res) {
  try {
    res.json(await service.updatePayment(parseId(req.params.id), req.body));
  } catch (error) {
    writeError(res, error);
  }
}

async function remove(req, res) {
  try {
    res.json({
      message: "Payment deleted successfully",
      payment: await service.deletePayment(parseId(req.params.id)),
    });
  } catch (error) {
    writeError(res, error);
  }
}

module.exports = { list, get, create, update, remove };
