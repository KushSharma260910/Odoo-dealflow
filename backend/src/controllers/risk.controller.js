const {
    analyzeQuotationRisk
} = require("../engines/risk/risk.engine");


async function analyzeRisk(req, res) {

    try {

        const quotationId =
            req.params.id;

        const result =
            await analyzeQuotationRisk(
                quotationId
            );

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error(error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


module.exports = {
    analyzeRisk
};