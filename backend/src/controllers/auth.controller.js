const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const { generateToken } = require("../utils/jwt");


// ==============================
// REGISTER
// ==============================

async function register(req, res) {
    try {

        const {
            name,
            email,
            password,
            role
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        // Check existing user
        const [existingUsers] = await pool.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Prevent users from creating privileged accounts
        const userRole = role || "CUSTOMER";

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            `INSERT INTO users
            (name, email, password_hash, role)
            VALUES (?, ?, ?, ?)`,
            [
                name,
                email,
                passwordHash,
                userRole
            ]
        );

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: result.insertId,
                name,
                email,
                role: userRole
            }
        });

    } catch (error) {

        console.error("Register error:", error);

        res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
}


// ==============================
// LOGIN
// ==============================

async function login(req, res) {

    try {

        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const [users] = await pool.query(
            `SELECT
                id,
                name,
                email,
                password_hash,
                role,
                status
             FROM users
             WHERE email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        if (user.status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                message: "Account is inactive"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user);

        res.json({
            success: true,
            message: "Login successful",

            token,

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
}


// ==============================
// CURRENT USER
// ==============================

async function me(req, res) {

    try {

        const [users] = await pool.query(
            `SELECT
                id,
                name,
                email,
                role,
                status,
                created_at
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user: users[0]
        });

    } catch (error) {

        console.error("Me error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch user"
        });
    }
}


module.exports = {
    register,
    login,
    me
};