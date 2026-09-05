const { pool } = require("../../config/db");
const { getApprovalRequirement } = require("../approval/approval.rules");


// ======================================================
// CREATE APPROVAL FOR QUOTATION
// ======================================================

async function createApprovalForQuotation(
    quotationId,
    negotiationLineRequestId = null
) {

    // ------------------------------------------
    // Get quotation
    // ------------------------------------------

    const [quotations] = await pool.execute(
        `SELECT
            id,
            status,
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


    // ------------------------------------------
    // Risk must exist
    // ------------------------------------------

    if (quotation.risk_level === null) {
        throw new Error(
            "Risk analysis must be completed before approval workflow"
        );
    }


    // ------------------------------------------
    // Determine approval requirement
    // ------------------------------------------

    const requirement = getApprovalRequirement(
        quotation.risk_level
    );

    if (!requirement) {
        throw new Error("Invalid risk level");
    }


    // ==================================================
    // LOW → AUTO APPROVE
    // ==================================================

    if (requirement.decision === "AUTO_APPROVE") {

        await pool.execute(
            `UPDATE quotations
             SET
                status = 'APPROVED',
                updated_at = NOW()
             WHERE id = ?`,
            [quotationId]
        );

        return {
            quotation_id: quotationId,
            negotiation_line_request_id:
                negotiationLineRequestId,

            risk_score: Number(quotation.risk_score),
            risk_level: quotation.risk_level,

            decision: "AUTO_APPROVE",

            approval_required: false,

            status: "APPROVED"
        };
    }


    // ==================================================
    // CRITICAL → BLOCK
    // ==================================================

    if (requirement.decision === "BLOCK") {

        await pool.execute(
            `UPDATE quotations
             SET
                status = 'REJECTED',
                updated_at = NOW()
             WHERE id = ?`,
            [quotationId]
        );

        return {
            quotation_id: quotationId,
            negotiation_line_request_id:
                negotiationLineRequestId,

            risk_score: Number(quotation.risk_score),
            risk_level: quotation.risk_level,

            decision: "BLOCK",

            approval_required: false,

            status: "REJECTED"
        };
    }


    // ==================================================
    // CHECK EXISTING PENDING APPROVAL
    // ==================================================

    let existingApprovals;

    if (negotiationLineRequestId) {

        [existingApprovals] = await pool.execute(
            `SELECT
                id,
                quotation_id,
                negotiation_line_request_id,
                approval_level,
                status,
                reason
             FROM approvals
             WHERE quotation_id = ?
               AND negotiation_line_request_id = ?
               AND status = 'PENDING'`,
            [
                quotationId,
                negotiationLineRequestId
            ]
        );

    } else {

        [existingApprovals] = await pool.execute(
            `SELECT
                id,
                quotation_id,
                negotiation_line_request_id,
                approval_level,
                status,
                reason
             FROM approvals
             WHERE quotation_id = ?
               AND negotiation_line_request_id IS NULL
               AND status = 'PENDING'`,
            [quotationId]
        );
    }


    // ==================================================
    // EXISTING APPROVAL
    // ==================================================

    if (existingApprovals.length > 0) {

        const existing = existingApprovals[0];

        return {
            quotation_id: quotationId,

            negotiation_line_request_id:
                negotiationLineRequestId,

            risk_score: Number(quotation.risk_score),
            risk_level: quotation.risk_level,

            decision: requirement.decision,

            approval_required: true,

            approval_id: existing.id,

            approval_level: existing.approval_level,

            status: "PENDING"
        };
    }


    // ==================================================
    // CREATE NEW APPROVAL
    // ==================================================

    let reason;

    if (negotiationLineRequestId) {

        reason =
            `Negotiation request #${negotiationLineRequestId} ` +
            `has risk score ${quotation.risk_score} ` +
            `and requires ${requirement.role} approval`;

    } else {

        reason =
            `Risk score ${quotation.risk_score} ` +
            `requires ${requirement.role} approval`;
    }


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


    // ------------------------------------------
    // Update quotation status
    // ------------------------------------------

    await pool.execute(
        `UPDATE quotations
         SET
            status = 'PENDING_APPROVAL',
            updated_at = NOW()
         WHERE id = ?`,
        [quotationId]
    );


    return {
        quotation_id: quotationId,

        negotiation_line_request_id:
            negotiationLineRequestId,

        risk_score: Number(quotation.risk_score),
        risk_level: quotation.risk_level,

        decision: requirement.decision,

        approval_required: true,

        approval_id: result.insertId,

        approval_level: requirement.role,

        status: "PENDING"
    };
}


// ======================================================
// GET APPROVAL BY ID
// ======================================================

async function getApprovalById(approvalId) {

    const [rows] = await pool.execute(
        `SELECT
            a.*,
            q.quotation_number,
            q.customer_id,
            q.status AS quotation_status,
            q.risk_score,
            q.risk_level
         FROM approvals a
         JOIN quotations q
            ON a.quotation_id = q.id
         WHERE a.id = ?`,
        [approvalId]
    );

    if (rows.length === 0) {
        throw new Error("Approval not found");
    }

    return rows[0];
}


// ======================================================
// GET ALL APPROVALS
// ======================================================

async function getAllApprovals() {

    const [rows] = await pool.execute(
        `SELECT
            a.*,
            q.quotation_number,
            q.customer_id,
            q.status AS quotation_status,
            q.risk_score,
            q.risk_level
         FROM approvals a
         JOIN quotations q
            ON a.quotation_id = q.id
         ORDER BY a.created_at DESC`
    );

    return rows;
}


// ======================================================
// APPROVE
// ======================================================

async function approveApproval(
    approvalId,
    approverId
) {

    const connection = await pool.getConnection();

    try {

        await connection.beginTransaction();


        // ------------------------------------------
        // Get approval
        // ------------------------------------------

        const [approvals] = await connection.execute(
            `SELECT
                id,
                quotation_id,
                negotiation_line_request_id,
                approval_level,
                status
             FROM approvals
             WHERE id = ?
             FOR UPDATE`,
            [approvalId]
        );

        if (approvals.length === 0) {
            throw new Error("Approval not found");
        }

        const approval = approvals[0];


        if (approval.status !== "PENDING") {
            throw new Error(
                "Approval request is no longer pending"
            );
        }


        // ------------------------------------------
        // Mark approval approved
        // ------------------------------------------

        await connection.execute(
            `UPDATE approvals
             SET
                status = 'APPROVED',
                approver_id = ?,
                approved_at = NOW()
             WHERE id = ?`,
            [
                approverId,
                approvalId
            ]
        );


        // ==================================================
        // NORMAL QUOTATION APPROVAL
        // ==================================================

        if (!approval.negotiation_line_request_id) {

            await connection.execute(
                `UPDATE quotations
                 SET
                    status = 'APPROVED',
                    updated_at = NOW()
                 WHERE id = ?`,
                [approval.quotation_id]
            );

            await connection.commit();

            return {
                approval_id: approvalId,
                quotation_id: approval.quotation_id,
                type: "QUOTATION",
                status: "APPROVED"
            };
        }


        // ==================================================
        // NEGOTIATION APPROVAL
        // ==================================================

        const requestId =
            approval.negotiation_line_request_id;


        const [requests] = await connection.execute(
            `SELECT
                id,
                status
             FROM negotiation_line_requests
             WHERE id = ?
             FOR UPDATE`,
            [requestId]
        );

        if (requests.length === 0) {
            throw new Error(
                "Negotiation line request not found"
            );
        }


        if (requests[0].status !== "PENDING") {

            throw new Error(
                "Negotiation request is no longer pending"
            );
        }


        await connection.commit();


        // ------------------------------------------
        // Apply approved negotiation
        // ------------------------------------------

        const {
            applyLineRequest
        } = require("../negotiation/negotiation.engine");

        await applyLineRequest(requestId);


        return {
            approval_id: approvalId,

            quotation_id:
                approval.quotation_id,

            negotiation_line_request_id:
                requestId,

            type: "NEGOTIATION",

            status: "APPROVED",

            message:
                "Negotiation request approved and applied"
        };

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();
    }
}


// ======================================================
// REJECT
// ======================================================

async function rejectApproval(
    approvalId,
    approverId,
    reason = null
) {

    const connection = await pool.getConnection();

    try {

        await connection.beginTransaction();


        const [approvals] = await connection.execute(
            `SELECT
                id,
                quotation_id,
                negotiation_line_request_id,
                status
             FROM approvals
             WHERE id = ?
             FOR UPDATE`,
            [approvalId]
        );

        if (approvals.length === 0) {
            throw new Error("Approval not found");
        }

        const approval = approvals[0];


        if (approval.status !== "PENDING") {
            throw new Error(
                "Approval request is no longer pending"
            );
        }


        // ------------------------------------------
        // Reject approval
        // ------------------------------------------

        await connection.execute(
            `UPDATE approvals
             SET
                status = 'REJECTED',
                approver_id = ?,
                reason = COALESCE(?, reason)
             WHERE id = ?`,
            [
                approverId,
                reason,
                approvalId
            ]
        );


        // ==================================================
        // NEGOTIATION REQUEST
        // ==================================================

        if (approval.negotiation_line_request_id) {

            await connection.execute(
                `UPDATE negotiation_line_requests
                 SET status = 'REJECTED'
                 WHERE id = ?`,
                [
                    approval.negotiation_line_request_id
                ]
            );


            await connection.execute(
                `UPDATE quotations
                 SET
                    status = 'NEGOTIATION',
                    updated_at = NOW()
                 WHERE id = ?`,
                [approval.quotation_id]
            );


            await connection.commit();

            return {
                approval_id: approvalId,

                quotation_id:
                    approval.quotation_id,

                negotiation_line_request_id:
                    approval.negotiation_line_request_id,

                type: "NEGOTIATION",

                status: "REJECTED"
            };
        }


        // ==================================================
        // NORMAL QUOTATION
        // ==================================================

        await connection.execute(
            `UPDATE quotations
             SET
                status = 'REJECTED',
                updated_at = NOW()
             WHERE id = ?`,
            [approval.quotation_id]
        );


        await connection.commit();

        return {
            approval_id: approvalId,

            quotation_id:
                approval.quotation_id,

            type: "QUOTATION",

            status: "REJECTED"
        };

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();
    }
}


module.exports = {
    createApprovalForQuotation,
    getApprovalById,
    getAllApprovals,
    approveApproval,
    rejectApproval
};