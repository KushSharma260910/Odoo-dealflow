const { pool } = require("../config/db");


async function getAllApprovals() {

    const [rows] = await pool.execute(
        `SELECT
            a.*,
            q.quotation_number,
            u.email AS approver_email
         FROM approvals a
         JOIN quotations q
           ON a.quotation_id = q.id
         LEFT JOIN users u
           ON a.approver_id = u.id
         ORDER BY a.created_at DESC`
    );

    return rows;
}


async function getApprovalById(id) {

    const [rows] = await pool.execute(
        `SELECT
            a.*,
            q.quotation_number,
            u.email AS approver_email
         FROM approvals a
         JOIN quotations q
           ON a.quotation_id = q.id
         LEFT JOIN users u
           ON a.approver_id = u.id
         WHERE a.id = ?`,
        [id]
    );

    return rows[0];
}


async function updateApprovalStatus(
    id,
    status,
    approverId
) {

    const [result] = await pool.execute(
        `UPDATE approvals
         SET
            status = ?,
            approver_id = ?,
            approved_at =
                CASE
                    WHEN ? IN ('APPROVED', 'REJECTED')
                    THEN NOW()
                    ELSE approved_at
                END
         WHERE id = ?
           AND status = 'PENDING'`,
        [
            status,
            approverId,
            status,
            id
        ]
    );

    return result.affectedRows > 0;
}


module.exports = {
    getAllApprovals,
    getApprovalById,
    updateApprovalStatus
};