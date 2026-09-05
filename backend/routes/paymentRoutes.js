const express = require("express");
const controller = require("../controllers/paymentController");
const { requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireRole("admin", "accountant", "contact"), controller.list);
router.post("/", requireRole("admin", "accountant"), controller.create);
router.get("/:id", requireRole("admin", "accountant", "contact"), controller.get);
router.put("/:id", requireRole("admin", "accountant"), controller.update);
router.delete("/:id", requireRole("admin", "accountant"), controller.remove);

module.exports = router;
