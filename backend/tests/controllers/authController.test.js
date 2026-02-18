const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const db = require('../../config/database');

// Mock database
jest.mock('../../config/database');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    test('should register a new customer successfully', async () => {
      // Mock database queries
      db.query
        .mockResolvedValueOnce([[]])  // Check if user exists
        .mockResolvedValueOnce([{ insertId: 1 }])  // Insert customer
        .mockResolvedValueOnce([{ insertId: 1 }]);  // Insert login

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          custName: 'Test User',
          email: 'testuser@example.com',
          password: 'Password123!',
          contactNo: '1234567890',
          address: '123 Test St'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Customer registered successfully');
      expect(response.body).toHaveProperty('customerId');
    });

    test('should fail if user already exists', async () => {
      // Mock existing user
      db.query.mockResolvedValueOnce([[{ loginId: 1 }]]);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          custName: 'Test User',
          email: 'existing@example.com',
          password: 'Password123!',
          contactNo: '1234567890',
          address: '123 Test St'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'User already exists');
    });

    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          custName: 'Test User',
          // Missing email, password, etc.
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          custName: 'Test User',
          email: 'invalid-email',
          password: 'Password123!',
          contactNo: '1234567890',
          address: '123 Test St'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          custName: 'Test User',
          email: 'testuser@example.com',
          password: '123',  // Too short/weak
          contactNo: '1234567890',
          address: '123 Test St'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle database errors gracefully', async () => {
      db.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          custName: 'Test User',
          email: 'testuser@example.com',
          password: 'Password123!',
          contactNo: '1234567890',
          address: '123 Test St'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login customer successfully', async () => {
      const mockUser = {
        loginId: 1,
        email: 'customer@example.com',
        password: '$2b$10$validHashedPassword', // Mock bcrypt hash
        role: 'Customer',
        custId: 1,
        custName: 'Test Customer'
      };

      // Mock database query and bcrypt compare
      db.query.mockResolvedValueOnce([[mockUser]]);
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'customer@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('customer@example.com');
      expect(response.body.user.role).toBe('Customer');
    });

    test('should login admin successfully', async () => {
      const mockAdmin = {
        loginId: 1,
        email: 'admin@cleanroom.com',
        password: '$2b$10$validHashedPassword',
        role: 'Admin'
      };

      db.query.mockResolvedValueOnce([[mockAdmin]]);
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@cleanroom.com',
          password: 'Admin123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.role).toBe('Admin');
    });

    test('should fail with invalid email', async () => {
      db.query.mockResolvedValueOnce([[]]);  // No user found

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('should fail with incorrect password', async () => {
      const mockUser = {
        loginId: 1,
        email: 'customer@example.com',
        password: '$2b$10$validHashedPassword',
        role: 'Customer'
      };

      db.query.mockResolvedValueOnce([[mockUser]]);
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'customer@example.com',
          password: 'WrongPassword!'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'customer@example.com'
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should return JWT token with correct payload', async () => {
      const mockUser = {
        loginId: 1,
        email: 'customer@example.com',
        password: '$2b$10$validHashedPassword',
        role: 'Customer',
        custId: 1,
        custName: 'Test Customer'
      };

      db.query.mockResolvedValueOnce([[mockUser]]);
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'customer@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      
      // Verify token structure (basic check)
      const tokenParts = response.body.token.split('.');
      expect(tokenParts).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('Password Security', () => {
    test('should hash password before storing', async () => {
      db.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([{ insertId: 1 }]);

      const plainPassword = 'Password123!';
      
      await request(app)
        .post('/api/auth/register')
        .send({
          custName: 'Test User',
          email: 'testuser@example.com',
          password: plainPassword,
          contactNo: '1234567890',
          address: '123 Test St'
        });

      // Check that bcrypt was called
      const insertCalls = db.query.mock.calls.filter(call => 
        call[0].includes('INSERT INTO LOGIN')
      );
      
      expect(insertCalls.length).toBeGreaterThan(0);
      // The stored password should not be the plain password
      const storedPassword = insertCalls[0][1][1];
      expect(storedPassword).not.toBe(plainPassword);
    });

    test('should not expose password in response', async () => {
      const mockUser = {
        loginId: 1,
        email: 'customer@example.com',
        password: '$2b$10$validHashedPassword',
        role: 'Customer',
        custId: 1,
        custName: 'Test Customer'
      };

      db.query.mockResolvedValueOnce([[mockUser]]);
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'customer@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
    });
  });

  describe('Rate Limiting and Security', () => {
    test('should handle multiple rapid login attempts', async () => {
      db.query.mockResolvedValue([[]]);

      const promises = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'password123'
          })
      );

      const responses = await Promise.all(promises);
      
      // All should complete (rate limiting would be middleware)
      responses.forEach(response => {
        expect([401, 429]).toContain(response.status);
      });
    });
  });
});
