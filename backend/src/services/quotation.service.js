const { pool } = require("../config/db");


// Generate quotation number
function generateQuotationNumber() {
    const timestamp = Date.now();

    return `QT-${timestamp}`;
}


// Create quotation
async function createQuotation(data) {

    const {
        customer_id,
        sales_rep_id
    } = data;

    const quotation_number = generateQuotationNumber();

    const [result] = await pool.execute(
        `INSERT INTO quotations
        (
            quotation_number,
            customer_id,
            sales_rep_id,
            status,
            subtotal,
            discount_amount,
            tax_amount,
            total_amount,
            discount_percent,
            risk_score,
            risk_level
        )
        VALUES (?, ?, ?, 'DRAFT', 0, 0, 0, 0, 0, 0, 'LOW')`,
        [
            quotation_number,
            customer_id,
            sales_rep_id
        ]
    );

    return getQuotationById(result.insertId);
}


// Get all quotations
async function getAllQuotations() {

    const [rows] = await pool.execute(
        `SELECT *
         FROM quotations
         ORDER BY created_at DESC`
    );

    return rows;
}


// Get quotation by ID
async function getQuotationById(id) {

    const [rows] = await pool.execute(
        `SELECT *
         FROM quotations
         WHERE id = ?`,
        [id]
    );

    if (rows.length === 0) {
        return null;
    }

    const quotation = rows[0];

    const [items] = await pool.execute(
        `SELECT
            qi.*,
            p.name AS product_name
         FROM quotation_items qi
         JOIN products p
             ON qi.product_id = p.id
         WHERE qi.quotation_id = ?`,
        [id]
    );

    quotation.items = items;

    return quotation;
}


// Add item to quotation
async function addQuotationItem(quotationId, data) {

    const {
        product_id,
        quantity,
        discount_percent = 0
    } = data;


    // Get product price and tax
    const [products] = await pool.execute(
        `SELECT price, tax_percent
         FROM products
         WHERE id = ? AND is_active = 1`,
        [product_id]
    );


    if (products.length === 0) {
        throw new Error("Product not found or inactive");
    }


    const product = products[0];

    const unit_price = Number(product.price);
    const tax_percent = Number(product.tax_percent);


    // Calculate line total after discount
    const grossAmount = unit_price * quantity;

    const discountAmount =
        grossAmount * (Number(discount_percent) / 100);

    const lineTotal =
        grossAmount - discountAmount;


    const [result] = await pool.execute(
        `INSERT INTO quotation_items
        (
            quotation_id,
            product_id,
            quantity,
            unit_price,
            discount_percent,
            tax_percent,
            line_total
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            quotationId,
            product_id,
            quantity,
            unit_price,
            discount_percent,
            tax_percent,
            lineTotal
        ]
    );


    await recalculateQuotation(quotationId);

    return getQuotationById(result.insertId);
}


// Recalculate quotation totals
async function recalculateQuotation(quotationId) {

    const [items] = await pool.execute(
        `SELECT
            quantity,
            unit_price,
            discount_percent,
            tax_percent
         FROM quotation_items
         WHERE quotation_id = ?`,
        [quotationId]
    );


    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;


    for (const item of items) {

        const gross =
            Number(item.unit_price) *
            Number(item.quantity);

        const discount =
            gross *
            (Number(item.discount_percent) / 100);

        const afterDiscount =
            gross - discount;

        const tax =
            afterDiscount *
            (Number(item.tax_percent) / 100);


        subtotal += gross;
        discountAmount += discount;
        taxAmount += tax;
    }


    const totalAmount =
        subtotal -
        discountAmount +
        taxAmount;


    const discountPercent =
        subtotal > 0
            ? (discountAmount / subtotal) * 100
            : 0;


    await pool.execute(
        `UPDATE quotations
         SET subtotal = ?,
             discount_amount = ?,
             tax_amount = ?,
             total_amount = ?,
             discount_percent = ?
         WHERE id = ?`,
        [
            subtotal,
            discountAmount,
            taxAmount,
            totalAmount,
            discountPercent,
            quotationId
        ]
    );
}


// Update quotation
async function updateQuotation(id, data) {

    const {
        customer_id,
        sales_rep_id,
        status
    } = data;


    const [result] = await pool.execute(
        `UPDATE quotations
         SET customer_id = ?,
             sales_rep_id = ?,
             status = ?
         WHERE id = ?`,
        [
            customer_id,
            sales_rep_id,
            status,
            id
        ]
    );


    if (result.affectedRows === 0) {
        return null;
    }


    return getQuotationById(id);
}


// Delete quotation item
async function deleteQuotationItem(
    quotationId,
    itemId
) {

    const [result] = await pool.execute(
        `DELETE FROM quotation_items
         WHERE id = ?
         AND quotation_id = ?`,
        [
            itemId,
            quotationId
        ]
    );


    if (result.affectedRows === 0) {
        return false;
    }


    await recalculateQuotation(quotationId);

    return true;
}


module.exports = {
    createQuotation,
    getAllQuotations,
    getQuotationById,
    addQuotationItem,
    updateQuotation,
    deleteQuotationItem,
    recalculateQuotation
};