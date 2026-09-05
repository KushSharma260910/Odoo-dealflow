const { pool } = require("../../config/db");

const {
    createApprovalForQuotation
} = require("../approval/approval.engine");

const {
    createAuditLog
} = require("../audit/audit.engine");


// ======================================================
// CREATE NEGOTIATION
// ======================================================

async function createNegotiation(quotationId) {

    const [quotation] = await pool.execute(
        `SELECT
            id,
            quotation_number,
            customer_id,
            status
         FROM quotations
         WHERE id = ?`,
        [quotationId]
    );

    if (quotation.length === 0) {
        throw new Error("Quotation not found");
    }


    // Check if there is already an open negotiation
    const [existing] = await pool.execute(
        `SELECT id
         FROM negotiations
         WHERE quotation_id = ?
         AND status = 'OPEN'`,
        [quotationId]
    );


    if (existing.length > 0) {

        return {
            id: existing[0].id,
            quotation_id: quotationId,
            status: "OPEN",
            message: "Existing negotiation is already open"
        };
    }


    const [result] = await pool.execute(
        `INSERT INTO negotiations
         (quotation_id, status)
         VALUES (?, 'OPEN')`,
        [quotationId]
    );


    await pool.execute(
        `UPDATE quotations
         SET status = 'NEGOTIATION'
         WHERE id = ?`,
        [quotationId]
    );


    // ==================================================
    // AUDIT
    // ==================================================

    await createAuditLog({
        userId: null,
        entityType: "NEGOTIATION",
        entityId: result.insertId,

        action: "NEGOTIATION_STARTED",

        oldValue: {
            quotation_status: quotation[0].status
        },

        newValue: {
            quotation_id: quotationId,
            status: "OPEN"
        },

        reason: "Negotiation started for quotation"
    });


    return {
        id: result.insertId,
        quotation_id: quotationId,
        status: "OPEN"
    };
}


// ======================================================
// GET COMPLETE NEGOTIATION
// ======================================================

async function getNegotiationById(
    negotiationId
) {

    const [negotiations] = await pool.execute(
        `SELECT
            n.id,
            n.quotation_id,
            n.status,
            n.created_at,
            q.quotation_number,
            q.customer_id,
            q.total_amount,
            q.discount_percent,
            q.risk_score,
            q.risk_level
         FROM negotiations n
         JOIN quotations q
            ON n.quotation_id = q.id
         WHERE n.id = ?`,
        [negotiationId]
    );


    if (negotiations.length === 0) {
        throw new Error("Negotiation not found");
    }


    const [messages] = await pool.execute(
        `SELECT
            id,
            negotiation_id,
            sender_id,
            message,
            created_at
         FROM negotiation_messages
         WHERE negotiation_id = ?
         ORDER BY created_at ASC`,
        [negotiationId]
    );


    const [lineRequests] = await pool.execute(
        `SELECT
            nlr.id,
            nlr.negotiation_id,
            nlr.quotation_item_id,
            nlr.requested_discount_percent,
            nlr.requested_quantity,
            nlr.customer_message,
            nlr.status,
            nlr.created_at,
            p.name AS product_name
         FROM negotiation_line_requests nlr
         JOIN quotation_items qi
            ON nlr.quotation_item_id = qi.id
         JOIN products p
            ON qi.product_id = p.id
         WHERE nlr.negotiation_id = ?
         ORDER BY nlr.created_at ASC`,
        [negotiationId]
    );


    return {
        ...negotiations[0],
        messages,
        line_requests: lineRequests
    };
}


// ======================================================
// ADD CUSTOMER / SALES MESSAGE
// ======================================================

async function addMessage(
    negotiationId,
    senderId,
    message
) {

    const [negotiation] = await pool.execute(
        `SELECT
            id,
            quotation_id
         FROM negotiations
         WHERE id = ?`,
        [negotiationId]
    );


    if (negotiation.length === 0) {
        throw new Error("Negotiation not found");
    }


    const [result] = await pool.execute(
        `INSERT INTO negotiation_messages
         (negotiation_id, sender_id, message)
         VALUES (?, ?, ?)`,
        [
            negotiationId,
            senderId,
            message
        ]
    );


    // ==================================================
    // AUDIT
    // ==================================================

    await createAuditLog({
        userId: senderId,
        entityType: "NEGOTIATION",
        entityId: negotiationId,

        action: "MESSAGE_ADDED",

        newValue: {
            message_id: result.insertId,
            sender_id: senderId
        },

        reason: "New negotiation message added"
    });


    return {
        id: result.insertId,
        negotiation_id: negotiationId,
        sender_id: senderId,
        message
    };
}


// ======================================================
// CUSTOMER REQUESTS CHANGE TO QUOTATION LINE
// ======================================================

async function createLineRequest(data) {

    const {
        negotiation_id,
        quotation_item_id,
        requested_discount_percent,
        requested_quantity,
        customer_message
    } = data;


    const [negotiation] = await pool.execute(
        `SELECT
            id,
            quotation_id,
            status
         FROM negotiations
         WHERE id = ?`,
        [negotiation_id]
    );


    if (negotiation.length === 0) {
        throw new Error("Negotiation not found");
    }


    if (negotiation[0].status !== "OPEN") {
        throw new Error(
            "Negotiation is not open for requests"
        );
    }


    const [item] = await pool.execute(
        `SELECT
            qi.id,
            qi.quotation_id,
            qi.product_id,
            qi.quantity,
            qi.unit_price,
            qi.discount_percent
         FROM quotation_items qi
         WHERE qi.id = ?
         AND qi.quotation_id = ?`,
        [
            quotation_item_id,
            negotiation[0].quotation_id
        ]
    );


    if (item.length === 0) {
        throw new Error(
            "Quotation item does not belong to this negotiation"
        );
    }


    const [result] = await pool.execute(
        `INSERT INTO negotiation_line_requests
        (
            negotiation_id,
            quotation_item_id,
            requested_discount_percent,
            requested_quantity,
            customer_message,
            status
        )
        VALUES (?, ?, ?, ?, ?, 'PENDING')`,
        [
            negotiation_id,
            quotation_item_id,
            requested_discount_percent,
            requested_quantity,
            customer_message
        ]
    );


    // ==================================================
    // AUDIT
    // ==================================================

    await createAuditLog({
        userId: null,
        entityType: "NEGOTIATION",
        entityId: negotiation_id,

        action: "DISCOUNT_REQUESTED",

        newValue: {
            request_id: result.insertId,
            quotation_item_id: quotation_item_id,
            requested_discount_percent:
                requested_discount_percent,
            requested_quantity:
                requested_quantity,
            customer_message:
                customer_message
        },

        reason:
            "Customer requested a quotation line change"
    });


    return {
        id: result.insertId,
        negotiation_id,
        quotation_item_id,
        requested_discount_percent,
        requested_quantity,
        customer_message,
        status: "PENDING"
    };
}


// ======================================================
// GET NEGOTIATIONS FOR QUOTATION
// ======================================================

async function getNegotiationsByQuotation(
    quotationId
) {

    const [rows] = await pool.execute(
        `SELECT *
         FROM negotiations
         WHERE quotation_id = ?
         ORDER BY created_at DESC`,
        [quotationId]
    );


    return rows;
}


// ======================================================
// UPDATE LINE REQUEST
// ======================================================

async function updateLineRequest(
    requestId,
    status
) {

    const allowedStatuses = [
        "PENDING",
        "ACCEPTED",
        "REJECTED"
    ];


    if (!allowedStatuses.includes(status)) {
        throw new Error(
            "Invalid request status"
        );
    }


    // Get old status first
    const [existing] = await pool.execute(
        `SELECT
            id,
            negotiation_id,
            status
         FROM negotiation_line_requests
         WHERE id = ?`,
        [requestId]
    );


    if (existing.length === 0) {
        throw new Error(
            "Negotiation line request not found"
        );
    }


    const oldStatus =
        existing[0].status;


    await pool.execute(
        `UPDATE negotiation_line_requests
         SET status = ?
         WHERE id = ?`,
        [
            status,
            requestId
        ]
    );


    // ==================================================
    // AUDIT
    // ==================================================

    if (oldStatus !== status) {

        await createAuditLog({
            userId: null,
            entityType: "NEGOTIATION",
            entityId: existing[0].negotiation_id,

            action: "NEGOTIATION_REQUEST_STATUS_CHANGED",

            oldValue: {
                request_id: requestId,
                status: oldStatus
            },

            newValue: {
                request_id: requestId,
                status: status
            },

            reason:
                "Negotiation line request status updated"
        });
    }


    const [rows] = await pool.execute(
        `SELECT *
         FROM negotiation_line_requests
         WHERE id = ?`,
        [requestId]
    );


    return rows[0];
}


// ======================================================
// UPDATE NEGOTIATION STATUS
// ======================================================

async function updateNegotiationStatus(
    negotiationId,
    status
) {

    const allowedStatuses = [
        "OPEN",
        "ACCEPTED",
        "REJECTED",
        "CLOSED"
    ];


    if (!allowedStatuses.includes(status)) {
        throw new Error(
            "Invalid negotiation status"
        );
    }


    const [existing] = await pool.execute(
        `SELECT
            id,
            quotation_id,
            status
         FROM negotiations
         WHERE id = ?`,
        [negotiationId]
    );


    if (existing.length === 0) {
        throw new Error(
            "Negotiation not found"
        );
    }


    const oldStatus =
        existing[0].status;


    await pool.execute(
        `UPDATE negotiations
         SET status = ?
         WHERE id = ?`,
        [
            status,
            negotiationId
        ]
    );


    // ==================================================
    // AUDIT
    // ==================================================

    if (oldStatus !== status) {

        await createAuditLog({
            userId: null,
            entityType: "NEGOTIATION",
            entityId: negotiationId,

            action: "NEGOTIATION_STATUS_CHANGED",

            oldValue: {
                status: oldStatus
            },

            newValue: {
                status: status
            },

            reason:
                "Negotiation status updated"
        });
    }


    return getNegotiationById(
        negotiationId
    );
}


// ======================================================
// RISK CALCULATOR
// ======================================================

const {
    calculateMarginRisk,
    calculateDiscountRisk
} = require("../risk/risk.calculator");


const {
    getRiskRules,
    getRiskLevel,
    getDecision
} = require("../risk/risk.rules");


// ======================================================
// EVALUATE LINE REQUEST
// ======================================================

async function evaluateLineRequest(
    requestId
) {

    // 1. Get negotiation request

    const [requests] = await pool.execute(
        `SELECT
            nlr.*,
            n.quotation_id,
            qi.product_id,
            qi.unit_price,
            qi.tax_percent,
            qi.quantity AS current_quantity,
            p.cost_price,
            p.min_margin_percent
         FROM negotiation_line_requests nlr
         JOIN negotiations n
            ON nlr.negotiation_id = n.id
         JOIN quotation_items qi
            ON nlr.quotation_item_id = qi.id
         JOIN products p
            ON qi.product_id = p.id
         WHERE nlr.id = ?`,
        [requestId]
    );


    if (requests.length === 0) {
        throw new Error(
            "Negotiation request not found"
        );
    }


    const request =
        requests[0];


    // 2. Requested values

    const requestedQuantity =
        request.requested_quantity ??
        request.current_quantity;


    const requestedDiscount =
        request.requested_discount_percent ??
        0;


    // 3. Calculate hypothetical revenue

    const grossValue =
        Number(request.unit_price) *
        Number(requestedQuantity);


    const discountedRevenue =
        grossValue *
        (1 - Number(requestedDiscount) / 100);


    // 4. Calculate hypothetical cost

    const totalCost =
        Number(request.cost_price) *
        Number(requestedQuantity);


    // 5. Calculate hypothetical margin

    let marginPercent = 0;


    if (discountedRevenue > 0) {

        marginPercent =
            (
                (
                    discountedRevenue -
                    totalCost
                ) /
                discountedRevenue
            ) * 100;
    }


    // 6. Margin risk

    const marginRisk =
        calculateMarginRisk(
            marginPercent,
            Number(
                request.min_margin_percent
            )
        );


    // 7. Find applicable discount rule

    const [discountRules] =
        await pool.execute(
            `SELECT
                dr.*
             FROM discount_rules dr
             JOIN products p
                ON dr.category_id = p.category_id
             JOIN customers c
                ON dr.customer_tier = c.customer_tier
             JOIN quotations q
                ON q.customer_id = c.id
             WHERE p.id = ?
             AND q.id = ?
             AND dr.is_active = 1
             ORDER BY dr.priority ASC
             LIMIT 1`,
            [
                request.product_id,
                request.quotation_id
            ]
        );


    let allowedDiscount = 0;


    if (discountRules.length > 0) {

        allowedDiscount =
            Number(
                discountRules[0]
                    .max_discount_percent
            );
    }


    // 8. Discount risk

    const discountRisk =
        calculateDiscountRisk(
            requestedDiscount,
            allowedDiscount
        );


    // 9. Current negotiation does not yet
    // have inventory/negotiation historical risk

    const factors = {
        discount: discountRisk,
        margin: marginRisk,
        inventory: 0,
        negotiation: 0
    };


    // 10. Load DB-configured risk rules

    const riskRules =
        await getRiskRules();


    // 11. Calculate weighted risk

    const riskScore =
        require("../risk/risk.calculator")
            .calculateRiskScore(
                factors,
                riskRules
            );


    const riskLevel =
        getRiskLevel(riskScore);


    const decision =
        getDecision(riskLevel);


    return {

        negotiation_request_id:
            requestId,

        quotation_id:
            request.quotation_id,

        product_id:
            request.product_id,

        current_quantity:
            Number(
                request.current_quantity
            ),

        requested_quantity:
            Number(
                requestedQuantity
            ),

        requested_discount_percent:
            Number(
                requestedDiscount
            ),

        allowed_discount_percent:
            allowedDiscount,

        financial_impact: {

            gross_value:
                Number(
                    grossValue.toFixed(2)
                ),

            discounted_revenue:
                Number(
                    discountedRevenue.toFixed(2)
                ),

            total_cost:
                Number(
                    totalCost.toFixed(2)
                ),

            projected_margin_percent:
                Number(
                    marginPercent.toFixed(2)
                )
        },

        risk: {
            score: riskScore,
            level: riskLevel,
            decision
        },

        factors: {

            discount_risk:
                discountRisk,

            margin_risk:
                marginRisk,

            inventory_risk:
                0,

            negotiation_risk:
                0
        }
    };
}


// ======================================================
// PROCESS LINE REQUEST
// ======================================================

async function processLineRequest(
    requestId
) {

    const evaluation =
        await evaluateLineRequest(
            requestId
        );


    const { risk } =
        evaluation;


    let finalStatus;
    let action;


    // ==========================================
    // LOW → AUTO ACCEPT
    // ==========================================

    if (
        risk.decision ===
        "AUTO_APPROVE"
    ) {

        finalStatus = "ACCEPTED";
        action = "AUTO_ACCEPTED";


        await applyLineRequest(
            requestId
        );


        // Audit is created inside
        // applyLineRequest()
    }


    // ==========================================
    // MEDIUM → MANAGER APPROVAL
    // ==========================================

    else if (
        risk.decision ===
        "MANAGER_REVIEW"
    ) {

        finalStatus = "PENDING";
        action = "MANAGER_REVIEW_REQUIRED";


        const approval =
            await createApprovalForQuotation(
                evaluation.quotation_id,
                requestId
            );


        return {
            ...evaluation,

            action,

            request_status:
                finalStatus,

            approval
        };
    }


    // ==========================================
    // HIGH → FINANCE APPROVAL
    // ==========================================

    else if (
        risk.decision ===
        "FINANCE_REVIEW"
    ) {

        finalStatus = "PENDING";
        action = "FINANCE_REVIEW_REQUIRED";


        const approval =
            await createApprovalForQuotation(
                evaluation.quotation_id,
                requestId
            );


        return {
            ...evaluation,

            action,

            request_status:
                finalStatus,

            approval
        };
    }


    // ==========================================
    // CRITICAL → BLOCK
    // ==========================================

    else {

        finalStatus = "REJECTED";
        action = "BLOCKED";


        await pool.execute(
            `UPDATE negotiation_line_requests
             SET status = 'REJECTED'
             WHERE id = ?`,
            [requestId]
        );


        // ==================================================
        // AUDIT BLOCKED NEGOTIATION
        // ==================================================

        await createAuditLog({
            userId: null,
            entityType: "NEGOTIATION",
            entityId: requestId,

            action:
                "NEGOTIATION_BLOCKED",

            newValue: {
                request_id: requestId,
                quotation_id:
                    evaluation.quotation_id,
                risk_score:
                    risk.score,
                risk_level:
                    risk.level,
                status: "REJECTED"
            },

            reason:
                "Negotiation request blocked because risk level is CRITICAL"
        });
    }


    return {
        ...evaluation,

        action,

        request_status:
            finalStatus
    };
}


// ======================================================
// APPLY LINE REQUEST
// ======================================================

async function applyLineRequest(
    requestId
) {

    const connection =
        await pool.getConnection();


    try {

        await connection.beginTransaction();


        const [requests] =
            await connection.execute(
                `SELECT
                    nlr.*,
                    n.quotation_id,
                    qi.quantity AS current_quantity,
                    qi.unit_price,
                    qi.tax_percent
                 FROM negotiation_line_requests nlr
                 JOIN negotiations n
                    ON nlr.negotiation_id = n.id
                 JOIN quotation_items qi
                    ON nlr.quotation_item_id = qi.id
                 WHERE nlr.id = ?
                 FOR UPDATE`,
                [requestId]
            );


        if (requests.length === 0) {

            throw new Error(
                "Negotiation request not found"
            );
        }


        const request =
            requests[0];


        if (request.status !== "PENDING") {

            throw new Error(
                "Only pending requests can be applied"
            );
        }


        const newQuantity =
            request.requested_quantity ??
            request.current_quantity;


        const newDiscount =
            request.requested_discount_percent ??
            0;


        // ==========================================
        // Calculate new line total
        // ==========================================

        const grossAmount =
            Number(request.unit_price) *
            Number(newQuantity);


        const discountAmount =
            grossAmount *
            (
                Number(newDiscount) /
                100
            );


        const discountedAmount =
            grossAmount -
            discountAmount;


        const taxAmount =
            discountedAmount *
            (
                Number(request.tax_percent) /
                100
            );


        const lineTotal =
            discountedAmount +
            taxAmount;


        // ==========================================
        // Update quotation item
        // ==========================================

        await connection.execute(
            `UPDATE quotation_items
             SET
                quantity = ?,
                discount_percent = ?,
                line_total = ?
             WHERE id = ?`,
            [
                newQuantity,
                newDiscount,
                lineTotal,
                request.quotation_item_id
            ]
        );


        // ==========================================
        // Recalculate quotation totals
        // ==========================================

        const [items] =
            await connection.execute(
                `SELECT
                    quantity,
                    unit_price,
                    discount_percent,
                    tax_percent
                 FROM quotation_items
                 WHERE quotation_id = ?`,
                [request.quotation_id]
            );


        let subtotal = 0;
        let discountAmountTotal = 0;
        let taxAmountTotal = 0;
        let totalAmount = 0;


        for (const item of items) {

            const gross =
                Number(item.quantity) *
                Number(item.unit_price);


            const discount =
                gross *
                (
                    Number(item.discount_percent) /
                    100
                );


            const net =
                gross -
                discount;


            const tax =
                net *
                (
                    Number(item.tax_percent) /
                    100
                );


            subtotal += gross;

            discountAmountTotal +=
                discount;

            taxAmountTotal +=
                tax;

            totalAmount +=
                net + tax;
        }


        const overallDiscount =
            subtotal > 0
                ? (
                    discountAmountTotal /
                    subtotal
                ) * 100
                : 0;


        await connection.execute(
            `UPDATE quotations
             SET
                subtotal = ?,
                discount_amount = ?,
                tax_amount = ?,
                total_amount = ?,
                discount_percent = ?,
                status = 'APPROVED'
             WHERE id = ?`,
            [
                subtotal,
                discountAmountTotal,
                taxAmountTotal,
                totalAmount,
                overallDiscount,
                request.quotation_id
            ]
        );


        // ==========================================
        // Mark negotiation request accepted
        // ==========================================

        await connection.execute(
            `UPDATE negotiation_line_requests
             SET status = 'ACCEPTED'
             WHERE id = ?`,
            [requestId]
        );


        // ==========================================
        // Close negotiation
        // ==========================================

        await connection.execute(
            `UPDATE negotiations
             SET status = 'ACCEPTED'
             WHERE id = ?`,
            [request.negotiation_id]
        );


        await connection.commit();


        // ==================================================
        // AUDIT SUCCESSFUL NEGOTIATION
        // ==================================================

        await createAuditLog({
            userId: null,
            entityType: "NEGOTIATION",
            entityId: request.negotiation_id,

            action: "NEGOTIATION_APPROVED",

            oldValue: {
                quantity:
                    Number(request.current_quantity),

                discount_percent:
                    Number(
                        request.discount_percent ||
                        0
                    )
            },

            newValue: {
                request_id:
                    requestId,

                quantity:
                    Number(newQuantity),

                discount_percent:
                    Number(newDiscount),

                line_total:
                    Number(
                        lineTotal.toFixed(2)
                    ),

                quotation_total:
                    Number(
                        totalAmount.toFixed(2)
                    ),

                negotiation_status:
                    "ACCEPTED"
            },

            reason:
                "Negotiation request approved and applied"
        });


        return {
            success: true,

            message:
                "Negotiation request applied successfully",

            quotation_id:
                request.quotation_id
        };


    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();
    }
}


// ======================================================
// EXPORTS
// ======================================================

module.exports = {

    createNegotiation,

    getNegotiationById,

    addMessage,

    createLineRequest,

    getNegotiationsByQuotation,

    updateLineRequest,

    updateNegotiationStatus,

    evaluateLineRequest,

    processLineRequest,

    applyLineRequest
};