const express = require("express");

const authenticate = require("../middleware/authMiddleware");

const {
    getOverview,
    getRiskDashboard,
    getApprovalDashboard,
    getFulfillmentDashboard,
    getRevenueDashboard
} = require("../controllers/dashboard.controller");

const router = express.Router();

router.use(authenticate);

router.get("/overview", getOverview);

router.get("/risk", getRiskDashboard);

router.get("/approvals", getApprovalDashboard);

router.get("/fulfillment", getFulfillmentDashboard);

router.get("/revenue", getRevenueDashboard);

module.exports = router;