require("dotenv").config();

module.exports = {
  port: Number(process.env.PORT || 5000),
  jwtSecret: process.env.JWT_SECRET || "dealflow360_secret",
  database: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "dealflow360",
  },
};
