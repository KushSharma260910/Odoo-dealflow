const express = require("express");

const {
    createDiscountRule,
    getAllDiscountRules,
    getDiscountRuleById,
    updateDiscountRule,
    deleteDiscountRule,
    evaluateDiscount
} = require("../controllers/discount.controller");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);

router.post("/rules", createDiscountRule);

router.get("/rules", getAllDiscountRules);

router.get("/rules/:id", getDiscountRuleById);

router.put("/rules/:id", updateDiscountRule);

router.delete("/rules/:id", deleteDiscountRule);

router.post("/evaluate/:quotationId", evaluateDiscount);

module.exports = router;