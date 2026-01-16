// backend/server.js
// Complete Backend API for Parking App

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL Connection Pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'parking_app_db',
  user: process.env.DB_USER || 'parking_user',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database error:', err);
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-key';

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate JWT token
const generateToken = (userId, role, rememberMe = false) => {
  const expiresIn = rememberMe ? '30d' : '7d';
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn });
};

// Middleware: Verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Create notification
const createNotification = async (userId, type, title, message, relatedId = null, relatedType = null) => {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, type, title, message, relatedId, relatedType]
    );
  } catch (error) {
    console.error('Notification creation error:', error);
  }
};

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  const { email, phone, password, firstName, lastName, role } = req.body;

  try {
    // Validation
    if (!email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone, and password are required',
        field: 'email',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
        field: 'password',
      });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone',
        field: 'email',
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, phone, password_hash, first_name, last_name, role, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING id, email, phone, first_name, last_name, role, created_at`,
      [email, phone, passwordHash, firstName, lastName, role || 'user']
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken(user.id, user.role, false);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/phone and password are required',
        field: !email ? 'email' : 'password',
      });
    }

    // Find user by email or phone
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR phone = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Your phone or email is incorrect',
        field: 'email',
      });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated',
        field: 'email',
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Your password is incorrect',
        field: 'password',
      });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Generate token
    const token = generateToken(user.id, user.role, rememberMe);

    // If remember me, store session
    if (rememberMe) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await pool.query(
        'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, token, expiresAt]
      );
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isVerified: user.is_verified,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
});

// Verify token
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, phone, first_name, last_name, role, is_verified FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        phone: result.rows[0].phone,
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name,
        role: result.rows[0].role,
        isVerified: result.rows[0].is_verified,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Logout
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  try {
    if (token) {
      await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout error' });
  }
});

// ============================================
// PARKING SPOTS ROUTES
// ============================================

// Get all parking spots
app.get('/api/parking', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ps.*,
        COALESCE(AVG(rr.rating), 0) as average_rating,
        COUNT(rr.id) as total_reviews
      FROM parking_spots ps
      LEFT JOIN ratings_reviews rr ON ps.id = rr.parking_spot_id
      WHERE ps.is_active = TRUE
      GROUP BY ps.id
      ORDER BY ps.created_at DESC
    `);

    res.json({
      success: true,
      parkingSpots: result.rows,
    });
  } catch (error) {
    console.error('Get parking spots error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single parking spot
app.get('/api/parking/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ps.*,
        COALESCE(AVG(rr.rating), 0) as average_rating,
        COUNT(rr.id) as total_reviews
      FROM parking_spots ps
      LEFT JOIN ratings_reviews rr ON ps.id = rr.parking_spot_id
      WHERE ps.id = $1 AND ps.is_active = TRUE
      GROUP BY ps.id
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Parking spot not found' });
    }

    res.json({
      success: true,
      parkingSpot: result.rows[0],
    });
  } catch (error) {
    console.error('Get parking spot error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// RATINGS & REVIEWS ROUTES
// ============================================

// Submit rating and review
app.post('/api/ratings', authenticateToken, async (req, res) => {
  const { parkingSpotId, bookingId, rating, review } = req.body;
  const userId = req.user.userId;

  try {
    // Validation
    if (!parkingSpotId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Parking spot ID and rating are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Check if user has already reviewed this booking
    if (bookingId) {
      const existing = await pool.query(
        'SELECT id FROM ratings_reviews WHERE user_id = $1 AND booking_id = $2',
        [userId, bookingId]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this booking',
        });
      }
    }

    // Insert rating
    const result = await pool.query(
      `INSERT INTO ratings_reviews (user_id, parking_spot_id, booking_id, rating, review)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, parkingSpotId, bookingId, rating, review]
    );

    // Get parking spot owner
    const ownerResult = await pool.query(
      'SELECT owner_id, name FROM parking_spots WHERE id = $1',
      [parkingSpotId]
    );

    if (ownerResult.rows.length > 0) {
      const ownerId = ownerResult.rows[0].owner_id;
      const parkingName = ownerResult.rows[0].name;

      // Create notification for owner
      await createNotification(
        ownerId,
        'new_review',
        'New Review Received',
        `Someone rated your parking "${parkingName}" ${rating} stars${review ? ': ' + review : ''}`,
        result.rows[0].id,
        'rating'
      );
    }

    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      rating: result.rows[0],
    });
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get ratings for a parking spot
app.get('/api/ratings/parking/:parkingSpotId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        rr.*,
        u.first_name,
        u.last_name
      FROM ratings_reviews rr
      JOIN users u ON rr.user_id = u.id
      WHERE rr.parking_spot_id = $1
      ORDER BY rr.created_at DESC
    `, [req.params.parkingSpotId]);

    res.json({
      success: true,
      reviews: result.rows,
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// NOTIFICATIONS ROUTES
// ============================================

// Get user notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.userId]
    );

    res.json({
      success: true,
      notifications: result.rows,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [req.user.userId]
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// SAVED PARKING ROUTES
// ============================================

// Save parking spot
app.post('/api/saved-parking', authenticateToken, async (req, res) => {
  const { parkingSpotId } = req.body;

  try {
    await pool.query(
      'INSERT INTO saved_parking (user_id, parking_spot_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.userId, parkingSpotId]
    );

    res.json({ success: true, message: 'Parking spot saved' });
  } catch (error) {
    console.error('Save parking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Unsave parking spot
app.delete('/api/saved-parking/:parkingSpotId', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM saved_parking WHERE user_id = $1 AND parking_spot_id = $2',
      [req.user.userId, req.params.parkingSpotId]
    );

    res.json({ success: true, message: 'Parking spot unsaved' });
  } catch (error) {
    console.error('Unsave parking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get saved parking spots
app.get('/api/saved-parking', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ps.* FROM parking_spots ps
      JOIN saved_parking sp ON ps.id = sp.parking_spot_id
      WHERE sp.user_id = $1 AND ps.is_active = TRUE
      ORDER BY sp.created_at DESC
    `, [req.user.userId]);

    res.json({
      success: true,
      savedParkingSpots: result.rows,
    });
  } catch (error) {
    console.error('Get saved parking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
  console.log(`📍 Health: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});