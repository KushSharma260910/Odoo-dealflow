const mysql = require('mysql2/promise');

const pool = mysql.createPool({
	host: process.env.DB_HOST || 'localhost',
	port: Number(process.env.DB_PORT || 3306),
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_NAME || 'dealflow360',
	waitForConnections: true,
	connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
	decimalNumbers: true,
	queueLimit: 0
});

async function testConnection() {
	const connection = await pool.getConnection();
	connection.release();
	return true;
}

async function query(sql, params = []) {
	const [rows] = await pool.execute(sql, params);
	return rows;
}

module.exports = { pool, query, testConnection };
