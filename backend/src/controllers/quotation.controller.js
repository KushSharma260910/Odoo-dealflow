const quotationService = require("../services/quotation.service");


// Create quotation
async function createQuotation(req, res) {

    try {

        const {
            customer_id,
            sales_rep_id
        } = req.body;


        if (!customer_id || !sales_rep_id) {

            return res.status(400).json({
                success: false,
                message: "customer_id and sales_rep_id are required"
            });

        }


        const quotation =
            await quotationService.createQuotation(req.body);


        res.status(201).json({
            success: true,
            message: "Quotation created successfully",
            data: quotation
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to create quotation",
            error: error.message
        });

    }
}


// Get all
async function getAllQuotations(req, res) {

    try {

        const quotations =
            await quotationService.getAllQuotations();


        res.json({
            success: true,
            data: quotations
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch quotations"
        });

    }
}


// Get by ID
async function getQuotationById(req, res) {

    try {

        const quotation =
            await quotationService.getQuotationById(
                req.params.id
            );


        if (!quotation) {

            return res.status(404).json({
                success: false,
                message: "Quotation not found"
            });

        }


        res.json({
            success: true,
            data: quotation
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch quotation"
        });

    }
}


// Update
async function updateQuotation(req, res) {

    try {

        const quotation =
            await quotationService.updateQuotation(
                req.params.id,
                req.body
            );


        if (!quotation) {

            return res.status(404).json({
                success: false,
                message: "Quotation not found"
            });

        }


        res.json({
            success: true,
            message: "Quotation updated successfully",
            data: quotation
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update quotation",
            error: error.message
        });

    }
}


// Add item
async function addQuotationItem(req, res) {

    try {

        const {
            product_id,
            quantity
        } = req.body;


        if (!product_id || !quantity) {

            return res.status(400).json({
                success: false,
                message: "product_id and quantity are required"
            });

        }


        if (quantity <= 0) {

            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than 0"
            });

        }


        const item =
            await quotationService.addQuotationItem(
                req.params.id,
                req.body
            );


        res.status(201).json({
            success: true,
            message: "Quotation item added successfully",
            data: item
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to add quotation item",
            error: error.message
        });

    }
}


// Delete item
async function deleteQuotationItem(req, res) {

    try {

        const deleted =
            await quotationService.deleteQuotationItem(
                req.params.id,
                req.params.itemId
            );


        if (!deleted) {

            return res.status(404).json({
                success: false,
                message: "Quotation item not found"
            });

        }


        res.json({
            success: true,
            message: "Quotation item deleted successfully"
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to delete quotation item"
        });

    }
}


module.exports = {
    createQuotation,
    getAllQuotations,
    getQuotationById,
    updateQuotation,
    addQuotationItem,
    deleteQuotationItem
};