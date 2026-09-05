const { query, pool } = require('../config/db');

async function list() {
	return query('SELECT * FROM warehouses ORDER BY shipping_priority, name');
}

async function findById(id) {
	const rows = await query('SELECT * FROM warehouses WHERE id = ?', [id]);
	return rows[0] || null;
}

async function create(data) {
	const result = await query(
		'INSERT INTO warehouses (name, location, shipping_priority, status) VALUES (?, ?, ?, ?)',
		[data.name, data.location || null, data.shipping_priority ?? 1, data.status || 'ACTIVE']
	);
	return findById(result.insertId);
}

async function update(id, data) {
	await query(
		'UPDATE warehouses SET name = COALESCE(?, name), location = COALESCE(?, location), shipping_priority = COALESCE(?, shipping_priority), status = COALESCE(?, status) WHERE id = ?',
		[data.name ?? null, data.location ?? null, data.shipping_priority ?? null, data.status ?? null, id]
	);
	return findById(id);
}

async function stock(warehouseId) {
	return query(
		`SELECT ws.*, p.name AS product_name, p.sku
		 FROM warehouse_stock ws JOIN products p ON p.id = ws.product_id
		 WHERE ws.warehouse_id = ? ORDER BY p.name`,
		[warehouseId]
	);
}

async function upsertStock(warehouseId, data) {
	await query(
		`INSERT INTO warehouse_stock (warehouse_id, product_id, quantity, reserved_quantity, reorder_level)
		 VALUES (?, ?, ?, ?, ?)
		 ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), reserved_quantity = VALUES(reserved_quantity), reorder_level = VALUES(reorder_level)`,
		[warehouseId, data.product_id, data.quantity ?? 0, data.reserved_quantity ?? 0, data.reorder_level ?? 0]
	);
	const rows = await query('SELECT * FROM warehouse_stock WHERE warehouse_id = ? AND product_id = ?', [warehouseId, data.product_id]);
	return rows[0];
}

async function findStockForUpdate(connection, productId, quantity) {
	const [rows] = await connection.execute(
		`SELECT ws.*, w.shipping_priority FROM warehouse_stock ws
		 JOIN warehouses w ON w.id = ws.warehouse_id
		 WHERE ws.product_id = ? AND w.status = 'ACTIVE'
		 AND (ws.quantity - ws.reserved_quantity) >= ?
		 ORDER BY w.shipping_priority, ws.warehouse_id FOR UPDATE`,
		[productId, quantity]
	);
	return rows;
}

module.exports = { list, findById, create, update, stock, upsertStock, findStockForUpdate, pool };
