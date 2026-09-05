const express = require("express");

const authenticate =
    require("../middleware/authMiddleware");

const {
    detectAnomalies
} = require("../controllers/anomaly.controller");


const router = express.Router();

router.use(authenticate);


router.get(
    "/quotations/:quotationId/anomalies",
    detectAnomalies
);


module.exports = router;