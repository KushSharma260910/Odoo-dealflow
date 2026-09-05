const { pool } = require("../../config/db");


async function getRecommendationsForProduct(productId) {

    const [recommendations] = await pool.execute(
        `SELECT
            pr.id,
            pr.source_product_id,
            pr.recommended_product_id,
            pr.recommendation_type,
            pr.score,
            pr.reason,

            p.name AS recommended_product_name,
            p.description AS recommended_product_description,
            p.price AS recommended_product_price,
            p.tax_percent AS recommended_product_tax

         FROM product_recommendations pr

         JOIN products p
           ON pr.recommended_product_id = p.id

         WHERE pr.source_product_id = ?
           AND pr.is_active = 1
           AND p.is_active = 1

         ORDER BY
             pr.recommendation_type,
             pr.score DESC`,
        [productId]
    );

    return recommendations;
}


async function getRecommendationsForQuotation(quotationId) {

    const [items] = await pool.execute(
        `SELECT
            qi.product_id,
            p.name AS product_name
         FROM quotation_items qi
         JOIN products p
           ON qi.product_id = p.id
         WHERE qi.quotation_id = ?`,
        [quotationId]
    );

    if (items.length === 0) {
        throw new Error("Quotation has no products");
    }

    const recommendations = [];

    for (const item of items) {

        const productRecommendations =
            await getRecommendationsForProduct(
                item.product_id
            );

        for (const recommendation of productRecommendations) {

            recommendations.push({
                source_product_id: item.product_id,
                source_product_name: item.product_name,

                recommended_product_id:
                    recommendation.recommended_product_id,

                recommended_product_name:
                    recommendation.recommended_product_name,

                recommendation_type:
                    recommendation.recommendation_type,

                score: Number(recommendation.score),

                reason: recommendation.reason,

                price: Number(
                    recommendation.recommended_product_price
                )
            });
        }
    }

    return recommendations;
}


async function createRecommendation(data) {

    const {
        source_product_id,
        recommended_product_id,
        recommendation_type,
        score,
        reason
    } = data;

    const [result] = await pool.execute(
        `INSERT INTO product_recommendations
        (
            source_product_id,
            recommended_product_id,
            recommendation_type,
            score,
            reason
        )
        VALUES (?, ?, ?, ?, ?)`,
        [
            source_product_id,
            recommended_product_id,
            recommendation_type,
            score || 0,
            reason || null
        ]
    );

    return {
        id: result.insertId,
        ...data
    };
}


module.exports = {
    getRecommendationsForProduct,
    getRecommendationsForQuotation,
    createRecommendation
};