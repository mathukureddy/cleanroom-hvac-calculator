const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Get all customers (Admin only)
exports.getAllCustomers = async (req, res) => {
  try {
    const [customers] = await db.query(
      `SELECT c.*, l.username, l.role 
       FROM CUSTOMER c 
       LEFT JOIN LOGIN l ON l.customer_id = c.id
       ORDER BY c.create_datetime DESC`
    );
    
    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single customer
exports.getCustomerById = async (req, res) => {
  try {
    const [customers] = await db.query(
      `SELECT c.*, l.username, l.role 
       FROM CUSTOMER c 
       LEFT JOIN LOGIN l ON l.customer_id = c.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customers[0]);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create customer (Admin only)
exports.createCustomer = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, username, password } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !username || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if email exists
    const [existingEmails] = await db.query('SELECT id FROM CUSTOMER WHERE email = ?', [email]);
    if (existingEmails.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Check if username exists
    const [existingUsers] = await db.query('SELECT id FROM LOGIN WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
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

    res.status(201).json({ 
      message: 'Customer created successfully',
      customerId: customerResult.insertId
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address } = req.body;
    const customerId = req.params.id;

    // Check if customer exists
    const [existing] = await db.query('SELECT id FROM CUSTOMER WHERE id = ?', [customerId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Update customer
    await db.query(
      'UPDATE CUSTOMER SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
      [firstName, lastName, email, phone || '', address || '', customerId]
    );

    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;

    // Check if customer exists
    const [existing] = await db.query('SELECT id FROM CUSTOMER WHERE id = ?', [customerId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Delete customer (CASCADE will handle LOGIN and projects)
    await db.query('DELETE FROM CUSTOMER WHERE id = ?', [customerId]);

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
