const productService = require("../services/productService");

function parseId(id) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
        throw new Error("Invalid product ID");
    }

    return parsedId;
}

async function getProducts(req, res) {
    try {
        const products = await productService.getProducts();

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}

async function getProduct(req, res) {
    try {
        const id = parseId(req.params.id);

        const product = await productService.getProduct(id);

        res.status(200).json(product);
    } catch (error) {
        if (
            error.message === "Invalid product ID" ||
            error.message === "Product not found"
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

async function createProduct(req, res) {
    try {
        const product = await productService.createProduct(req.body);

        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
}

async function updateProduct(req, res) {
    try {
        const id = parseId(req.params.id);

        const product = await productService.updateProduct(
            id,
            req.body
        );

        res.status(200).json(product);
    } catch (error) {
        if (
            error.message === "Invalid product ID" ||
            error.message === "Product not found"
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

async function deleteProduct(req, res) {
    try {
        const id = parseId(req.params.id);

        const product = await productService.deleteProduct(id);

        res.status(200).json({
            message: "Product deactivated successfully",
            product
        });
    } catch (error) {
        if (
            error.message === "Invalid product ID" ||
            error.message === "Product not found"
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
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
};