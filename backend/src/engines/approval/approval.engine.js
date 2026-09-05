const { pool } = require("../../config/db");
const { getApprovalRequirement } = require("./approval.rules");

async function createApprovalForQuotation(
    quotationId,
    negotiationLineRequestId = null
) {

    // Get quotation risk information
    const [quotations] = await pool.execute(
        `SELECT id, status, risk_score, risk_level
         FROM quotations
         WHERE id = ?`,
        [quotationId]
    );

    if (quotations.length === 0) {
        throw new Error("Quotation not found");
    }

    const quotation = quotations[0];

    if (quotation.risk_level === null) {
        throw new Error(
            "Risk analysis must be completed before approval workflow"
        );
    }

    const requirement = getApprovalRequirement(
        quotation.risk_level
    );

    if (!requirement) {
        throw new Error("Invalid risk level");
    }

    // ==========================================
    // LOW → AUTOMATIC APPROVAL
    // ==========================================

    if (requirement.decision === "AUTO_APPROVE") {

        await pool.execute(
            `UPDATE quotations
             SET status = 'APPROVED',
                 updated_at = NOW()
             WHERE id = ?`,
            [quotationId]
        );

        return {
            quotation_id: quotationId,
            negotiation_line_request_id: negotiationLineRequestId,
            risk_score: Number(quotation.risk_score),
            risk_level: quotation.risk_level,
            decision: "AUTO_APPROVE",
            approval_required: false,
            status: "APPROVED"
        };
    }

    // ==========================================
    // CRITICAL → BLOCK
    // ==========================================

    if (requirement.decision === "BLOCK") {

        await pool.execute(
            `UPDATE quotations
             SET status = 'REJECTED',
                 updated_at = NOW()
             WHERE id = ?`,
            [quotationId]
        );

        return {
            quotation_id: quotationId,
            negotiation_line_request_id: negotiationLineRequestId,
            risk_score: Number(quotation.risk_score),
            risk_level: quotation.risk_level,
            decision: "BLOCK",
            approval_required: false,
            status: "REJECTED"
        };
    }

    // ==========================================
    // CHECK EXISTING PENDING APPROVAL
    // ==========================================

    let existingQuery;
    let existingParams;

    if (negotiationLineRequestId) {

        existingQuery = `
            SELECT id
            FROM approvals
            WHERE quotation_id = ?
              AND negotiation_line_request_id = ?
              AND status = 'PENDING'
        `;

        existingParams = [
            quotationId,
            negotiationLineRequestId
        ];

    } else {

        existingQuery = `
            SELECT id
            FROM approvals
            WHERE quotation_id = ?
              AND negotiation_line_request_id IS NULL
              AND status = 'PENDING'
        `;

        existingParams = [quotationId];
    }

    const [existingApprovals] = await pool.execute(
        existingQuery,
        existingParams
    );

    if (existingApprovals.length > 0) {

        return {
            quotation_id: quotationId,
            negotiation_line_request_id: negotiationLineRequestId,
            risk_score: Number(quotation.risk_score),
            risk_level: quotation.risk_level,
            decision: requirement.decision,
            approval_required: true,
            approval_id: existingApprovals[0].id,
            status: "PENDING"
        };
    }

    // ==========================================
    // CREATE APPROVAL REQUEST
    // ==========================================

    const reason = negotiationLineRequestId
        ? `Negotiation request #${negotiationLineRequestId} has risk score ${quotation.risk_score} and requires ${requirement.role} approval`
        : `Risk score ${quotation.risk_score} requires ${requirement.role} approval`;

    const [result] = await pool.execute(
        `INSERT INTO approvals
        (
            quotation_id,
            negotiation_line_request_id,
            approver_id,
            approval_level,
            status,
            reason
        )
        VALUES (?, ?, NULL, ?, 'PENDING', ?)`,
        [
            quotationId,
            negotiationLineRequestId,
            requirement.role,
            reason
        ]
    );

    await pool.execute(
        `UPDATE quotations
         SET status = 'PENDING_APPROVAL',
             updated_at = NOW()
         WHERE id = ?`,
        [quotationId]
    );

    return {
        quotation_id: quotationId,
        negotiation_line_request_id: negotiationLineRequestId,
        risk_score: Number(quotation.risk_score),
        risk_level: quotation.risk_level,
        decision: requirement.decision,
        approval_required: true,
        approval_id: result.insertId,
        approval_level: requirement.role,
        status: "PENDING"
    };
}

module.exports = {
    createApprovalForQuotation
};