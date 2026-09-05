const { pool } = require("../config/db");

async function createCustomer(data) {
    const {
        user_id,
        company_name,
        contact_name,
        email,
        phone,
        customer_tier = "BRONZE",
        currency = "INR"
    } = data;

    const [result] = await pool.execute(
        `INSERT INTO customers
        (user_id, company_name, contact_name, email, phone, customer_tier, currency)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            user_id || null,
            company_name,
            contact_name,
            email,
            phone || null,
            customer_tier,
            currency
        ]
    );

    return getCustomerById(result.insertId);
}

async function getAllCustomers() {
    const [rows] = await pool.execute(
        `SELECT *
         FROM customers
         ORDER BY created_at DESC`
    );

    return rows;
}

async function getCustomerById(id) {
    const [rows] = await pool.execute(
        `SELECT *
         FROM customers
         WHERE id = ?`,
        [id]
    );

    return rows[0];
}

async function updateCustomer(id, data) {
    const {
        user_id,
        company_name,
        contact_name,
        email,
        phone,
        customer_tier,
        currency
    } = data;

    const [result] = await pool.execute(
        `UPDATE customers
         SET user_id = ?,
             company_name = ?,
             contact_name = ?,
             email = ?,
             phone = ?,
             customer_tier = ?,
             currency = ?
         WHERE id = ?`,
        [
            user_id || null,
            company_name,
            contact_name,
            email,
            phone || null,
            customer_tier,
            currency,
            id
        ]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    return getCustomerById(id);
}

async function deleteCustomer(id) {
    const [result] = await pool.execute(
        `DELETE FROM customers
         WHERE id = ?`,
        [id]
    );

    return result.affectedRows > 0;
}

module.exports = {
    createCustomer,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer
};