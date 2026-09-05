const express = require("express");

const authenticate =
    require("../middleware/authMiddleware");

const {
    getDealHealth
} = require("../controllers/deal-health.controller");

const router = express.Router();

router.use(authenticate);

router.get(
    "/quotations/:quotationId/health",
    getDealHealth
);

module.exports = router;