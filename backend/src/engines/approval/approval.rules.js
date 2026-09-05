function getApprovalRequirement(riskLevel) {
    const rules = {
        LOW: {
            required: false,
            role: null,
            decision: "AUTO_APPROVE"
        },

        MEDIUM: {
            required: true,
            role: "SALES_MANAGER",
            decision: "MANAGER_REVIEW"
        },

        HIGH: {
            required: true,
            role: "FINANCE",
            decision: "FINANCE_REVIEW"
        },

        CRITICAL: {
            required: false,
            role: null,
            decision: "BLOCK"
        }
    };

    return rules[riskLevel] || null;
}

module.exports = {
    getApprovalRequirement
};