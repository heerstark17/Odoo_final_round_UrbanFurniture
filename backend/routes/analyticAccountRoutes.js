const express = require("express");
const analyticAccountController = require("../controllers/analyticAccountController");
const router = express.Router();
router.get("/", analyticAccountController.list);
router.get("/:id", analyticAccountController.get);
router.post("/", analyticAccountController.create);
router.put("/:id", analyticAccountController.update);
router.delete("/:id", analyticAccountController.remove);
module.exports = router;
