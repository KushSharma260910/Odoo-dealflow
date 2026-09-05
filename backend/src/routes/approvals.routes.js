const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    createApproval,
    getAllApprovals,
    getApprovalById,
    approveQuotation,
    rejectQuotation
} = require("../controllers/approval.controller");

const router = express.Router();

router.use(authenticate);

// Create approval workflow
router.post(
    "/quotations/:id",
    createApproval
);

// View approvals
router.get(
    "/",
    getAllApprovals
);

router.get(
    "/:id",
    getApprovalById
);

// Only authorized roles can approve/reject
router.put(
    "/:id/approve",
    roleMiddleware("SALES_MANAGER", "FINANCE", "ADMIN"),
    approveQuotation
);

router.put(
    "/:id/reject",
    roleMiddleware("SALES_MANAGER", "FINANCE", "ADMIN"),
    rejectQuotation
);

module.exports = router;