
const bcrypt = require('bcrypt');
const pool = require('../../config/db');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Basic validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, password and role are required'
            });
        }

        // Validate role
        if (!['CLIENT', 'FREELANCER'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role must be CLIENT or FREELANCER'
            });
        }

        // Check whether email already exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const [result] = await pool.execute(
            `INSERT INTO users
                (name, email, password_hash, role)
             VALUES (?, ?, ?, ?)`,
            [name, email, passwordHash, role]
        );

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: result.insertId,
                name,
                email,
                role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        const [users] = await pool.execute(
            `SELECT id, name, email, password_hash, role, is_active
             FROM users
             WHERE email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        // Check account status
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is inactive'
            });
        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '1d'
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getMe = async (req, res) => {
    try {
        const [users] = await pool.execute(
            `SELECT id, name, email, role, is_active, created_at, updated_at
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Account is inactive'
            });
        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Get current user error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    register,
    login,
    getMe
};

