const productService = require("../services/product.service");

async function createProduct(req, res) {
    try {
        const {
            category_id,
            name,
            price
        } = req.body;

        if (!category_id || !name || price === undefined) {
            return res.status(400).json({
                success: false,
                message: "category_id, name and price are required"
            });
        }

        if (price < 0) {
            return res.status(400).json({
                success: false,
                message: "Price cannot be negative"
            });
        }

        const product = await productService.createProduct(req.body);

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to create product",
            error: error.message
        });
    }
}

async function getAllProducts( res) {
    try {
        const products = await productService.getAllProducts();

        res.json({
            success: true,
            data: products
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch products"
        });
    }
}

async function getProductById(req, res) {
    try {
        const product = await productService.getProductById(
            req.params.id
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            data: product
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch product"
        });
    }
}

async function updateProduct(req, res) {
    try {
        const product = await productService.updateProduct(
            req.params.id,
            req.body
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            message: "Product updated successfully",
            data: product
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update product",
            error: error.message
        });
    }
}

async function deleteProduct(req, res) {
    try {
        const deleted = await productService.deactivateProduct(
            req.params.id
        );

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            message: "Product deactivated successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to deactivate product",
            error: error.message
        });
    }
}

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
};