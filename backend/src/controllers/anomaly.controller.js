const anomalyEngine =
    require("../engines/anomaly/anomaly.engine");


async function detectAnomalies(req, res) {

    try {

        const result =
            await anomalyEngine.detectQuotationAnomalies(
                req.params.quotationId
            );

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


module.exports = {
    detectAnomalies
};