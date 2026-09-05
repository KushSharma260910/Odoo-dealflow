const express = require("express");

const authenticate = require("../middleware/authMiddleware");

const {
    analyzeRisk
} = require("../controllers/risk.controller");

const router = express.Router();

router.use(authenticate);

router.get("/quotations/:id/risk", analyzeRisk);

router.post("/quotations/:id/risk/analyze", analyzeRisk);

module.exports = router;