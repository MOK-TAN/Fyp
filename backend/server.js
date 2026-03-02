const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// IMPORTANT: Middleware MUST be before routes
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected at:', res.rows[0].now);
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'ParkEase API', 
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Test database endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time, current_database() as db');
    res.json({ 
      success: true, 
      database: result.rows[0].db,
      time: result.rows[0].time,
      message: 'Database connection working!'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Debug endpoint - test if body is being received
app.post('/api/test-body', (req, res) => {
  console.log('Received body:', req.body);
  res.json({
    success: true,
    receivedBody: req.body
  });
});

// Import routes AFTER middleware
const authRoutes = require('./routes/auth');

// Use routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false,
    error: 'Internal server error' 
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` http://localhost:${PORT}`);
  console.log(` API: http://localhost:${PORT}/api`);
});

// Export pool for use in other files
module.exports = { pool };