const express = require("express");

const authenticate = require("../middleware/authMiddleware");

const {
    createWarehouse,
    getWarehouses,
    addInventory,
    getWarehouseInventory,
    allocateFulfillment,
    getFulfillment
} = require("../controllers/warehouse.controller");

const router = express.Router();

router.use(authenticate);

// Warehouses
router.post("/", createWarehouse);
router.get("/", getWarehouses);

// Inventory
router.post("/:id/inventory", addInventory);
router.get("/:id/inventory", getWarehouseInventory);

// Fulfillment
router.post(
    "/fulfillment/quotation/:id/allocate",
    allocateFulfillment
);

router.get(
    "/fulfillment/:id",
    getFulfillment
);

module.exports = router;