const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");

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


module.exports = app;