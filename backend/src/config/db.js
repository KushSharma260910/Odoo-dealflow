const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "Piyush@181745",
    database: "dealflow360",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log("✅ MySQL connected successfully");
        connection.release();
    } catch (error) {
        console.error("❌ MySQL connection failed:", error.message);
    }
}

module.exports = {
    pool,
    testConnection
};