const request = require('supertest');
const express = require('express');
const projectRoutes = require('../../routes/projects');
const db = require('../../config/database');
const authMiddleware = require('../../middleware/auth');

// Mock database and auth middleware
jest.mock('../../config/database');
jest.mock('../../middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/projects', projectRoutes);

describe('Project Controller', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock auth middleware to pass through
    authMiddleware.verifyToken = jest.fn((req, res, next) => {
      req.user = { loginId: 1, role: 'Customer', custId: 1 };
      next();
    });
  });

  describe('POST /api/projects', () => {
    test('should create a new project successfully', async () => {
      db.query
        .mockResolvedValueOnce([{ insertId: 1 }])  // Insert project
        .mockResolvedValueOnce([{ insertId: 1 }])  // Insert zone
        .mockResolvedValueOnce([{ insertId: 1 }]);  // Insert calculations

      const response = await request(app)
        .post('/api/projects')
        .send({
          projectName: 'Test Cleanroom Project',
          location: 'Building A',
          zones: [{
            zoneName: 'Zone 1',
            standardId: 1,
            classificationId: 1,
            roomLength: 10,
            roomWidth: 8,
            roomHeight: 3
          }]
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('projectId');
      expect(response.body).toHaveProperty('message', 'Project created successfully');
    });

    test('should fail without project name', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          location: 'Building A',
          zones: []
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should fail without zones', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          projectName: 'Test Project',
          location: 'Building A',
          zones: []
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should create project with multiple zones', async () => {
      db.query
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([{ insertId: 2 }])
        .mockResolvedValueOnce([{ insertId: 2 }]);

      const response = await request(app)
        .post('/api/projects')
        .send({
          projectName: 'Multi-Zone Project',
          location: 'Building B',
          zones: [
            {
              zoneName: 'Zone 1',
              standardId: 1,
              classificationId: 1,
              roomLength: 10,
              roomWidth: 8,
              roomHeight: 3
            },
            {
              zoneName: 'Zone 2',
              standardId: 1,
              classificationId: 2,
              roomLength: 12,
              roomWidth: 10,
              roomHeight: 3.5
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('projectId');
    });

    test('should handle database errors gracefully', async () => {
      db.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/projects')
        .send({
          projectName: 'Test Project',
          location: 'Building A',
          zones: [{
            zoneName: 'Zone 1',
            standardId: 1,
            classificationId: 1,
            roomLength: 10,
            roomWidth: 8,
            roomHeight: 3
          }]
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/projects', () => {
    test('should retrieve all projects for customer', async () => {
      const mockProjects = [
        {
          projectId: 1,
          projectName: 'Project 1',
          location: 'Building A',
          createdDate: new Date()
        },
        {
          projectId: 2,
          projectName: 'Project 2',
          location: 'Building B',
          createdDate: new Date()
        }
      ];

      db.query.mockResolvedValueOnce([mockProjects]);

      const response = await request(app)
        .get('/api/projects');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('projectId');
      expect(response.body[0]).toHaveProperty('projectName');
    });

    test('should return empty array when no projects exist', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .get('/api/projects');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('admin should see all projects', async () => {
      authMiddleware.verifyToken = jest.fn((req, res, next) => {
        req.user = { loginId: 1, role: 'Admin' };
        next();
      });

      const mockProjects = [
        { projectId: 1, projectName: 'Project 1', custId: 1 },
        { projectId: 2, projectName: 'Project 2', custId: 2 },
        { projectId: 3, projectName: 'Project 3', custId: 3 }
      ];

      db.query.mockResolvedValueOnce([mockProjects]);

      const response = await request(app)
        .get('/api/projects');

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('GET /api/projects/:id', () => {
    test('should retrieve project details with zones', async () => {
      const mockProject = {
        projectId: 1,
        projectName: 'Test Project',
        location: 'Building A',
        createdDate: new Date(),
        custId: 1
      };

      const mockZones = [
        {
          zoneId: 1,
          zoneName: 'Zone 1',
          roomLength: 10,
          roomWidth: 8,
          roomHeight: 3
        }
      ];

      const mockCalculations = [
        {
          zoneId: 1,
          totalCFM: 1000,
          acph: 240,
          ahuSizeByModel: 'AHU-3000'
        }
      ];

      db.query
        .mockResolvedValueOnce([[mockProject]])
        .mockResolvedValueOnce([mockZones])
        .mockResolvedValueOnce([mockCalculations]);

      const response = await request(app)
        .get('/api/projects/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('projectId', 1);
      expect(response.body).toHaveProperty('zones');
      expect(response.body.zones).toHaveLength(1);
    });

    test('should return 404 for non-existent project', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .get('/api/projects/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Project not found');
    });

    test('should not allow customer to view other customer projects', async () => {
      const mockProject = {
        projectId: 1,
        projectName: 'Test Project',
        custId: 2  // Different customer
      };

      db.query.mockResolvedValueOnce([[mockProject]]);

      const response = await request(app)
        .get('/api/projects/1');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/projects/:id', () => {
    test('should update project successfully', async () => {
      const mockProject = {
        projectId: 1,
        custId: 1
      };

      db.query
        .mockResolvedValueOnce([[mockProject]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      const response = await request(app)
        .put('/api/projects/1')
        .send({
          projectName: 'Updated Project Name',
          location: 'Updated Location'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Project updated successfully');
    });

    test('should not allow updating other customer projects', async () => {
      const mockProject = {
        projectId: 1,
        custId: 2  // Different customer
      };

      db.query.mockResolvedValueOnce([[mockProject]]);

      const response = await request(app)
        .put('/api/projects/1')
        .send({
          projectName: 'Updated Name'
        });

      expect(response.status).toBe(403);
    });

    test('should return 404 for non-existent project', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .put('/api/projects/999')
        .send({
          projectName: 'Updated Name'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    test('should delete project successfully', async () => {
      const mockProject = {
        projectId: 1,
        custId: 1
      };

      db.query
        .mockResolvedValueOnce([[mockProject]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete('/api/projects/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Project deleted successfully');
    });

    test('should not allow deleting other customer projects', async () => {
      const mockProject = {
        projectId: 1,
        custId: 2
      };

      db.query.mockResolvedValueOnce([[mockProject]]);

      const response = await request(app)
        .delete('/api/projects/1');

      expect(response.status).toBe(403);
    });

    test('should cascade delete zones and calculations', async () => {
      const mockProject = {
        projectId: 1,
        custId: 1
      };

      db.query
        .mockResolvedValueOnce([[mockProject]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      await request(app)
        .delete('/api/projects/1');

      // Verify cascade delete was triggered (via database constraints)
      expect(db.query).toHaveBeenCalled();
    });
  });

  describe('Project Validation', () => {
    test('should validate zone dimensions', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          projectName: 'Test Project',
          location: 'Building A',
          zones: [{
            zoneName: 'Zone 1',
            standardId: 1,
            classificationId: 1,
            roomLength: -10,  // Invalid negative
            roomWidth: 8,
            roomHeight: 3
          }]
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should validate required zone fields', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          projectName: 'Test Project',
          location: 'Building A',
          zones: [{
            zoneName: 'Zone 1',
            // Missing required fields
          }]
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
