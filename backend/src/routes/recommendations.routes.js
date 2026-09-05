const express = require("express");

const authenticate =
    require("../middleware/authMiddleware");

const {
    create,
    getByProduct,
    getByQuotation
} = require("../controllers/recommendation.controller");

const router = express.Router();

router.use(authenticate);

// Configure recommendation relationship
router.post(
    "/",
    create
);

// Product recommendations
router.get(
    "/product/:productId",
    getByProduct
);

// Quotation recommendations
router.get(
    "/quotation/:quotationId",
    getByQuotation
);

module.exports = router;