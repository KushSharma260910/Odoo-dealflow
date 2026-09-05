const { pool } = require("../../config/db");

/**
 * Allocate quotation items across available warehouses.
 * Automatically creates backorders when stock is insufficient.
 */
async function allocateQuotation(quotationId) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Check quotation
        const [quotations] = await connection.execute(
            `SELECT id, status
             FROM quotations
             WHERE id = ?`,
            [quotationId]
        );

        if (quotations.length === 0) {
            throw new Error("Quotation not found");
        }

        const quotation = quotations[0];

        // 2. Get quotation items
        const [items] = await connection.execute(
            `SELECT
                qi.product_id,
                qi.quantity,
                p.name AS product_name
             FROM quotation_items qi
             JOIN products p
               ON qi.product_id = p.id
             WHERE qi.quotation_id = ?`,
            [quotationId]
        );

        if (items.length === 0) {
            throw new Error("Quotation has no items");
        }

        // 3. Create fulfillment order
        const [fulfillmentResult] = await connection.execute(
            `INSERT INTO fulfillment_orders
             (quotation_id, status)
             VALUES (?, 'PENDING')`,
            [quotationId]
        );

        const fulfillmentOrderId = fulfillmentResult.insertId;

        const allocations = [];
        const backorders = [];

        // 4. Process every quotation item
        for (const item of items) {

            let remainingQuantity = Number(item.quantity);

            // Get warehouses with available stock
            const [inventory] = await connection.execute(
                `SELECT
                    wi.warehouse_id,
                    w.name AS warehouse_name,
                    wi.quantity,
                    wi.reserved_quantity,
                    (wi.quantity - wi.reserved_quantity) AS available_quantity
                 FROM warehouse_inventory wi
                 JOIN warehouses w
                   ON wi.warehouse_id = w.id
                 WHERE wi.product_id = ?
                   AND w.is_active = 1
                   AND (wi.quantity - wi.reserved_quantity) > 0
                 ORDER BY available_quantity DESC
                 FOR UPDATE`,
                [item.product_id]
            );

            for (const warehouse of inventory) {

                if (remainingQuantity <= 0) {
                    break;
                }

                const available = Number(
                    warehouse.available_quantity
                );

                const allocated = Math.min(
                    remainingQuantity,
                    available
                );

                // Reserve stock
                await connection.execute(
                    `UPDATE warehouse_inventory
                     SET reserved_quantity =
                         reserved_quantity + ?
                     WHERE warehouse_id = ?
                       AND product_id = ?`,
                    [
                        allocated,
                        warehouse.warehouse_id,
                        item.product_id
                    ]
                );

                // Store allocation
                await connection.execute(
                    `INSERT INTO fulfillment_items
                    (
                        fulfillment_order_id,
                        product_id,
                        warehouse_id,
                        quantity_requested,
                        quantity_allocated
                    )
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        fulfillmentOrderId,
                        item.product_id,
                        warehouse.warehouse_id,
                        item.quantity,
                        allocated
                    ]
                );

                allocations.push({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    warehouse_id: warehouse.warehouse_id,
                    warehouse_name: warehouse.warehouse_name,
                    quantity_allocated: allocated
                });

                remainingQuantity -= allocated;
            }

            // 5. Create backorder if stock insufficient
            if (remainingQuantity > 0) {

                await connection.execute(
                    `INSERT INTO backorders
                    (
                        fulfillment_order_id,
                        product_id,
                        quantity,
                        status
                    )
                    VALUES (?, ?, ?, 'PENDING')`,
                    [
                        fulfillmentOrderId,
                        item.product_id,
                        remainingQuantity
                    ]
                );

                backorders.push({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity: remainingQuantity,
                    status: "PENDING"
                });
            }
        }

        // 6. Determine fulfillment status
        let status = "ALLOCATED";

        if (backorders.length > 0) {
            status =
                allocations.length > 0
                    ? "PARTIAL"
                    : "BACKORDER";
        }

        // 7. Update fulfillment order
        await connection.execute(
            `UPDATE fulfillment_orders
             SET status = ?
             WHERE id = ?`,
            [status, fulfillmentOrderId]
        );

        await connection.commit();

        return {
            fulfillment_order_id: fulfillmentOrderId,
            quotation_id: quotationId,
            status,
            allocations,
            backorders
        };

    } catch (error) {

        await connection.rollback();
        throw error;

    } finally {

        connection.release();
    }
}


/**
 * Get fulfillment details.
 */
async function getFulfillmentById(fulfillmentId) {

    const [orders] = await pool.execute(
        `SELECT
            fo.id,
            fo.quotation_id,
            fo.status,
            fo.created_at,
            q.quotation_number
         FROM fulfillment_orders fo
         JOIN quotations q
           ON fo.quotation_id = q.id
         WHERE fo.id = ?`,
        [fulfillmentId]
    );

    if (orders.length === 0) {
        throw new Error("Fulfillment order not found");
    }

    const order = orders[0];

    const [allocations] = await pool.execute(
        `SELECT
            fi.id,
            fi.product_id,
            p.name AS product_name,
            fi.warehouse_id,
            w.name AS warehouse_name,
            fi.quantity_requested,
            fi.quantity_allocated
         FROM fulfillment_items fi
         JOIN products p
           ON fi.product_id = p.id
         JOIN warehouses w
           ON fi.warehouse_id = w.id
         WHERE fi.fulfillment_order_id = ?`,
        [fulfillmentId]
    );

    const [backorders] = await pool.execute(
        `SELECT
            b.id,
            b.product_id,
            p.name AS product_name,
            b.quantity,
            b.status,
            b.created_at
         FROM backorders b
         JOIN products p
           ON b.product_id = p.id
         WHERE b.fulfillment_order_id = ?`,
        [fulfillmentId]
    );

    return {
        ...order,
        allocations,
        backorders
    };
}


module.exports = {
    allocateQuotation,
    getFulfillmentById
};