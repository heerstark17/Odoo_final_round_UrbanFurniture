const express = require("express");

const chartOfAccountController =
    require("../controllers/chartOfAccountController");

const router = express.Router();

router.get("/", chartOfAccountController.getAccounts);

router.get("/:id", chartOfAccountController.getAccount);

router.post("/", chartOfAccountController.createAccount);

router.put("/:id", chartOfAccountController.updateAccount);

router.delete("/:id", chartOfAccountController.deleteAccount);

module.exports = router;