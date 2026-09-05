const dealHealthEngine =
    require("../engines/risk/deal-health.engine");

async function getDealHealth(req, res) {
    try {
        const result =
            await dealHealthEngine.calculateDealHealth(
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
    getDealHealth
};