const { pool } = require("../../config/db");

const {
    getRiskRules,
    getRiskLevel,
    getDecision
} = require("./risk.rules");

const {
    calculateMarginRisk,
    calculateDiscountRisk,
    calculateRiskScore
} = require("./risk.calculator");


async function analyzeQuotationRisk(quotationId) {

    // ==========================================
    // 1. GET QUOTATION
    // ==========================================

    const [quotations] = await pool.execute(
        `SELECT *
         FROM quotations
         WHERE id = ?`,
        [quotationId]
    );

    if (quotations.length === 0) {
        throw new Error("Quotation not found");
    }

    const quotation = quotations[0];


    // ==========================================
    // 2. GET CUSTOMER
    // ==========================================

    const [customers] = await pool.execute(
        `SELECT customer_tier
         FROM customers
         WHERE id = ?`,
        [quotation.customer_id]
    );

    if (customers.length === 0) {
        throw new Error("Customer not found");
    }

    const customerTier =
        customers[0].customer_tier;


    // ==========================================
    // 3. GET QUOTATION ITEMS
    // ==========================================

    const [items] = await pool.execute(
        `SELECT
            qi.id,
            qi.product_id,
            qi.quantity,
            qi.unit_price,
            qi.discount_percent,
            p.name AS product_name,
            p.cost_price,
            p.min_margin_percent,
            p.category_id
         FROM quotation_items qi
         JOIN products p
           ON qi.product_id = p.id
         WHERE qi.quotation_id = ?`,
        [quotationId]
    );

    if (items.length === 0) {
        throw new Error("Quotation has no items");
    }


    // ==========================================
    // 4. GET RISK CONFIGURATION
    // ==========================================

    const riskRules =
        await getRiskRules();

    if (riskRules.length === 0) {
        throw new Error(
            "No active risk rules configured"
        );
    }


    // ==========================================
    // 5. FINANCIAL CALCULATIONS
    // ==========================================

    let totalRevenue = 0;
    let totalCost = 0;

    let highestMinimumMargin = 0;
    let highestDiscountRisk = 0;

    const explanations = [];


    for (const item of items) {

        const quantity =
            Number(item.quantity);

        const unitPrice =
            Number(item.unit_price);

        const discount =
            Number(item.discount_percent || 0);

        const costPrice =
            Number(item.cost_price);

        const minimumMargin =
            Number(item.min_margin_percent);


        // --------------------------------------
        // Final selling price
        // --------------------------------------

        const finalUnitPrice =
            unitPrice *
            (1 - discount / 100);


        // --------------------------------------
        // Revenue
        // --------------------------------------

        const revenue =
            finalUnitPrice *
            quantity;


        // --------------------------------------
        // Cost
        // --------------------------------------

        const cost =
            costPrice *
            quantity;


        totalRevenue += revenue;
        totalCost += cost;


        highestMinimumMargin =
            Math.max(
                highestMinimumMargin,
                minimumMargin
            );


        // ======================================
        // DISCOUNT GOVERNANCE
        // ======================================

        const [discountRules] =
            await pool.execute(
                `SELECT
                    max_discount_percent
                 FROM discount_rules
                 WHERE customer_tier = ?
                   AND category_id = ?
                   AND is_active = 1
                 ORDER BY priority ASC
                 LIMIT 1`,
                [
                    customerTier,
                    item.category_id
                ]
            );


        let allowedDiscount = 0;

        if (discountRules.length > 0) {

            allowedDiscount =
                Number(
                    discountRules[0]
                        .max_discount_percent
                );

        } else {

            explanations.push(
                `${item.product_name}: no active discount rule configured`
            );

        }


        // ======================================
        // DISCOUNT RISK
        // ======================================

        const discountRisk =
            calculateDiscountRisk(
                discount,
                allowedDiscount
            );


        highestDiscountRisk =
            Math.max(
                highestDiscountRisk,
                discountRisk
            );


        if (discountRisk > 0) {

            explanations.push(
                `${item.product_name}: discount ${discount}% exceeds allowed ${allowedDiscount}%`
            );

        }
    }


    // ==========================================
    // 6. ACTUAL MARGIN
    // ==========================================

    const actualMargin =
        totalRevenue > 0
            ? (
                (totalRevenue - totalCost)
                / totalRevenue
            ) * 100
            : 0;


    // ==========================================
    // 7. MARGIN RISK
    // ==========================================

    const marginRisk =
        calculateMarginRisk(
            actualMargin,
            highestMinimumMargin
        );


    if (marginRisk > 0) {

        explanations.push(
            `Actual margin ${actualMargin.toFixed(2)}% is below required margin ${highestMinimumMargin}%`
        );

    }


    // ==========================================
    // 8. OTHER RISK FACTORS
    // ==========================================

    // These will be supplied by the
    // Warehouse and Negotiation engines.

    const inventoryRisk = 0;

    const negotiationRisk = 0;


    // ==========================================
    // 9. RISK FACTORS
    // ==========================================

    const factors = {

        discount:
            highestDiscountRisk,

        margin:
            marginRisk,

        inventory:
            inventoryRisk,

        negotiation:
            negotiationRisk
    };


    // ==========================================
    // 10. CALCULATE RISK SCORE
    // ==========================================

    const riskScore =
        calculateRiskScore(
            factors,
            riskRules
        );


    // ==========================================
    // 11. RISK LEVEL
    // ==========================================

    const riskLevel =
        getRiskLevel(riskScore);


    // ==========================================
    // 12. AUTOMATIC DECISION
    // ==========================================

    const decision =
        getDecision(riskLevel);


    // ==========================================
    // 13. UPDATE QUOTATION
    // ==========================================

    await pool.execute(
        `UPDATE quotations
         SET risk_score = ?,
             risk_level = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
            riskScore,
            riskLevel,
            quotationId
        ]
    );


    // ==========================================
    // 14. RESPONSE
    // ==========================================

    return {

        quotation_id:
            quotationId,

        financials: {

            revenue:
                Number(
                    totalRevenue.toFixed(2)
                ),

            cost:
                Number(
                    totalCost.toFixed(2)
                ),

            actual_margin_percent:
                Number(
                    actualMargin.toFixed(2)
                ),

            required_margin_percent:
                highestMinimumMargin
        },

        risk_score:
            riskScore,

        risk_level:
            riskLevel,

        decision:
            decision,

        factors: {

            discount_risk:
                factors.discount,

            margin_risk:
                factors.margin,

            inventory_risk:
                factors.inventory,

            negotiation_risk:
                factors.negotiation
        },

        explanations
    };
}


module.exports = {
    analyzeQuotationRisk
};