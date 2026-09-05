const reportService = require("../services/reportService");

async function getDashboard(req, res) {
  try {
    res.json(await reportService.getDashboard(req.query));
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message });
  }
}

module.exports = { getDashboard };
