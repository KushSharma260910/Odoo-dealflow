const { pool } = require("../config/db");
const {
    createApprovalForQuotation
} = require("../engines/approval/approval.engine");

async function createApproval(req, res) {
    try {

        const { id } = req.params;

        const result = await createApprovalForQuotation(id);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error(error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


async function getAllApprovals(req, res) {

    try {

        const [approvals] = await pool.execute(
            `SELECT
                a.id,
                a.quotation_id,
                a.approver_id,
                a.approval_level,
                a.status,
                a.reason,
                a.created_at,
                a.approved_at,
                q.quotation_number,
                q.risk_score,
                q.risk_level
             FROM approvals a
             JOIN quotations q
                ON a.quotation_id = q.id
             ORDER BY a.created_at DESC`
        );

        res.json({
            success: true,
            count: approvals.length,
            data: approvals
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function getApprovalById(req, res) {

    try {

        const { id } = req.params;

        const [approvals] = await pool.execute(
            `SELECT
                a.*,
                q.quotation_number,
                q.risk_score,
                q.risk_level
             FROM approvals a
             JOIN quotations q
                ON a.quotation_id = q.id
             WHERE a.id = ?`,
            [id]
        );

        if (approvals.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Approval not found"
            });
        }

        res.json({
            success: true,
            data: approvals[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function approveQuotation(req, res) {

    const connection = await pool.getConnection();

    try {

        const { id } = req.params;
        const approverId = req.user.id;

        await connection.beginTransaction();

        const [approvals] = await connection.execute(
            `SELECT *
             FROM approvals
             WHERE id = ?
               AND status = 'PENDING'`,
            [id]
        );

        if (approvals.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Pending approval not found"
            });
        }

        const approval = approvals[0];

        await connection.execute(
            `UPDATE approvals
             SET approver_id = ?,
                 status = 'APPROVED',
                 approved_at = NOW()
             WHERE id = ?`,
            [approverId, id]
        );

        await connection.execute(
            `UPDATE quotations
             SET status = 'APPROVED',
                 updated_at = NOW()
             WHERE id = ?`,
            [approval.quotation_id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: "Quotation approved successfully",
            data: {
                approval_id: id,
                quotation_id: approval.quotation_id,
                status: "APPROVED"
            }
        });

    } catch (error) {

        await connection.rollback();

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    } finally {

        connection.release();
    }
}


async function rejectQuotation(req, res) {

    const connection = await pool.getConnection();

    try {

        const { id } = req.params;
        const approverId = req.user.id;
        const { reason } = req.body;

        await connection.beginTransaction();

        const [approvals] = await connection.execute(
            `SELECT *
             FROM approvals
             WHERE id = ?
               AND status = 'PENDING'`,
            [id]
        );

        if (approvals.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Pending approval not found"
            });
        }

        const approval = approvals[0];

        await connection.execute(
            `UPDATE approvals
             SET approver_id = ?,
                 status = 'REJECTED',
                 reason = ?,
                 approved_at = NOW()
             WHERE id = ?`,
            [
                approverId,
                reason || "Rejected by approver",
                id
            ]
        );

        await connection.execute(
            `UPDATE quotations
             SET status = 'REJECTED',
                 updated_at = NOW()
             WHERE id = ?`,
            [approval.quotation_id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: "Quotation rejected successfully",
            data: {
                approval_id: id,
                quotation_id: approval.quotation_id,
                status: "REJECTED"
            }
        });

    } catch (error) {

        await connection.rollback();

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    } finally {

        connection.release();
    }
}


module.exports = {
    createApproval,
    getAllApprovals,
    getApprovalById,
    approveQuotation,
    rejectQuotation
};