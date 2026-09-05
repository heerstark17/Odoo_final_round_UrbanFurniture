const express = require("express");
const controller = require("../controllers/journalEntryController");

const router = express.Router();
router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:journalEntryId/lines", controller.listLines);
router.post("/:journalEntryId/lines", controller.createLine);
router.get("/:journalEntryId/lines/:id", controller.getLine);
router.put("/:journalEntryId/lines/:id", controller.updateLine);
router.delete("/:journalEntryId/lines/:id", controller.removeLine);
router.get("/:id", controller.get);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);
module.exports = router;
