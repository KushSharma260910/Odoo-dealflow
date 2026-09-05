const { pool } = require("../../config/db");

async function allocate(orderId, items = []) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orderItems] = await connection.execute(
      "SELECT * FROM order_items WHERE order_id = ? ORDER BY id",
      [orderId],
    );
    const requested = items.length
      ? items
      : orderItems.map((item) => ({
          quotation_item_id: item.quotation_item_id,
          quantity: item.quantity,
        }));
    const allocations = [];
    for (const item of requested) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0)
        throw new Error("Allocation quantities must be positive integers");
      const [stock] = await connection.execute(
        `SELECT ws.*, w.shipping_priority FROM warehouse_stock ws JOIN warehouses w ON w.id = ws.warehouse_id
				 WHERE ws.product_id = (SELECT product_id FROM quotation_items WHERE id = ?)
				 AND w.status = 'ACTIVE' AND (ws.quantity - ws.reserved_quantity) > 0
				 ORDER BY w.shipping_priority, ws.warehouse_id FOR UPDATE`,
        [item.quotation_item_id],
      );
      let remaining = quantity;
      for (const row of stock) {
        if (remaining <= 0) break;
        const allocated = Math.min(
          remaining,
          row.quantity - row.reserved_quantity,
        );
        await connection.execute(
          "UPDATE warehouse_stock SET reserved_quantity = reserved_quantity + ? WHERE id = ?",
          [allocated, row.id],
        );
        await connection.execute(
          `INSERT INTO order_fulfillments (order_id, quotation_item_id, warehouse_id, requested_quantity, allocated_quantity, status)
					 VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.quotation_item_id,
            row.warehouse_id,
            quantity,
            allocated,
            allocated === quantity ? "ALLOCATED" : "PARTIAL",
          ],
        );
        allocations.push({
          warehouse_id: row.warehouse_id,
          quotation_item_id: item.quotation_item_id,
          allocated_quantity: allocated,
        });
        remaining -= allocated;
      }
      if (remaining > 0) {
        await connection.execute(
          `INSERT INTO order_fulfillments (order_id, quotation_item_id, warehouse_id, requested_quantity, allocated_quantity, status)
					 VALUES (?, ?, NULL, ?, 0, 'BACKORDERED')`,
          [orderId, item.quotation_item_id, remaining],
        );
        allocations.push({
          quotation_item_id: item.quotation_item_id,
          allocated_quantity: 0,
          backordered_quantity: remaining,
        });
      }
    }
    await connection.execute(
      "UPDATE orders SET status = CASE WHEN EXISTS (SELECT 1 FROM order_fulfillments f WHERE f.order_id = orders.id AND f.status = 'BACKORDERED') THEN 'BACKORDERED' ELSE 'PROCESSING' END WHERE id = ?",
      [orderId],
    );
    await connection.commit();
    return allocations;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function fulfill(orderId, data = {}) {
  const status = data.status || "SHIPPED";
  await require("../../config/db").query(
    "UPDATE order_fulfillments SET status = ?, actual_delivery_date = COALESCE(?, actual_delivery_date) WHERE order_id = ? AND status IN ('ALLOCATED', 'PARTIAL', 'BACKORDERED')",
    [status, data.actual_delivery_date || null, orderId],
  );
  await require("../../config/db").query(
    "UPDATE orders SET status = CASE WHEN ? = 'DELIVERED' THEN 'FULFILLED' ELSE status END WHERE id = ?",
    [status, orderId],
  );
  return getFulfillment(orderId);
}

async function getFulfillment(orderId) {
  return require("../../config/db").query(
    "SELECT * FROM order_fulfillments WHERE order_id = ? ORDER BY id",
    [orderId],
  );
}

module.exports = { allocate, fulfill, getFulfillment };
