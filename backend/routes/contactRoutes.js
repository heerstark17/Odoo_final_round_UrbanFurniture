const express = require("express");

const contactController = require("../controllers/contactController");
const { requireRole, requireOwnContact } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireRole("admin", "accountant"), contactController.getContacts);

router.get("/:id", requireRole("admin", "accountant", "contact"), (req, res, next) => {
	if (req.user.role === "contact") return requireOwnContact(req, res, next);
	return next();
}, contactController.getContact);

router.post("/", requireRole("admin", "accountant"), contactController.createContact);

router.put("/:id", requireRole("admin", "accountant"), contactController.updateContact);

router.delete("/:id", requireRole("admin", "accountant"), contactController.deleteContact);

module.exports = router;