const express = require("express");
const controller = require("../controllers/purchaseOrderController");
const { requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireRole("admin", "accountant", "contact"), controller.list);
router.post("/", requireRole("admin", "accountant", "contact"), controller.create);
router.get("/:purchaseOrderId/lines", requireRole("admin", "accountant", "contact"), controller.listLines);
router.post("/:purchaseOrderId/lines", requireRole("admin", "accountant", "contact"), controller.createLine);
router.get("/:purchaseOrderId/lines/:id", requireRole("admin", "accountant", "contact"), controller.getLine);
router.put("/:purchaseOrderId/lines/:id", requireRole("admin", "accountant", "contact"), controller.updateLine);
router.delete("/:purchaseOrderId/lines/:id", requireRole("admin", "accountant", "contact"), controller.removeLine);
router.post("/:id/convert-to-bill", requireRole("admin", "accountant"), controller.convertToBill);
router.get("/:id", requireRole("admin", "accountant", "contact"), controller.get);
router.put("/:id", requireRole("admin", "accountant", "contact"), controller.update);
router.delete("/:id", requireRole("admin", "accountant", "contact"), controller.remove);

module.exports = router;
