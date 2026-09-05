const chartOfAccountService =
    require("../services/chartOfAccountService");

function parseId(id) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
        throw new Error("Invalid account ID");
    }

    return parsedId;
}

async function getAccounts(req, res) {
    try {
        const accounts =
            await chartOfAccountService.getAccounts();

        res.status(200).json(accounts);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}

async function getAccount(req, res) {
    try {
        const id = parseId(req.params.id);

        const account =
            await chartOfAccountService.getAccount(id);

        res.status(200).json(account);
    } catch (error) {
        if (
            error.message === "Invalid account ID" ||
            error.message === "Account not found"
        ) {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: error.message
        });
    }
}

async function createAccount(req, res) {
    try {
        const account =
            await chartOfAccountService.createAccount(req.body);

        res.status(201).json(account);
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
}

async function updateAccount(req, res) {
    try {
        const id = parseId(req.params.id);

        const account =
            await chartOfAccountService.updateAccount(
                id,
                req.body
            );

        res.status(200).json(account);
    } catch (error) {
        if (
            error.message === "Invalid account ID" ||
            error.message === "Account not found"
        ) {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(400).json({
            message: error.message
        });
    }
}

async function deleteAccount(req, res) {
    try {
        const id = parseId(req.params.id);

        const account =
            await chartOfAccountService.deleteAccount(id);

        res.status(200).json({
            message: "Account deactivated successfully",
            account
        });
    } catch (error) {
        if (
            error.message === "Invalid account ID" ||
            error.message === "Account not found"
        ) {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: error.message
        });
    }
}

module.exports = {
    getAccounts,
    getAccount,
    createAccount,
    updateAccount,
    deleteAccount
};