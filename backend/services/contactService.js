const contactModel = require("../models/contactModel");

const VALID_CONTACT_TYPES = ["customer", "vendor"];

function normalizeOptional(value) {
    if (value === undefined || value === null) {
        return null;
    }

    const trimmed = String(value).trim();

    return trimmed === "" ? null : trimmed;
}

function validateContactData(data) {
    const name = String(data.name ?? "").trim();
    const contactType = String(data.contactType ?? "").trim().toLowerCase();

    if (!name) {
        const error = new Error("Name is required");
        error.statusCode = 400;
        throw error;
    }

    if (!VALID_CONTACT_TYPES.includes(contactType)) {
        const error = new Error(
            "contactType must be customer, vendor, or both"
        );
        error.statusCode = 400;
        throw error;
    }

    return {
        name,
        contactType,
        email: normalizeOptional(data.email),
        phone: normalizeOptional(data.phone),
        city: normalizeOptional(data.city),
        state: normalizeOptional(data.state),
        pincode: normalizeOptional(data.pincode),
        profileImageUrl: normalizeOptional(data.profileImageUrl)
    };
}

async function getAllContacts() {
    return contactModel.getAllContacts();
}

async function getContactById(id) {
    const contact = await contactModel.getContactById(id);

    if (!contact) {
        const error = new Error("Contact not found");
        error.statusCode = 404;
        throw error;
    }

    return contact;
}

async function createContact(data) {
    const contactData = validateContactData(data);

    return contactModel.createContact(contactData);
}

async function updateContact(id, data) {
    const contactData = validateContactData(data);

    const existingContact = await contactModel.getContactById(id);

    if (!existingContact) {
        const error = new Error("Contact not found");
        error.statusCode = 404;
        throw error;
    }

    return contactModel.updateContact(id, contactData);
}

async function deactivateContact(id) {
    const existingContact = await contactModel.getContactById(id);

    if (!existingContact) {
        const error = new Error("Contact not found");
        error.statusCode = 404;
        throw error;
    }

    if (!existingContact.is_active) {
        const error = new Error("Contact is already inactive");
        error.statusCode = 400;
        throw error;
    }

    return contactModel.deactivateContact(id);
}

module.exports = {
    getAllContacts,
    getContactById,
    createContact,
    updateContact,
    deactivateContact
};