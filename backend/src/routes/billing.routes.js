const express = require("express");

const authenticate =
    require("../middleware/authMiddleware");

const {
    createHybridBilling,
    getInvoice,
    getBillingSchedule,
    getBillingByOrder,
    generateRecurringInvoice
} = require("../controllers/billing.controller");


const router = express.Router();

router.use(authenticate);


// Create billing from quotation
router.post(
    "/quotation/:quotationId/create",
    createHybridBilling
);


// Get invoice
router.get(
    "/invoice/:id",
    getInvoice
);


// Get subscription schedule
router.get(
    "/schedule/:id",
    getBillingSchedule
);


// Get complete billing by fulfillment order
router.get(
    "/order/:orderId",
    getBillingByOrder
);


// Generate recurring invoice
router.post(
    "/schedule/:id/generate-invoice",
    generateRecurringInvoice
);


module.exports = router;