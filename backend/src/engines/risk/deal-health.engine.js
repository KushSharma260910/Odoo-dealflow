const { pool } = require("../../config/db");

async function calculateDealHealth(quotationId) {
    const [rows] = await pool.execute(
        `SELECT
            id,
            quotation_number,
            status,
            subtotal,
            discount_amount,
            total_amount,
            discount_percent,
            risk_score,
            risk_level
         FROM quotations
         WHERE id = ?`,
        [quotationId]
    );

    if (rows.length === 0) {
        throw new Error("Quotation not found");
    }

    const quotation = rows[0];

    const riskScore = Number(quotation.risk_score || 0);

    // Convert risk into health
    const healthScore = Math.max(
        0,
        Math.min(100, 100 - riskScore)
    );

    let healthStatus;
    let action;

    if (healthScore >= 70) {
        healthStatus = "HEALTHY";
        action = "Proceed with deal";
    } else if (healthScore >= 40) {
        healthStatus = "AT_RISK";
        action = "Review deal before proceeding";
    } else {
        healthStatus = "CRITICAL";
        action = "Immediate management intervention required";
    }

    const warnings = [];

    if (quotation.risk_level === "MEDIUM") {
        warnings.push("Deal requires manager review");
    }

    if (quotation.risk_level === "HIGH") {
        warnings.push("Deal requires finance review");
    }

    if (quotation.risk_level === "CRITICAL") {
        warnings.push("Deal is blocked due to critical risk");
    }

    if (Number(quotation.discount_percent) > 10) {
        warnings.push("High discount may reduce profitability");
    }

    return {
        quotation_id: quotation.id,
        quotation_number: quotation.quotation_number,

        health_score: healthScore,
        health_status: healthStatus,

        risk_score: riskScore,
        risk_level: quotation.risk_level,

        financials: {
            subtotal: Number(quotation.subtotal),
            discount_amount: Number(quotation.discount_amount),
            total_amount: Number(quotation.total_amount),
            discount_percent: Number(quotation.discount_percent)
        },

        warnings,

        recommended_action: action
    };
}

module.exports = {
    calculateDealHealth
};