const { pool } = require("../config/db");

const {
    allocateQuotation,
    getFulfillmentById
} = require("../engines/fulfillment/fulfillment.engine");


async function createWarehouse(req, res) {

    try {

        const { name, location } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Warehouse name is required"
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO warehouses
             (name, location)
             VALUES (?, ?)`,
            [name, location || null]
        );

        res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                name,
                location
            }
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function getWarehouses(req, res) {

    try {

        const [warehouses] = await pool.execute(
            `SELECT *
             FROM warehouses
             ORDER BY id DESC`
        );

        res.json({
            success: true,
            data: warehouses
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function addInventory(req, res) {

    try {

        const { id } = req.params;

        const {
            product_id,
            quantity
        } = req.body;

        if (!product_id || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "product_id and quantity are required"
            });
        }

        await pool.execute(
            `INSERT INTO warehouse_inventory
            (
                warehouse_id,
                product_id,
                quantity,
                reserved_quantity
            )
            VALUES (?, ?, ?, 0)
            ON DUPLICATE KEY UPDATE
                quantity = quantity + VALUES(quantity)`,
            [
                id,
                product_id,
                quantity
            ]
        );

        res.json({
            success: true,
            message: "Inventory updated successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function getWarehouseInventory(req, res) {

    try {

        const { id } = req.params;

        const [inventory] = await pool.execute(
            `SELECT
                wi.id,
                wi.product_id,
                p.name AS product_name,
                wi.quantity,
                wi.reserved_quantity,
                (wi.quantity - wi.reserved_quantity)
                    AS available_quantity
             FROM warehouse_inventory wi
             JOIN products p
               ON wi.product_id = p.id
             WHERE wi.warehouse_id = ?`,
            [id]
        );

        res.json({
            success: true,
            data: inventory
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function allocateFulfillment(req, res) {

    try {

        const { id } = req.params;

        const result = await allocateQuotation(id);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error(error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


async function getFulfillment(req, res) {

    try {

        const { id } = req.params;

        const result = await getFulfillmentById(id);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
}


module.exports = {
    createWarehouse,
    getWarehouses,
    addInventory,
    getWarehouseInventory,
    allocateFulfillment,
    getFulfillment
};