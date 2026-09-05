const RULES = {
    DISCOUNT: {
        normalMax: 10,
        warningMax: 20,
        criticalMax: 30
    },

    MARGIN: {
        minimum: 15
    },

    DEAL_VALUE: {
        unusuallyHigh: 500000
    }
};

function getSeverity(type, value) {

    if (type === "DISCOUNT") {
        if (value > RULES.DISCOUNT.criticalMax) {
            return "CRITICAL";
        }

        if (value > RULES.DISCOUNT.warningMax) {
            return "HIGH";
        }

        if (value > RULES.DISCOUNT.normalMax) {
            return "MEDIUM";
        }
    }

    if (type === "MARGIN") {
        if (value < 0) {
            return "CRITICAL";
        }

        if (value < RULES.MARGIN.minimum) {
            return "HIGH";
        }
    }

    if (type === "DEAL_VALUE") {
        if (value > RULES.DEAL_VALUE.unusuallyHigh) {
            return "MEDIUM";
        }
    }

    return null;
}

module.exports = {
    RULES,
    getSeverity
};