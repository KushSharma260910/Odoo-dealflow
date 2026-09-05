const { pool } = require("../../config/db");


/*
====================================================
CREATE AUDIT LOG
====================================================
*/

async function createAuditLog({
    userId = null,
    entityType,
    entityId = null,
    action,
    oldValue = null,
    newValue = null,
    reason = null
}) {

    if (!entityType) {
        throw new Error("Entity type is required");
    }

    if (!action) {
        throw new Error("Audit action is required");
    }


    const [result] = await pool.execute(
        `INSERT INTO audit_logs
        (
            user_id,
            entity_type,
            entity_id,
            action,
            old_value,
            new_value,
            reason
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            entityType,
            entityId,
            action,

            oldValue
                ? JSON.stringify(oldValue)
                : null,

            newValue
                ? JSON.stringify(newValue)
                : null,

            reason
        ]
    );


    return {
        id: result.insertId,
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        action
    };
}


/*
====================================================
GET AUDIT LOGS FOR ENTITY
====================================================
*/

async function getAuditLogs(entityType, entityId) {

    const [logs] = await pool.execute(
        `SELECT *
         FROM audit_logs
         WHERE entity_type = ?
           AND entity_id = ?
         ORDER BY created_at DESC`,
        [
            entityType,
            entityId
        ]
    );


    return logs;
}


/*
====================================================
GET ALL AUDIT LOGS
====================================================
*/

async function getAllAuditLogs() {

    const [logs] = await pool.execute(
        `SELECT *
         FROM audit_logs
         ORDER BY created_at DESC`
    );


    return logs;
}


module.exports = {
    createAuditLog,
    getAuditLogs,
    getAllAuditLogs
};