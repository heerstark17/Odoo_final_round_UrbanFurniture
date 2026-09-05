const contactService = require("../services/contactService");

async function getContacts(req, res, next) {
    try {
        const contacts = await contactService.getAllContacts();

        res.status(200).json({
            success: true,
            data: contacts
        });
    } catch (error) {
        next(error);
    }
}

async function getContact(req, res, next) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            const error = new Error("Invalid contact ID");
            error.statusCode = 400;
            throw error;
        }

        const contact = await contactService.getContactById(id);

        res.status(200).json({
            success: true,
            data: contact
        });
    } catch (error) {
        next(error);
    }
}

async function createContact(req, res, next) {
    try {
        const contact = await contactService.createContact(req.body);

        res.status(201).json({
            success: true,
            message: "Contact created successfully",
            data: contact
        });
    } catch (error) {
        next(error);
    }
}

async function updateContact(req, res, next) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            const error = new Error("Invalid contact ID");
            error.statusCode = 400;
            throw error;
        }

        const contact = await contactService.updateContact(
            id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Contact updated successfully",
            data: contact
        });
    } catch (error) {
        next(error);
    }
}

async function deleteContact(req, res, next) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            const error = new Error("Invalid contact ID");
            error.statusCode = 400;
            throw error;
        }

        const contact = await contactService.deactivateContact(id);

        res.status(200).json({
            success: true,
            message: "Contact deactivated successfully",
            data: contact
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getContacts,
    getContact,
    createContact,
    updateContact,
    deleteContact
};