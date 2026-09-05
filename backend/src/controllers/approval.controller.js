const approvalEngine =
    require("../engines/approval/approval.engine");


// ======================================================
// CREATE APPROVAL
// ======================================================

async function createApproval(req, res) {

    try {

        const result =
            await approvalEngine.createApprovalForQuotation(
                req.params.id
            );

        res.status(201).json({
            success: true,
            message:
                "Approval workflow processed",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


// ======================================================
// GET ALL
// ======================================================

async function getAllApprovals(req, res) {

    try {

        const result =
            await approvalEngine.getAllApprovals();

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


// ======================================================
// GET ONE
// ======================================================

async function getApprovalById(req, res) {

    try {

        const result =
            await approvalEngine.getApprovalById(
                req.params.id
            );

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
}


// ======================================================
// APPROVE
// ======================================================

async function approveQuotation(req, res) {

    try {

        const result =
            await approvalEngine.approveApproval(
                req.params.id,
                req.user.id
            );

        res.json({
            success: true,
            message:
                "Approval processed successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


// ======================================================
// REJECT
// ======================================================

async function rejectQuotation(req, res) {

    try {

        const result =
            await approvalEngine.rejectApproval(
                req.params.id,
                req.user.id,
                req.body.reason
            );

        res.json({
            success: true,
            message:
                "Approval rejected successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


module.exports = {

    createApproval,

    getAllApprovals,

    getApprovalById,

    approveQuotation,

    rejectQuotation
};