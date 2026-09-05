const express = require("express");

const {
    createQuotation,
    getAllQuotations,
    getQuotationById,
    updateQuotation,
    addQuotationItem,
    deleteQuotationItem
} = require("../controllers/quotation.controller");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);

router.post("/", createQuotation);

router.get("/", getAllQuotations);

router.get("/:id", getQuotationById);

router.put("/:id", updateQuotation);

router.post("/:id/items", addQuotationItem);

router.delete(
    "/:id/items/:itemId",
    deleteQuotationItem
);

module.exports = router;