const express = require("express");

const taxController = require("../controllers/taxController");

const router = express.Router();

router.get("/", taxController.getTaxes);

router.get("/:id", taxController.getTax);

router.post("/", taxController.createTax);

router.put("/:id", taxController.updateTax);

router.delete("/:id", taxController.deleteTax);

module.exports = router;