const service = require("../services/reportService");

async function profitLoss(req, res) {
  try {
    res.json(await service.getProfitAndLoss(req.query));
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message });
  }
}

async function balanceSheet(req, res) {
  try {
    res.json(await service.getBalanceSheet(req.query));
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message });
  }
}

async function budget(req, res) {
  try {
    res.json(await service.getBudgetReport(req.query));
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message });
  }
}

module.exports = { profitLoss, balanceSheet, budget };
