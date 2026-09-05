const {
    getRecommendationsForProduct,
    getRecommendationsForQuotation,
    createRecommendation
} = require("../engines/recommendation/recommendation.engine");


async function create(req, res) {

    try {

        const recommendation =
            await createRecommendation(req.body);

        res.status(201).json({
            success: true,
            data: recommendation
        });

    } catch (error) {

        console.error(error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


async function getByProduct(req, res) {

    try {

        const { productId } = req.params;

        const recommendations =
            await getRecommendationsForProduct(productId);

        res.json({
            success: true,
            data: recommendations
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function getByQuotation(req, res) {

    try {

        const { quotationId } = req.params;

        const recommendations =
            await getRecommendationsForQuotation(
                quotationId
            );

        res.json({
            success: true,
            data: recommendations
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


module.exports = {
    create,
    getByProduct,
    getByQuotation
};