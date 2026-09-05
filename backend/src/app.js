const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const customerRoutes = require("./routes/customers.routes");
const productRoutes = require("./routes/products.routes");
const quotationRoutes = require("./routes/quotations.routes");
const discountRoutes = require("./routes/discounts.routes");
const approvalRoutes = require("./routes/approvals.routes");
const riskRoutes = require("./routes/risk.routes");
const warehouseRoutes = require("./routes/warehouses.routes");
const recommendationRoutes =require("./routes/recommendations.routes");
const negotiationRoutes = require("./routes/negotiations.routes");
const billingRoutes = require("./routes/billing.routes");
const dealHealthRoutes = require("./routes/deal-health.routes");
const anomalyRoutes = require("./routes/anomaly.routes");
const auditRoutes = require("./routes/audit.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
    

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "DealFlow360 Backend is running 🚀"
    });
});


// Authentication APIs
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api", riskRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/negotiations", negotiationRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api", dealHealthRoutes);
app.use("/api", anomalyRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/dashboard", dashboardRoutes);


module.exports = app;