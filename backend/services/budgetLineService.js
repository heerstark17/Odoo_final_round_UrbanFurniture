const model = require("../models/budgetLineModel");
function normalise(data = {}) { const analyticAccountId = Number(data.analyticAccountId); const plannedAmount = Number(data.plannedAmount); if (!Number.isInteger(analyticAccountId) || analyticAccountId <= 0) throw new Error("Analytic account is required"); if (data.plannedAmount === undefined || !Number.isFinite(plannedAmount) || plannedAmount < 0) throw new Error("Planned amount must be greater than or equal to 0"); return { analyticAccountId, plannedAmount }; }
async function ensureBudget(id) { if (!await model.budgetExists(id)) throw new Error("Budget not found"); }
async function getLines(budgetId) { await ensureBudget(budgetId); return model.getAll(budgetId); }
async function getLine(budgetId, id) { await ensureBudget(budgetId); const line = await model.getById(budgetId, id); if (!line) throw new Error("Budget line not found for this budget"); return line; }
async function validate(data) { if (!await model.activeAnalytic(data.analyticAccountId)) throw new Error("Analytic account not found or inactive"); }
async function createLine(budgetId, data) { await ensureBudget(budgetId); data = normalise(data); await validate(data); return model.create(budgetId, data); }
async function updateLine(budgetId, id, data) { await getLine(budgetId, id); data = normalise(data); await validate(data); return model.update(budgetId, id, data); }
async function deleteLine(budgetId, id) { await getLine(budgetId, id); return model.remove(budgetId, id); }
module.exports = { getLines, getLine, createLine, updateLine, deleteLine };
