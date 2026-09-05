const { pool } = require("../../config/db");

async function getRiskRules() {
    const [rules] = await pool.execute(
        `SELECT *
         FROM risk_rules
         WHERE is_active = 1`
    );

    return rules;
}

function getRiskLevel(score) {
    if (score <= 30) return "LOW";
    if (score <= 60) return "MEDIUM";
    if (score <= 80) return "HIGH";
    return "CRITICAL";
}

function getDecision(riskLevel) {
    const decisions = {
        LOW: "AUTO_APPROVE",
        MEDIUM: "MANAGER_REVIEW",
        HIGH: "FINANCE_REVIEW",
        CRITICAL: "BLOCK"
    };

    return decisions[riskLevel];
}

module.exports = {
    getRiskRules,
    getRiskLevel,
    getDecision
};