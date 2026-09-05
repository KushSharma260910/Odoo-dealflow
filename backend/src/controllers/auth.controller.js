const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const { generateToken } = require("../utils/jwt");

async function register(req, res, next) {
  try {
    const { name, company_name, email, password, role = "CUSTOMER" } = req.body;
    const cleanEmail = (email || "").toString().trim().toLowerCase();
    const cleanPassword = (password || "").toString().trim();

    if (!name || !cleanEmail || !cleanPassword)
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });

    if (role !== "CUSTOMER")
      return res.status(403).json({
        success: false,
        message: "Only customer self-registration is allowed",
      });

    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE LOWER(TRIM(email)) = ?",
      [cleanEmail]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists. Please sign in.",
      });
    }

    // 1. Create Customer Account in customers table
    const [custResult] = await pool.execute(
      "INSERT INTO customers (name, email, company_name, tier, status) VALUES (?, ?, ?, 'BRONZE', 'ACTIVE')",
      [name, cleanEmail, company_name || null]
    );
    const newCustomerId = custResult.insertId;

    // 2. Create User Credentials in users table
    const passwordHash = await bcrypt.hash(cleanPassword, 10);
    const [userResult] = await pool.execute(
      "INSERT INTO users (customer_id, name, email, password, role, status) VALUES (?, ?, ?, ?, 'CUSTOMER', 'ACTIVE')",
      [newCustomerId, name, cleanEmail, passwordHash]
    );

    const user = {
      id: userResult.insertId,
      customer_id: newCustomerId,
      name,
      email: cleanEmail,
      role: "CUSTOMER",
    };

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Customer account created successfully",
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const cleanEmail = (req.body.email || "").toString().trim().toLowerCase();
    const cleanPassword = (req.body.password || "").toString().trim();
    if (!cleanEmail || !cleanPassword)
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    const [users] = await pool.execute(
      "SELECT id, customer_id, name, email, password, role, status FROM users WHERE LOWER(TRIM(email)) = ?",
      [cleanEmail],
    );
    const user = users[0];
    if (
      !user ||
      user.status !== "ACTIVE" ||
      !user.password ||
      !(await bcrypt.compare(cleanPassword, user.password))
    )
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    return res.json({
      success: true,
      token: generateToken(user),
      user: {
        id: user.id,
        customer_id: user.customer_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const [users] = await pool.execute(
      "SELECT id, customer_id, name, email, role, status, created_at FROM users WHERE id = ?",
      [req.user.id],
    );
    return users[0]
      ? res.json({ success: true, user: users[0] })
      : res.status(404).json({ success: false, message: "User not found" });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, me };
