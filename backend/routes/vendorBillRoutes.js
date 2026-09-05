const express = require("express");
const controller = require("../controllers/vendorBillController");

const router = express.Router();

router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:billId/lines", controller.listLines);
router.post("/:billId/lines", controller.createLine);
router.get("/:billId/lines/:id", controller.getLine);
router.put("/:billId/lines/:id", controller.updateLine);
router.delete("/:billId/lines/:id", controller.removeLine);
router.get("/:id", controller.get);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
