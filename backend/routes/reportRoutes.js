const express = require("express");
const controller = require("../controllers/reportController");

const router = express.Router();

router.get("/profit-loss", controller.profitLoss);
router.get("/balance-sheet", controller.balanceSheet);
router.get("/budget", controller.budget);

module.exports = router;
