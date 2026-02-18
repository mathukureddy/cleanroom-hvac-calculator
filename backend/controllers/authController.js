const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Find user
    const [users] = await db.query(
      `SELECT l.*, c.first_name, c.last_name, c.email, c.id as customer_id 
       FROM LOGIN l 
       LEFT JOIN CUSTOMER c ON l.customer_id = c.id 
       WHERE l.username = ?`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        customerId: user.customer_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        customerId: user.customer_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Register (customer self-registration)
exports.register = async (req, res) => {
  try {
    const { username, password, firstName, lastName, email, phone, address } = req.body;

    // Validate input
    if (!username || !password || !firstName || !lastName || !email) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if username exists
    const [existingUsers] = await db.query('SELECT id FROM LOGIN WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Check if email exists
    const [existingEmails] = await db.query('SELECT id FROM CUSTOMER WHERE email = ?', [email]);
    if (existingEmails.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create customer
    const [customerResult] = await db.query(
      'INSERT INTO CUSTOMER (first_name, last_name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
      [firstName, lastName, email, phone || '', address || '']
    );

    // Create login
    await db.query(
      'INSERT INTO LOGIN (customer_id, username, password, role) VALUES (?, ?, ?, ?)',
      [customerResult.insertId, username, hashedPassword, 'customer']
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT l.id, l.username, l.role, c.first_name, c.last_name, c.email, c.phone, c.address, c.id as customer_id
       FROM LOGIN l
       LEFT JOIN CUSTOMER c ON l.customer_id = c.id
       WHERE l.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      customerId: user.customer_id
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
