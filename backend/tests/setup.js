// Test setup file
const db = require('../config/database');

beforeAll(async () => {
  // Setup test environment
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup
  if (db && db.end) {
    await db.end();
  }
  console.log('Test environment cleaned up');
});

// Global test utilities
global.testUtils = {
  createMockUser: () => ({
    id: 1,
    username: 'testuser',
    role: 'customer',
    customerId: 1
  }),
  
  createMockAdmin: () => ({
    id: 2,
    username: 'admin',
    role: 'admin',
    customerId: 2
  })
};
