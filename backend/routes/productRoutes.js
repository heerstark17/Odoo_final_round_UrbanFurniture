const express = require("express");
const productController = require("../controllers/productController");
const { requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", productController.getProducts);
router.get("/:id", productController.getProduct);
router.post("/", requireRole("admin", "accountant"), productController.createProduct);
router.put("/:id", requireRole("admin", "accountant"), productController.updateProduct);
router.delete("/:id", requireRole("admin", "accountant"), productController.deleteProduct);

module.exports = router;