const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  try {
    const { pool } = require('../server');

    // Validation
    if (!phone || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Phone and password are required' 
      });
    }

    // Get user from database
    const result = await pool.query(
      'SELECT * FROM profiles WHERE phone = $1',
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid phone or password' 
      });
    }

    const user = result.rows[0];

    // Check if password_hash exists
    if (!user.password_hash) {
      return res.status(401).json({ 
        success: false,
        error: 'Account not properly set up. Please contact support.' 
      });
    }

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid phone or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        phone: user.phone, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '7d' }
    );

    // Return success with token and user info
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error. Please try again.' 
    });
  }
});

// Register endpoint (for future use)
router.post('/register', async (req, res) => {
  const { phone, password, full_name } = req.body;

  try {
    const { pool } = require('../server');

    // Validation
    if (!phone || !password || !full_name) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required' 
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM profiles WHERE phone = $1',
      [phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Phone number already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO profiles (id, phone, password_hash, full_name, role) 
       VALUES (gen_random_uuid(), $1, $2, $3, 'user') 
       RETURNING id, phone, full_name, role`,
      [phone, hashedPassword, full_name]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        full_name: user.full_name,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Registration failed. Please try again.' 
    });
  }
});

module.exports = router;