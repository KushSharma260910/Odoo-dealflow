const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const customerRoutes = require("./routes/customers.routes");
const productRoutes = require("./routes/products.routes");
const quotationRoutes = require("./routes/quotations.routes");

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


module.exports = app;