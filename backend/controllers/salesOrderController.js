const service = require("../services/salesOrderService");

function parseId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error(`Invalid ${label} ID`);
    error.statusCode = 400;
    throw error;
  }
  return id;
}
function writeError(res, error) {
  res
    .status(error.statusCode || (error.code === "23505" ? 409 : 400))
    .json({
      message:
        error.code === "23505"
          ? "Sales order number already exists"
          : error.message,
    });
}
async function list(req, res) {
  try {
    res.json(await service.getSalesOrders(req.user.role === "contact" ? req.user.contact_id : null));
  } catch (error) {
    writeError(res, error);
  }
}
async function get(req, res) {
  try {
    res.json(
      await service.getSalesOrder(parseId(req.params.id, "sales order"), req.user.role === "contact" ? req.user.contact_id : null),
    );
  } catch (error) {
    writeError(res, error);
  }
}
async function create(req, res) {
  try {
    res.status(201).json(await service.createSalesOrder(req.body, req.user.id));
  } catch (error) {
    writeError(res, error);
  }
}
async function update(req, res) {
  try {
    res.json(
      await service.updateSalesOrder(
        parseId(req.params.id, "sales order"),
        req.body,
        req.user.id,
      ),
    );
  } catch (error) {
    writeError(res, error);
  }
}
async function remove(req, res) {
  try {
    res.json({
      message: "Sales order deleted successfully",
      salesOrder: await service.deleteSalesOrder(
        parseId(req.params.id, "sales order"),
      ),
    });
  } catch (error) {
    writeError(res, error);
  }
}
async function listLines(req, res) {
  try {
    res.json(
      await service.getLines(parseId(req.params.salesOrderId, "sales order"), req.user.role === "contact" ? req.user.contact_id : null),
    );
  } catch (error) {
    writeError(res, error);
  }
}
async function getLine(req, res) {
  try {
    res.json(
      await service.getLine(
        parseId(req.params.salesOrderId, "sales order"),
        parseId(req.params.id, "sales order line"),
        req.user.role === "contact" ? req.user.contact_id : null,
      ),
    );
  } catch (error) {
    writeError(res, error);
  }
}
async function createLine(req, res) {
  try {
    res
      .status(201)
      .json(
        await service.createLine(
          parseId(req.params.salesOrderId, "sales order"),
          req.body,
        ),
      );
  } catch (error) {
    writeError(res, error);
  }
}
async function updateLine(req, res) {
  try {
    res.json(
      await service.updateLine(
        parseId(req.params.salesOrderId, "sales order"),
        parseId(req.params.id, "sales order line"),
        req.body,
      ),
    );
  } catch (error) {
    writeError(res, error);
  }
}
async function removeLine(req, res) {
  try {
    res.json({
      message: "Sales order line deleted successfully",
      salesOrderLine: await service.deleteLine(
        parseId(req.params.salesOrderId, "sales order"),
        parseId(req.params.id, "sales order line"),
      ),
    });
  } catch (error) {
    writeError(res, error);
  }
}
async function convertToInvoice(req, res) {
  try {
    res
      .status(201)
      .json(
        await service.convertToInvoice(parseId(req.params.id, "sales order"), req.user.id),
      );
  } catch (error) {
    writeError(res, error);
  }
}
module.exports = {
  list,
  get,
  create,
  update,
  remove,
  listLines,
  getLine,
  createLine,
  updateLine,
  removeLine,
  convertToInvoice,
};
