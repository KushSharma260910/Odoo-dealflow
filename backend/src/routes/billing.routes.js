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


/*
|--------------------------------------------------------------------------
| Create billing from quotation
|--------------------------------------------------------------------------
*/

router.post(
    "/quotation/:quotationId/create",
    createHybridBilling
);


/*
|--------------------------------------------------------------------------
| Invoice
|--------------------------------------------------------------------------
*/

router.get(
    "/invoice/:id",
    getInvoice
);


/*
|--------------------------------------------------------------------------
| Billing schedule
|--------------------------------------------------------------------------
*/

router.get(
    "/schedule/:id",
    getBillingSchedule
);


/*
|--------------------------------------------------------------------------
| Billing by fulfillment order
|--------------------------------------------------------------------------
*/

router.get(
    "/order/:orderId",
    getBillingByOrder
);


/*
|--------------------------------------------------------------------------
| Generate recurring invoice
|--------------------------------------------------------------------------
*/

router.post(
    "/schedule/:id/generate-invoice",
    generateRecurringInvoice
);


module.exports = router;