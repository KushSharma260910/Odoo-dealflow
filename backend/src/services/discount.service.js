const { pool } = require("../config/db");


// Create discount rule
async function createDiscountRule(data) {

    const {
        name,
        customer_tier,
        category_id,
        max_discount_percent,
        approval_level = "NONE",
        priority = 1,
        is_active = 1
    } = data;

    const [result] = await pool.execute(
        `INSERT INTO discount_rules
        (
            name,
            customer_tier,
            category_id,
            max_discount_percent,
            approval_level,
            priority,
            is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            name,
            customer_tier,
            category_id,
            max_discount_percent,
            approval_level,
            priority,
            is_active
        ]
    );

    return getDiscountRuleById(result.insertId);
}


// Get all rules
async function getAllDiscountRules() {

    const [rows] = await pool.execute(
        `SELECT *
         FROM discount_rules
         ORDER BY priority ASC, created_at DESC`
    );

    return rows;
}


// Get rule by ID
async function getDiscountRuleById(id) {

    const [rows] = await pool.execute(
        `SELECT *
         FROM discount_rules
         WHERE id = ?`,
        [id]
    );

    return rows[0];
}


// Update rule
async function updateDiscountRule(id, data) {

    const {
        name,
        customer_tier,
        category_id,
        max_discount_percent,
        approval_level,
        priority,
        is_active
    } = data;

    const [result] = await pool.execute(
        `UPDATE discount_rules
         SET name = ?,
             customer_tier = ?,
             category_id = ?,
             max_discount_percent = ?,
             approval_level = ?,
             priority = ?,
             is_active = ?
         WHERE id = ?`,
        [
            name,
            customer_tier,
            category_id,
            max_discount_percent,
            approval_level,
            priority,
            is_active,
            id
        ]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    return getDiscountRuleById(id);
}


// Deactivate rule
async function deactivateDiscountRule(id) {

    const [result] = await pool.execute(
        `UPDATE discount_rules
         SET is_active = 0
         WHERE id = ?`,
        [id]
    );

    return result.affectedRows > 0;
}


module.exports = {
    createDiscountRule,
    getAllDiscountRules,
    getDiscountRuleById,
    updateDiscountRule,
    deactivateDiscountRule
};