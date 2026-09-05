const { pool } = require("../../config/db");

/**
 * Discount Governance Engine
 *
 * Evaluates quotation item discounts against
 * customer/category based discount rules.
 */
async function evaluateQuotationDiscount(quotationId) {

    // 1. Get quotation + customer tier
    const [quotationRows] = await pool.execute(
        `SELECT 
            q.id,
            q.customer_id,
            c.customer_tier
         FROM quotations q
         JOIN customers c ON q.customer_id = c.id
         WHERE q.id = ?`,
        [quotationId]
    );

    if (quotationRows.length === 0) {
        throw new Error("Quotation not found");
    }

    const quotation = quotationRows[0];

    // 2. Get quotation items
    const [items] = await pool.execute(
        `SELECT
            qi.id,
            qi.product_id,
            qi.quantity,
            qi.unit_price,
            qi.discount_percent,
            p.category_id,
            p.name AS product_name
         FROM quotation_items qi
         JOIN products p ON qi.product_id = p.id
         WHERE qi.quotation_id = ?`,
        [quotationId]
    );

    if (items.length === 0) {
        throw new Error("Quotation has no items");
    }

    const results = [];

    let approvalRequired = false;
    let highestApprovalLevel = "NONE";

    // Approval hierarchy
    const approvalRank = {
        NONE: 0,
        SALES_MANAGER: 1,
        FINANCE: 2
    };

    // 3. Evaluate every quotation item
    for (const item of items) {

        // Find applicable rule
        const [rules] = await pool.execute(
            `SELECT *
             FROM discount_rules
             WHERE customer_tier = ?
               AND category_id = ?
               AND is_active = 1
             ORDER BY priority ASC
             LIMIT 1`,
            [
                quotation.customer_tier,
                item.category_id
            ]
        );

        // No rule found
        if (rules.length === 0) {

            results.push({
                item_id: item.id,
                product_id: item.product_id,
                product_name: item.product_name,
                requested_discount: Number(item.discount_percent),
                rule_found: false,
                status: "NO_RULE"
            });

            continue;
        }

        const rule = rules[0];

        const requestedDiscount =
            Number(item.discount_percent);

        const maximumAllowed =
            Number(rule.max_discount_percent);

        const exceedsLimit =
            requestedDiscount > maximumAllowed;

        let status;
        let approvalLevel = "NONE";

        if (!exceedsLimit) {

            status = "ALLOWED";

            approvalLevel = "NONE";

        } else {

            status = "APPROVAL_REQUIRED";

            approvalLevel = rule.approval_level;

            approvalRequired = true;

            if (
                approvalRank[approvalLevel] >
                approvalRank[highestApprovalLevel]
            ) {
                highestApprovalLevel = approvalLevel;
            }
        }

        results.push({
            item_id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,

            customer_tier:
                quotation.customer_tier,

            category_id:
                item.category_id,

            requested_discount:
                requestedDiscount,

            maximum_allowed_discount:
                maximumAllowed,

            exceeds_limit:
                exceedsLimit,

            approval_level:
                approvalLevel,

            status,

            rule_id:
                rule.id,

            rule_name:
                rule.name
        });
    }

    return {
        quotation_id: quotationId,

        customer_id:
            quotation.customer_id,

        customer_tier:
            quotation.customer_tier,

        approval_required:
            approvalRequired,

        approval_level:
            highestApprovalLevel,

        overall_status:
            approvalRequired
                ? "APPROVAL_REQUIRED"
                : "ALLOWED",

        items: results
    };
}


module.exports = {
    evaluateQuotationDiscount
};