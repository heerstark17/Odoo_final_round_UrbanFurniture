const express = require("express");
const journalController = require("../controllers/journalController");
const router = express.Router();
router.get("/", journalController.list);
router.get("/:id", journalController.get);
router.post("/", journalController.create);
router.put("/:id", journalController.update);
router.delete("/:id", journalController.remove);
module.exports = router;
