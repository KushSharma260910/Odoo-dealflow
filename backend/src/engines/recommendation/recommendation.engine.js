const { query } = require('../../config/db');

async function forQuotation(quotationId) {
	return query(
		`SELECT r.*, p.name AS product_name, p.sku, p.base_price
		 FROM product_recommendation_rules r JOIN products p ON p.id = r.recommended_product_id
		 WHERE r.active = TRUE AND r.source_product_id IN
		 (SELECT product_id FROM quotation_items WHERE quotation_id = ?)
		 ORDER BY r.priority DESC, r.min_margin_percent DESC`, [quotationId]
	);
}

async function forProduct(productId) {
	return query(
		`SELECT r.*, p.name AS product_name, p.sku, p.base_price
		 FROM product_recommendation_rules r JOIN products p ON p.id = r.recommended_product_id
		 WHERE r.active = TRUE AND r.source_product_id = ? ORDER BY r.priority DESC`, [productId]
	);
}

module.exports = { forQuotation, forProduct };
