const taxService = require("../services/taxService");

function parseId(id) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
        throw new Error("Invalid tax ID");
    }

    return parsedId;
}

function sendWriteError(res, error) {
    if (error.code === "23505") {
        return res.status(409).json({
            message: "Tax name already exists"
        });
    }

    return res.status(400).json({
        message: error.message
    });
}

async function getTaxes(req, res) {
    try {
        const taxes = await taxService.getTaxes();

        res.status(200).json(taxes);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}

async function getTax(req, res) {
    try {
        const id = parseId(req.params.id);

        const tax = await taxService.getTax(id);

        res.status(200).json(tax);
    } catch (error) {
        if (error.message === "Invalid tax ID") {
            return res.status(400).json({
                message: error.message
            });
        }

        if (error.message === "Tax not found") {
            return res.status(404).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: error.message
        });
    }
}

async function createTax(req, res) {
    try {
        const tax = await taxService.createTax(req.body);

        res.status(201).json(tax);
    } catch (error) {
        sendWriteError(res, error);
    }
}

async function updateTax(req, res) {
    try {
        const id = parseId(req.params.id);

        const tax = await taxService.updateTax(
            id,
            req.body
        );

        res.status(200).json(tax);
    } catch (error) {
        if (error.message === "Invalid tax ID") {
            return res.status(400).json({
                message: error.message
            });
        }

        if (error.message === "Tax not found") {
            return res.status(404).json({
                message: error.message
            });
        }

        sendWriteError(res, error);
    }
}

async function deleteTax(req, res) {
    try {
        const id = parseId(req.params.id);

        const tax = await taxService.deleteTax(id);

        res.status(200).json({
            message: "Tax deactivated successfully",
            tax
        });
    } catch (error) {
        if (error.message === "Invalid tax ID") {
            return res.status(400).json({
                message: error.message
            });
        }

        if (error.message === "Tax not found") {
            return res.status(404).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: error.message
        });
    }
}

module.exports = {
    getTaxes,
    getTax,
    createTax,
    updateTax,
    deleteTax
};
