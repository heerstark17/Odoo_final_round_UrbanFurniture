const express = require("express");
const taxController = require("../controllers/taxController");
const { requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", taxController.getTaxes);
router.get("/:id", taxController.getTax);
router.post("/", requireRole("admin", "accountant"), taxController.createTax);
router.put("/:id", requireRole("admin", "accountant"), taxController.updateTax);
router.delete("/:id", requireRole("admin", "accountant"), taxController.deleteTax);

module.exports = router;