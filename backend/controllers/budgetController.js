const service = require("../services/budgetService");
function parseId(value) { const id = Number(value); if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid budget ID"); return id; }
function status(error) { return error.message === "Budget not found" ? 404 : 400; }
async function list(req, res) { try { res.json(await service.getBudgets()); } catch (error) { res.status(500).json({ message: "Unable to retrieve budgets" }); } }
async function get(req, res) { try { res.json(await service.getBudget(parseId(req.params.id))); } catch (error) { res.status(status(error)).json({ message: error.message }); } }
async function create(req, res) { try { res.status(201).json(await service.createBudget(req.body)); } catch (error) { res.status(error.code === "23505" ? 409 : 400).json({ message: error.code === "23505" ? "Budget revision relationship already exists" : error.message }); } }
async function update(req, res) { try { res.json(await service.updateBudget(parseId(req.params.id), req.body)); } catch (error) { res.status(error.code === "23505" ? 409 : status(error)).json({ message: error.code === "23505" ? "Budget revision relationship already exists" : error.message }); } }
async function remove(req, res) { try { res.json({ message: "Budget deleted successfully", budget: await service.deleteBudget(parseId(req.params.id)) }); } catch (error) { res.status(status(error)).json({ message: error.message }); } }
module.exports = { list, get, create, update, remove };
