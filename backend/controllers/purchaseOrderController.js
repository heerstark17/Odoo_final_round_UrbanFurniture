const service = require("../services/purchaseOrderService");

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
  res.status(error.statusCode || (error.code === "23505" ? 409 : 400)).json({
    message: error.code === "23505" ? "Purchase order number already exists" : error.message,
  });
}

async function list(req, res) { try { res.json(await service.getPurchaseOrders(req.user.role === "contact" ? req.user.contact_id : null)); } catch (error) { writeError(res, error); } }
async function get(req, res) { try { res.json(await service.getPurchaseOrder(parseId(req.params.id, "purchase order"), req.user.role === "contact" ? req.user.contact_id : null)); } catch (error) { writeError(res, error); } }
async function create(req, res) { try { res.status(201).json(await service.createPurchaseOrder(req.body, req.user.id)); } catch (error) { writeError(res, error); } }
async function update(req, res) { try { res.json(await service.updatePurchaseOrder(parseId(req.params.id, "purchase order"), req.body, req.user.id)); } catch (error) { writeError(res, error); } }
async function remove(req, res) { try { res.json({ message: "Purchase order deleted successfully", purchaseOrder: await service.deletePurchaseOrder(parseId(req.params.id, "purchase order")) }); } catch (error) { writeError(res, error); } }
async function listLines(req, res) { try { res.json(await service.getLines(parseId(req.params.purchaseOrderId, "purchase order"), req.user.role === "contact" ? req.user.contact_id : null)); } catch (error) { writeError(res, error); } }
async function getLine(req, res) { try { res.json(await service.getLine(parseId(req.params.purchaseOrderId, "purchase order"), parseId(req.params.id, "purchase order line"), req.user.role === "contact" ? req.user.contact_id : null)); } catch (error) { writeError(res, error); } }
async function createLine(req, res) { try { res.status(201).json(await service.createLine(parseId(req.params.purchaseOrderId, "purchase order"), req.body)); } catch (error) { writeError(res, error); } }
async function updateLine(req, res) { try { res.json(await service.updateLine(parseId(req.params.purchaseOrderId, "purchase order"), parseId(req.params.id, "purchase order line"), req.body)); } catch (error) { writeError(res, error); } }
async function removeLine(req, res) { try { res.json({ message: "Purchase order line deleted successfully", purchaseOrderLine: await service.deleteLine(parseId(req.params.purchaseOrderId, "purchase order"), parseId(req.params.id, "purchase order line")) }); } catch (error) { writeError(res, error); } }
async function convertToBill(req, res) { try { res.status(201).json(await service.convertToBill(parseId(req.params.id, "purchase order"), req.user.id)); } catch (error) { writeError(res, error); } }

module.exports = { list, get, create, update, remove, listLines, getLine, createLine, updateLine, removeLine, convertToBill };
