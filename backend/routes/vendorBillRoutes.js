const express = require("express");
const controller = require("../controllers/vendorBillController");
const { requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireRole("admin", "accountant", "contact"), controller.list);
router.post("/", requireRole("admin", "accountant"), controller.create);
router.get("/:billId/lines", requireRole("admin", "accountant", "contact"), controller.listLines);
router.post("/:billId/lines", requireRole("admin", "accountant"), controller.createLine);
router.get("/:billId/lines/:id", requireRole("admin", "accountant", "contact"), controller.getLine);
router.put("/:billId/lines/:id", requireRole("admin", "accountant"), controller.updateLine);
router.delete("/:billId/lines/:id", requireRole("admin", "accountant"), controller.removeLine);
router.get("/:id/pdf", requireRole("admin", "accountant", "contact"), controller.downloadPdf);
router.get("/:id", requireRole("admin", "accountant", "contact"), controller.get);
router.put("/:id", requireRole("admin", "accountant"), controller.update);
router.delete("/:id", requireRole("admin", "accountant"), controller.remove);

module.exports = router;
