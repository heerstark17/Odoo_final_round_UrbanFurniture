const productModel = require("../models/productModel");

const PRODUCT_TYPES = ["goods", "service", "combo"];

function validateProduct(data) {
    if (!data.name || data.name.trim() === "") {
        throw new Error("Product name is required");
    }

    if (!data.productType) {
        throw new Error("Product type is required");
    }

    if (!PRODUCT_TYPES.includes(data.productType)) {
        throw new Error(
            "Product type must be goods, service, or combo"
        );
    }

    if (
        data.salesPrice === undefined ||
        data.salesPrice === null ||
        data.salesPrice === ""
    ) {
        throw new Error("Sales price is required");
    }

    if (Number.isNaN(Number(data.salesPrice))) {
        throw new Error("Sales price must be a number");
    }

    if (Number(data.salesPrice) < 0) {
        throw new Error("Sales price cannot be negative");
    }

    if (
        data.purchasePrice === undefined ||
        data.purchasePrice === null ||
        data.purchasePrice === ""
    ) {
        throw new Error("Purchase price is required");
    }

    if (Number.isNaN(Number(data.purchasePrice))) {
        throw new Error("Purchase price must be a number");
    }

    if (Number(data.purchasePrice) < 0) {
        throw new Error("Purchase price cannot be negative");
    }
}

async function getProducts() {
    return await productModel.getAllProducts();
}

async function getProduct(id) {
    const product = await productModel.getProductById(id);

    if (!product) {
        throw new Error("Product not found");
    }

    return product;
}

async function createProduct(data) {
    validateProduct(data);

    return await productModel.createProduct(data);
}

async function updateProduct(id, data) {
    validateProduct(data);

    const existingProduct = await productModel.getProductById(id);

    if (!existingProduct) {
        throw new Error("Product not found");
    }

    return await productModel.updateProduct(id, data);
}

async function deleteProduct(id) {
    const existingProduct = await productModel.getProductById(id);

    if (!existingProduct) {
        throw new Error("Product not found");
    }

    return await productModel.deactivateProduct(id);
}

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
};