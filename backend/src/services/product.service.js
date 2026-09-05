const { pool } = require("../config/db");

async function createProduct(data) {
    const {
        category_id,
        name,
        description,
        price,
        unit = "UNIT",
        tax_percent = 0,
        min_margin_percent = 0,
        is_active = 1
    } = data;

    const [result] = await pool.execute(
        `INSERT INTO products
        (
            category_id,
            name,
            description,
            price,
            unit,
            tax_percent,
            min_margin_percent,
            is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            category_id,
            name,
            description || null,
            price,
            unit,
            tax_percent,
            min_margin_percent,
            is_active
        ]
    );

    return getProductById(result.insertId);
}

async function getAllProducts() {
    const [rows] = await pool.execute(
        `SELECT *
         FROM products
         ORDER BY created_at DESC`
    );

    return rows;
}

async function getProductById(id) {
    const [rows] = await pool.execute(
        `SELECT *
         FROM products
         WHERE id = ?`,
        [id]
    );

    return rows[0];
}

async function updateProduct(id, data) {
    const {
        category_id,
        name,
        description,
        price,
        unit,
        tax_percent,
        min_margin_percent,
        is_active
    } = data;

    const [result] = await pool.execute(
        `UPDATE products
         SET category_id = ?,
             name = ?,
             description = ?,
             price = ?,
             unit = ?,
             tax_percent = ?,
             min_margin_percent = ?,
             is_active = ?
         WHERE id = ?`,
        [
            category_id,
            name,
            description || null,
            price,
            unit,
            tax_percent,
            min_margin_percent,
            is_active,
            id
        ]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    return getProductById(id);
}

async function deactivateProduct(id) {
    const [result] = await pool.execute(
        `UPDATE products
         SET is_active = 0
         WHERE id = ?`,
        [id]
    );

    return result.affectedRows > 0;
}

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deactivateProduct
};