const auditEngine = require("../engines/audit/audit.engine");


// GET audit logs for a specific entity
async function getEntityAuditLogs(req, res) {
    try {
        const { entityType, entityId } = req.params;

        const logs = await auditEngine.getAuditLogs(
            entityType,
            entityId
        );

        res.json({
            success: true,
            data: logs
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


// GET all audit logs
async function getAllAuditLogs(req, res) {
    try {

        const logs = await auditEngine.getAllAuditLogs();

        res.json({
            success: true,
            data: logs
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


module.exports = {
    getEntityAuditLogs,
    getAllAuditLogs
};