const chartOfAccountModel = require("../models/chartOfAccountModel");

const ACCOUNT_TYPES = [
    "asset",
    "liability",
    "expense",
    "income",
    "capital"
];

function validateAccount(data) {
    if (!data.accountCode || data.accountCode.trim() === "") {
        throw new Error("Account code is required");
    }

    if (!data.accountName || data.accountName.trim() === "") {
        throw new Error("Account name is required");
    }

    if (!data.accountType) {
        throw new Error("Account type is required");
    }

    if (!ACCOUNT_TYPES.includes(data.accountType)) {
        throw new Error(
            "Account type must be asset, liability, expense, income, or capital"
        );
    }
}

async function getAccounts() {
    return await chartOfAccountModel.getAllAccounts();
}

async function getAccount(id) {
    const account = await chartOfAccountModel.getAccountById(id);

    if (!account) {
        throw new Error("Account not found");
    }

    return account;
}

async function createAccount(data) {
    validateAccount(data);

    return await chartOfAccountModel.createAccount(data);
}

async function updateAccount(id, data) {
    validateAccount(data);

    const existingAccount =
        await chartOfAccountModel.getAccountById(id);

    if (!existingAccount) {
        throw new Error("Account not found");
    }

    return await chartOfAccountModel.updateAccount(id, data);
}

async function deleteAccount(id) {
    const existingAccount =
        await chartOfAccountModel.getAccountById(id);

    if (!existingAccount) {
        throw new Error("Account not found");
    }

    return await chartOfAccountModel.deactivateAccount(id);
}

module.exports = {
    getAccounts,
    getAccount,
    createAccount,
    updateAccount,
    deleteAccount
};