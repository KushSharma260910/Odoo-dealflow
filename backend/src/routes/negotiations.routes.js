const express = require("express");

const authenticate =
    require("../middleware/authMiddleware");

const {

    createNegotiation,

    getNegotiation,

    addMessage,

    createLineRequest,

    evaluateRequest,

    processRequest,

    updateLineRequest,

    updateStatus,

    getByQuotation

} = require("../controllers/negotiation.controller");


const router = express.Router();


router.use(authenticate);


// ======================================================
// CREATE NEGOTIATION
// POST /api/negotiations
// ======================================================

router.post(
    "/",
    createNegotiation
);


// ======================================================
// GET NEGOTIATIONS BY QUOTATION
// GET /api/negotiations/quotation/:quotationId
// ======================================================

router.get(
    "/quotation/:quotationId",
    getByQuotation
);


// ======================================================
// GET NEGOTIATION
// GET /api/negotiations/:id
// ======================================================

router.get(
    "/:id",
    getNegotiation
);


// ======================================================
// ADD MESSAGE
// POST /api/negotiations/:id/messages
// ======================================================

router.post(
    "/:id/messages",
    addMessage
);


// ======================================================
// CREATE LINE REQUEST
// POST /api/negotiations/:id/line-requests
// ======================================================

router.post(
    "/:id/line-requests",
    createLineRequest
);


// ======================================================
// EVALUATE LINE REQUEST
// POST /api/negotiations/line-requests/:id/evaluate
// ======================================================

router.post(
    "/line-requests/:id/evaluate",
    evaluateRequest
);


// ======================================================
// PROCESS LINE REQUEST
// POST /api/negotiations/line-requests/:id/process
// ======================================================

router.post(
    "/line-requests/:id/process",
    processRequest
);


// ======================================================
// UPDATE LINE REQUEST
// PUT /api/negotiations/line-requests/:id
// ======================================================

router.put(
    "/line-requests/:id",
    updateLineRequest
);


// ======================================================
// UPDATE NEGOTIATION STATUS
// PUT /api/negotiations/:id/status
// ======================================================

router.put(
    "/:id/status",
    updateStatus
);


module.exports = router;