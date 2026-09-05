const service = require("../services/vendorBillService");

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
    message: error.code === "23505" ? "Vendor bill number or purchase order relationship already exists" : error.message,
  });
}

async function list(req, res) { try { res.json(await service.getVendorBills()); } catch (error) { writeError(res, error); } }
async function get(req, res) { try { res.json(await service.getVendorBill(parseId(req.params.id, "vendor bill"))); } catch (error) { writeError(res, error); } }
async function create(req, res) { try { res.status(201).json(await service.createVendorBill(req.body)); } catch (error) { writeError(res, error); } }
async function update(req, res) { try { res.json(await service.updateVendorBill(parseId(req.params.id, "vendor bill"), req.body)); } catch (error) { writeError(res, error); } }
async function remove(req, res) { try { res.json({ message: "Vendor bill deleted successfully", vendorBill: await service.deleteVendorBill(parseId(req.params.id, "vendor bill")) }); } catch (error) { writeError(res, error); } }
async function listLines(req, res) { try { res.json(await service.getLines(parseId(req.params.billId, "vendor bill"))); } catch (error) { writeError(res, error); } }
async function getLine(req, res) { try { res.json(await service.getLine(parseId(req.params.billId, "vendor bill"), parseId(req.params.id, "vendor bill line"))); } catch (error) { writeError(res, error); } }
async function createLine(req, res) { try { res.status(201).json(await service.createLine(parseId(req.params.billId, "vendor bill"), req.body)); } catch (error) { writeError(res, error); } }
async function updateLine(req, res) { try { res.json(await service.updateLine(parseId(req.params.billId, "vendor bill"), parseId(req.params.id, "vendor bill line"), req.body)); } catch (error) { writeError(res, error); } }
async function removeLine(req, res) { try { res.json({ message: "Vendor bill line deleted successfully", vendorBillLine: await service.deleteLine(parseId(req.params.billId, "vendor bill"), parseId(req.params.id, "vendor bill line")) }); } catch (error) { writeError(res, error); } }

module.exports = { list, get, create, update, remove, listLines, getLine, createLine, updateLine, removeLine };
