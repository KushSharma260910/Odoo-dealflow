const express = require("express");

const authenticate =
    require("../middleware/authMiddleware");

const authorize =
    require("../middleware/roleMiddleware");

const {
    getEntityAuditLogs,
    getAllAuditLogs
} = require("../controllers/audit.controller");


const router = express.Router();


// All audit APIs require login
router.use(authenticate);


// Get logs for a specific entity
router.get(
    "/:entityType/:entityId",
    getEntityAuditLogs
);


// Only management roles can see all logs
router.get(
    "/",
    authorize(
        "SALES_MANAGER",
        "FINANCE",
        "ADMIN"
    ),
    getAllAuditLogs
);


module.exports = router;