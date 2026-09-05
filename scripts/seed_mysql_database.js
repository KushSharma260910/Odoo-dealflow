const path = require('path');
const mysql = require(path.join(__dirname, '../backend/node_modules/mysql2/promise'));
const fs = require('fs');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });

async function seedDatabase() {
  console.log('Connecting to MySQL database...');
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'dealflow360';

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });
    console.log(`Connected to MySQL server at ${host}:${port} as ${user}`);
  } catch (err) {
    console.error('Failed to connect to MySQL server:', err.message);
    process.exit(1);
  }

  try {
    console.log('Recreating dealflow360 database...');
    await connection.query('DROP DATABASE IF EXISTS dealflow360;');
    await connection.query('CREATE DATABASE dealflow360;');
    await connection.changeUser({ database });

    const schemaSql = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    console.log('Executing schema.sql...');
    await connection.query(schemaSql);
    console.log('schema.sql executed successfully.');

    const testDataSql = fs.readFileSync(path.join(__dirname, '../database/test-data.sql'), 'utf8');
    if (testDataSql.trim()) {
      console.log('Executing test-data.sql (1,641 statements)...');
      await connection.query(testDataSql);
      console.log('test-data.sql executed successfully.');
    }

    // Verify row counts
    const [cCount] = await connection.query('SELECT COUNT(*) AS count FROM customers');
    const [uCount] = await connection.query('SELECT COUNT(*) AS count FROM users');
    const [pCount] = await connection.query('SELECT COUNT(*) AS count FROM products');
    const [qCount] = await connection.query('SELECT COUNT(*) AS count FROM quotations');

    console.log('\n--- MYSQL DATABASE POPULATION VERIFICATION ---');
    console.log(`Customers in DB: ${cCount[0].count}`);
    console.log(`Users in DB:     ${uCount[0].count}`);
    console.log(`Products in DB:  ${pCount[0].count}`);
    console.log(`Quotations in DB:${qCount[0].count}`);
    console.log('----------------------------------------------\n');

  } catch (err) {
    console.error('Error populating database:', err.message);
  } finally {
    await connection.end();
  }
}

seedDatabase();
