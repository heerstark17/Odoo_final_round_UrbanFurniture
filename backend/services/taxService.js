const taxModel = require("../models/taxModel");

function parseAccountId(value, label) {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error(`${label} is required`);
    }

    return id;
}

function normalizeTax(data = {}) {
    if (typeof data.name !== "string" || data.name.trim() === "") {
        throw new Error("Tax name is required");
    }

    if (
        data.rate === undefined ||
        data.rate === null ||
        String(data.rate).trim() === ""
    ) {
        throw new Error("Tax rate is required");
    }

    const rate = Number(data.rate);

    if (!Number.isFinite(rate)) {
        throw new Error("Tax rate must be a number");
    }

    if (rate < 0 || rate > 100) {
        throw new Error("Tax rate must be between 0 and 100");
    }

    return {
        name: data.name.trim(),
        rate,
        salesTaxAccountId: parseAccountId(
            data.salesTaxAccountId,
            "Sales tax account"
        ),
        purchaseTaxAccountId: parseAccountId(
            data.purchaseTaxAccountId,
            "Purchase tax account"
        )
    };
}

async function validateAccounts(data) {
    const salesAccount =
        await taxModel.getActiveAccountById(data.salesTaxAccountId);

    if (!salesAccount) {
        throw new Error("Sales tax account not found or inactive");
    }

    if (salesAccount.account_type !== "liability") {
        throw new Error("Sales tax account must be a liability account");
    }

    const purchaseAccount =
        await taxModel.getActiveAccountById(data.purchaseTaxAccountId);

    if (!purchaseAccount) {
        throw new Error("Purchase tax account not found or inactive");
    }

    if (purchaseAccount.account_type !== "asset") {
        throw new Error("Purchase tax account must be an asset account");
    }
}

async function getTaxes() {
    return await taxModel.getAllTaxes();
}

async function getTax(id) {
    const tax = await taxModel.getTaxById(id);

    if (!tax) {
        throw new Error("Tax not found");
    }

    return tax;
}

async function createTax(data) {
    const taxData = normalizeTax(data);

    await validateAccounts(taxData);

    return await taxModel.createTax(taxData);
}

async function updateTax(id, data) {
    const taxData = normalizeTax(data);

    const existingTax = await taxModel.getTaxById(id);

    if (!existingTax) {
        throw new Error("Tax not found");
    }

    await validateAccounts(taxData);

    return await taxModel.updateTax(id, taxData);
}

async function deleteTax(id) {
    const existingTax = await taxModel.getTaxById(id);

    if (!existingTax) {
        throw new Error("Tax not found");
    }

    return await taxModel.deactivateTax(id);
}

module.exports = {
    getTaxes,
    getTax,
    createTax,
    updateTax,
    deleteTax
};
