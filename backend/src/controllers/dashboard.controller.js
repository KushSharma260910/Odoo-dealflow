const dashboardEngine = require("../engines/dashboard/dashboard.engine");


async function getOverview(req, res) {
    try {

        const data = await dashboardEngine.getOverview();

        res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error("Dashboard overview error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function getRiskDashboard(req, res) {
    try {

        const data = await dashboardEngine.getRiskDashboard();

        res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error("Dashboard risk error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function getApprovalDashboard(req, res) {
    try {

        const data = await dashboardEngine.getApprovalDashboard();

        res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error("Dashboard approval error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function getFulfillmentDashboard(req, res) {
    try {

        const data = await dashboardEngine.getFulfillmentDashboard();

        res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error("Dashboard fulfillment error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function getRevenueDashboard(req, res) {
    try {

        const data = await dashboardEngine.getRevenueDashboard();

        res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error("Dashboard revenue error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


module.exports = {
    getOverview,
    getRiskDashboard,
    getApprovalDashboard,
    getFulfillmentDashboard,
    getRevenueDashboard
};