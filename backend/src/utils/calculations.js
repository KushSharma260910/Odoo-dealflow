function round(value) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
function lineTotals(item) {
	const gross = round(Number(item.unit_price) * Number(item.quantity));
	const discount = round(gross * Number(item.discount_percent || 0) / 100);
	const taxable = gross - discount;
	const tax = round(taxable * Number(item.tax_percent || 0) / 100);
	const total = round(taxable + tax);
	const cost = round(Number(item.cost_price || 0) * Number(item.quantity));
	return { discount_amount: discount, tax_amount: tax, line_total: total, cost_amount: cost, margin_amount: round(taxable - cost), margin_percent: taxable ? round((taxable - cost) * 100 / taxable) : 0 };
}
module.exports = { round, lineTotals };
