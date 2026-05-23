// ── Import required packages ──────────────────────────
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

// ── SIGNUP CONTROLLER ─────────────────────────────────
const signup = async (req, res) => {
  try {
    // Get data sent from frontend
    const { username, email, password } = req.body;

    // Check all fields are filled
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'Please fill in all fields' 
      });
    }

    // Check if username already exists
    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ 
        message: 'Username or email already taken' 
      });
    }

    // Hash the password (never store plain text!)
    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save new user to database
    const [result] = await db.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    // Create JWT token
    const token = jwt.sign(
      { id: result.insertId, username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send success response
    res.status(201).json({
      message : 'Account created successfully!',
      token,
      user: {
        id       : result.insertId,
        username,
        email
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

// ── LOGIN CONTROLLER ──────────────────────────────────
const login = async (req, res) => {
  try {
    // Get data sent from frontend
    const { username, password } = req.body;

    // Check all fields are filled
    if (!username || !password) {
      return res.status(400).json({ 
        message: 'Please fill in all fields' 
      });
    }

    // Find user in database
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(400).json({ 
        message: 'Invalid username or password' 
      });
    }

    const user = users[0];

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ 
        message: 'Invalid username or password' 
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send success response
    res.status(200).json({
      message : 'Login successful!',
      token,
      user: {
        id      : user.id,
        username: user.username,
        email   : user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ── Export controllers ────────────────────────────────
module.exports = { signup, login }; 
