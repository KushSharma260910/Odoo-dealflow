const { pool } = require("../../config/db");

const {
    RULES,
    getSeverity
} = require("./anomaly.rules");


async function detectQuotationAnomalies(quotationId) {

    // -----------------------------------------
    // Get quotation
    // -----------------------------------------

    const [quotations] = await pool.execute(
        `SELECT
            id,
            quotation_number,
            sales_rep_id,
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

    if (quotations.length === 0) {
        throw new Error("Quotation not found");
    }

    const quotation = quotations[0];

    const anomalies = [];


    // =========================================
    // 1. DISCOUNT ANOMALY
    // =========================================

    const discount = Number(
        quotation.discount_percent || 0
    );

    const discountSeverity =
        getSeverity("DISCOUNT", discount);

    if (discountSeverity) {

        anomalies.push({
            type: "DISCOUNT",
            severity: discountSeverity,

            value: discount,

            expected_max:
                RULES.DISCOUNT.normalMax,

            message:
                `Discount of ${discount}% is above the normal range of ${RULES.DISCOUNT.normalMax}%`,

            recommended_action:
                "Review discount approval"
        });
    }


    // =========================================
    // 2. MARGIN ANOMALY
    // =========================================

    const [items] = await pool.execute(
        `SELECT
            qi.quantity,
            qi.unit_price,
            qi.discount_percent,
            p.cost_price
         FROM quotation_items qi
         JOIN products p
            ON qi.product_id = p.id
         WHERE qi.quotation_id = ?`,
        [quotationId]
    );


    let revenue = 0;
    let cost = 0;

    for (const item of items) {

        const gross =
            Number(item.unit_price) *
            Number(item.quantity);

        const discountAmount =
            gross *
            (Number(item.discount_percent || 0) / 100);

        revenue += gross - discountAmount;

        cost +=
            Number(item.cost_price || 0) *
            Number(item.quantity);
    }


    let marginPercent = 0;

    if (revenue > 0) {
        marginPercent =
            ((revenue - cost) / revenue) * 100;
    }


    const marginSeverity =
        getSeverity("MARGIN", marginPercent);

    if (marginSeverity) {

        anomalies.push({
            type: "MARGIN",
            severity: marginSeverity,

            value: Number(
                marginPercent.toFixed(2)
            ),

            expected_min:
                RULES.MARGIN.minimum,

            message:
                `Margin of ${marginPercent.toFixed(2)}% is below the required ${RULES.MARGIN.minimum}%`,

            recommended_action:
                "Increase price or reduce discount"
        });
    }


    // =========================================
    // 3. DEAL VALUE ANOMALY
    // =========================================

    const totalAmount =
        Number(quotation.total_amount || 0);

    const dealValueSeverity =
        getSeverity(
            "DEAL_VALUE",
            totalAmount
        );

    if (dealValueSeverity) {

        anomalies.push({
            type: "DEAL_VALUE",
            severity: dealValueSeverity,

            value: totalAmount,

            threshold:
                RULES.DEAL_VALUE.unusuallyHigh,

            message:
                `Deal value of ₹${totalAmount.toFixed(2)} is unusually high`,

            recommended_action:
                "Perform additional management review"
        });
    }


    // =========================================
    // Overall severity
    // =========================================

    const severityRank = {
        NONE: 0,
        MEDIUM: 1,
        HIGH: 2,
        CRITICAL: 3
    };

    let overallSeverity = "NONE";

    for (const anomaly of anomalies) {

        if (
            severityRank[anomaly.severity] >
            severityRank[overallSeverity]
        ) {
            overallSeverity =
                anomaly.severity;
        }
    }


    let recommendedAction = "NO_ACTION";

    if (overallSeverity === "MEDIUM") {
        recommendedAction =
            "REVIEW_DEAL";
    }

    if (overallSeverity === "HIGH") {
        recommendedAction =
            "MANAGER_REVIEW";
    }

    if (overallSeverity === "CRITICAL") {
        recommendedAction =
            "BLOCK_DEAL";
    }


    return {

        quotation_id: quotation.id,

        quotation_number:
            quotation.quotation_number,

        anomaly_detected:
            anomalies.length > 0,

        overall_severity:
            overallSeverity,

        recommended_action:
            recommendedAction,

        anomalies,

        metrics: {
            discount_percent: discount,

            margin_percent:
                Number(
                    marginPercent.toFixed(2)
                ),

            deal_value:
                totalAmount,

            risk_score:
                Number(
                    quotation.risk_score || 0
                ),

            risk_level:
                quotation.risk_level
        }
    };
}


module.exports = {
    detectQuotationAnomalies
};