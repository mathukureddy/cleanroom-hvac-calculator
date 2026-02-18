const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/standards', require('./routes/standards'));
app.use('/api/projects', require('./routes/projects'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Cleanroom API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🏭 Cleanroom HVAC Calculator API Server               ║
║                                                            ║
║     Server is running on port ${PORT}                       ║
║     Environment: ${process.env.NODE_ENV || 'development'}                             ║
║                                                            ║
║     API Endpoints:                                         ║
║     • POST   /api/auth/login                              ║
║     • POST   /api/auth/register                           ║
║     • GET    /api/auth/me                                 ║
║     • GET    /api/customers                               ║
║     • GET    /api/standards                               ║
║     • GET    /api/projects                                ║
║     • GET    /api/health                                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
