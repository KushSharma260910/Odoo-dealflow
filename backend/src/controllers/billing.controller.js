const billingEngine =
    require("../engines/billing/billing.engine");


async function createHybridBilling(req, res) {

    try {

        const result =
            await billingEngine.createHybridBilling(
                req.params.quotationId
            );

        res.status(201).json({
            success: true,
            message: "Hybrid billing created successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


async function getInvoice(req, res) {

    try {

        const result =
            await billingEngine.getInvoiceById(
                req.params.id
            );

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
}


async function getBillingSchedule(req, res) {

    try {

        const result =
            await billingEngine.getBillingSchedule(
                req.params.id
            );

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
}


async function getBillingByOrder(req, res) {

    try {

        const result =
            await billingEngine.getBillingByOrder(
                req.params.orderId
            );

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


async function generateRecurringInvoice(req, res) {

    try {

        const result =
            await billingEngine.generateRecurringInvoice(
                req.params.id
            );

        res.status(201).json({
            success: true,
            message: "Recurring invoice generated successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


module.exports = {
    createHybridBilling,
    getInvoice,
    getBillingSchedule,
    getBillingByOrder,
    generateRecurringInvoice
};