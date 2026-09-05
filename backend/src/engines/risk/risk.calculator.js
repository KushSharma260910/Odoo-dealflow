function calculateMarginRisk(actualMargin, minimumMargin) {
    if (actualMargin >= minimumMargin) {
        return 0;
    }

    return minimumMargin - actualMargin;
}


function calculateDiscountRisk(discountPercent, allowedDiscount) {
    if (discountPercent <= allowedDiscount) {
        return 0;
    }

    return discountPercent - allowedDiscount;
}


function normalizeRisk(value, rule) {

    if (value <= Number(rule.low_threshold)) {
        return 0;
    }

    if (value <= Number(rule.medium_threshold)) {
        return 25;
    }

    if (value <= Number(rule.high_threshold)) {
        return 60;
    }

    if (value <= Number(rule.critical_threshold)) {
        return 85;
    }

    return 100;
}


function calculateRiskScore(factors, rules) {

    let totalScore = 0;
    let totalWeight = 0;

    for (const rule of rules) {

        const factorName =
            rule.factor_name.toLowerCase();

        const factorValue =
            factors[factorName] ?? 0;

        const normalizedRisk =
            normalizeRisk(
                factorValue,
                rule
            );

        const weight =
            Number(rule.weight_percent);

        totalScore +=
            normalizedRisk * weight;

        totalWeight += weight;
    }

    if (totalWeight === 0) {
        return 0;
    }

    return Math.round(
        totalScore / totalWeight
    );
}


module.exports = {
    calculateMarginRisk,
    calculateDiscountRisk,
    calculateRiskScore
};