const negotiationEngine =
    require("../engines/negotiations/negotiation.engine");


// ======================================================
// CREATE NEGOTIATION
// ======================================================

async function createNegotiation(req, res) {

    try {

        const result =
            await negotiationEngine.createNegotiation(
                req.body.quotation_id
            );

        res.status(201).json({
            success: true,
            message: "Negotiation created successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


// ======================================================
// GET NEGOTIATION
// ======================================================

async function getNegotiation(req, res) {

    try {

        const result =
            await negotiationEngine.getNegotiationById(
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


// ======================================================
// ADD MESSAGE
// ======================================================

async function addMessage(req, res) {

    try {

        const result =
            await negotiationEngine.addMessage(
                req.params.id,
                req.user.id,
                req.body.message
            );

        res.status(201).json({
            success: true,
            message: "Message added successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


// ======================================================
// CREATE LINE REQUEST
// ======================================================

async function createLineRequest(req, res) {

    try {

        const result =
            await negotiationEngine.createLineRequest({

                negotiation_id:
                    req.params.id,

                quotation_item_id:
                    req.body.quotation_item_id,

                requested_discount_percent:
                    req.body.requested_discount_percent,

                requested_quantity:
                    req.body.requested_quantity,

                customer_message:
                    req.body.customer_message
            });


        res.status(201).json({
            success: true,
            message:
                "Negotiation request created successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


// ======================================================
// EVALUATE REQUEST
// ======================================================

async function evaluateRequest(req, res) {

    try {

        const result =
            await negotiationEngine.evaluateLineRequest(
                req.params.id
            );

        res.json({
            success: true,
            message:
                "Negotiation request evaluated",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


// ======================================================
// PROCESS REQUEST
// ======================================================

async function processRequest(req, res) {

    try {

        const result =
            await negotiationEngine.processLineRequest(
                req.params.id
            );

        res.json({
            success: true,
            message:
                "Negotiation request processed",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


// ======================================================
// UPDATE LINE REQUEST
// ======================================================

async function updateLineRequest(req, res) {

    try {

        const result =
            await negotiationEngine.updateLineRequest(
                req.params.id,
                req.body.status
            );

        res.json({
            success: true,
            message:
                "Negotiation request updated",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


// ======================================================
// UPDATE NEGOTIATION STATUS
// ======================================================

async function updateStatus(req, res) {

    try {

        const result =
            await negotiationEngine.updateNegotiationStatus(
                req.params.id,
                req.body.status
            );

        res.json({
            success: true,
            message:
                "Negotiation status updated",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


// ======================================================
// GET BY QUOTATION
// ======================================================

async function getByQuotation(req, res) {

    try {

        const result =
            await negotiationEngine.getNegotiationsByQuotation(
                req.params.quotationId
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


module.exports = {

    createNegotiation,

    getNegotiation,

    addMessage,

    createLineRequest,

    evaluateRequest,

    processRequest,

    updateLineRequest,

    updateStatus,

    getByQuotation
};