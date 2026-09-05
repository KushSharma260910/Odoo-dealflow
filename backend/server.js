require("dotenv").config();

const app = require("./src/app");
const { testConnection } = require("./src/config/db");

const PORT = 5000;

async function startServer() {
    await testConnection();

    app.listen(PORT, () => {
        console.log(`🚀 DealFlow360 server running on http://localhost:${PORT}`);
    });
}

startServer();