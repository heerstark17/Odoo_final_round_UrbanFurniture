const express = require("express");
const controller = require("../controllers/purchaseOrderController");

const router = express.Router();

router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:purchaseOrderId/lines", controller.listLines);
router.post("/:purchaseOrderId/lines", controller.createLine);
router.get("/:purchaseOrderId/lines/:id", controller.getLine);
router.put("/:purchaseOrderId/lines/:id", controller.updateLine);
router.delete("/:purchaseOrderId/lines/:id", controller.removeLine);
router.post("/:id/convert-to-bill", controller.convertToBill);
router.get("/:id", controller.get);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
