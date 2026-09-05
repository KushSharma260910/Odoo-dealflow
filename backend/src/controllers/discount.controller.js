const discountService = require("../services/discount.service");

const discountEngine =
    require("../engines/discount/discount.engine");


async function createDiscountRule(req, res) {

    try {

        const {
            name,
            customer_tier,
            category_id,
            max_discount_percent
        } = req.body;


        if (
            !name ||
            !customer_tier ||
            !category_id ||
            max_discount_percent === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "name, customer_tier, category_id and max_discount_percent are required"
            });
        }


        if (
            max_discount_percent < 0 ||
            max_discount_percent > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "max_discount_percent must be between 0 and 100"
            });
        }


        const rule =
            await discountService.createDiscountRule(req.body);


        res.status(201).json({
            success: true,
            message: "Discount rule created successfully",
            data: rule
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to create discount rule",
            error: error.message
        });
    }
}


async function getAllDiscountRules(req, res) {

    try {

        const rules =
            await discountService.getAllDiscountRules();


        res.json({
            success: true,
            data: rules
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch discount rules"
        });
    }
}


async function getDiscountRuleById(req, res) {

    try {

        const rule =
            await discountService.getDiscountRuleById(
                req.params.id
            );


        if (!rule) {
            return res.status(404).json({
                success: false,
                message: "Discount rule not found"
            });
        }


        res.json({
            success: true,
            data: rule
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch discount rule"
        });
    }
}


async function updateDiscountRule(req, res) {

    try {

        const rule =
            await discountService.updateDiscountRule(
                req.params.id,
                req.body
            );


        if (!rule) {
            return res.status(404).json({
                success: false,
                message: "Discount rule not found"
            });
        }


        res.json({
            success: true,
            message: "Discount rule updated successfully",
            data: rule
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update discount rule",
            error: error.message
        });
    }
}


async function deleteDiscountRule(req, res) {

    try {

        const deleted =
            await discountService.deactivateDiscountRule(
                req.params.id
            );


        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Discount rule not found"
            });
        }


        res.json({
            success: true,
            message: "Discount rule deactivated successfully"
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to deactivate discount rule"
        });
    }
}
  async function evaluateDiscount(req, res) {

    try {

        const quotationId = req.params.quotationId;

        const result =
            await discountEngine.evaluateQuotationDiscount(
                quotationId
            );

        res.json({
            success: true,
            message: "Discount evaluation completed",
            data: result
        });

    } catch (error) {

        console.error(error);

        if (error.message === "Quotation not found") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === "Quotation has no items") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to evaluate discount",
            error: error.message
        });
    }
}


module.exports = {
    createDiscountRule,
    getAllDiscountRules,
    getDiscountRuleById,
    updateDiscountRule,
    deleteDiscountRule,
    evaluateDiscount
};