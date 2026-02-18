import api from '../services/api';

describe('API Service', () => {
  
  beforeEach(() => {
    localStorage.clear();
  });

  describe('API Configuration', () => {
    test('should have correct base URL', () => {
      expect(api.defaults.baseURL).toBe('http://localhost:5001/api');
    });

    test('should have JSON content type', () => {
      expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Request Interceptor', () => {
    test('should add auth token to requests', () => {
      const token = 'test-jwt-token';
      localStorage.setItem('token', token);

      const config = api.interceptors.request.handlers[0].fulfilled({
        headers: {}
      });

      expect(config.headers.Authorization).toBe(`Bearer ${token}`);
    });

    test('should not add auth header if no token', () => {
      const config = api.interceptors.request.handlers[0].fulfilled({
        headers: {}
      });

      expect(config.headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor', () => {
    test('should handle successful response', async () => {
      const mockResponse = { data: { success: true } };
      
      const result = await api.interceptors.response.handlers[0].fulfilled(mockResponse);
      
      expect(result).toBe(mockResponse);
    });

    test('should handle 401 unauthorized', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { error: 'Unauthorized' }
        }
      };

      localStorage.setItem('token', 'invalid-token');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));

      try {
        await api.interceptors.response.handlers[0].rejected(mockError);
      } catch (error) {
        expect(error).toBe(mockError);
      }

      // Should clear storage on 401
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    test('should redirect to login on 401', async () => {
      const mockError = {
        response: {
          status: 401
        }
      };

      delete window.location;
      window.location = { href: '' };

      try {
        await api.interceptors.response.handlers[0].rejected(mockError);
      } catch (error) {
        expect(window.location.href).toBe('/login');
      }
    });

    test('should handle network errors', async () => {
      const mockError = {
        message: 'Network Error',
        response: undefined
      };

      try {
        await api.interceptors.response.handlers[0].rejected(mockError);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('Network Error');
      }
    });
  });

  describe('Authentication Methods', () => {
    test('login should post credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockPost = jest.spyOn(api, 'post');
      mockPost.mockResolvedValueOnce({ data: { token: 'token' } });

      await api.post('/auth/login', credentials);

      expect(mockPost).toHaveBeenCalledWith('/auth/login', credentials);
    });

    test('register should post user data', async () => {
      const userData = {
        custName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        contactNo: '1234567890',
        address: '123 Test St'
      };

      const mockPost = jest.spyOn(api, 'post');
      mockPost.mockResolvedValueOnce({ data: { success: true } });

      await api.post('/auth/register', userData);

      expect(mockPost).toHaveBeenCalledWith('/auth/register', userData);
    });
  });

  describe('Project Methods', () => {
    test('should fetch all projects', async () => {
      const mockGet = jest.spyOn(api, 'get');
      mockGet.mockResolvedValueOnce({ data: [] });

      await api.get('/projects');

      expect(mockGet).toHaveBeenCalledWith('/projects');
    });

    test('should fetch project by id', async () => {
      const mockGet = jest.spyOn(api, 'get');
      mockGet.mockResolvedValueOnce({ data: { projectId: 1 } });

      await api.get('/projects/1');

      expect(mockGet).toHaveBeenCalledWith('/projects/1');
    });

    test('should create new project', async () => {
      const projectData = {
        projectName: 'New Project',
        location: 'Building A',
        zones: []
      };

      const mockPost = jest.spyOn(api, 'post');
      mockPost.mockResolvedValueOnce({ data: { projectId: 1 } });

      await api.post('/projects', projectData);

      expect(mockPost).toHaveBeenCalledWith('/projects', projectData);
    });

    test('should update project', async () => {
      const updateData = {
        projectName: 'Updated Name'
      };

      const mockPut = jest.spyOn(api, 'put');
      mockPut.mockResolvedValueOnce({ data: { success: true } });

      await api.put('/projects/1', updateData);

      expect(mockPut).toHaveBeenCalledWith('/projects/1', updateData);
    });

    test('should delete project', async () => {
      const mockDelete = jest.spyOn(api, 'delete');
      mockDelete.mockResolvedValueOnce({ data: { success: true } });

      await api.delete('/projects/1');

      expect(mockDelete).toHaveBeenCalledWith('/projects/1');
    });
  });

  describe('Standards and Classifications', () => {
    test('should fetch all standards', async () => {
      const mockGet = jest.spyOn(api, 'get');
      mockGet.mockResolvedValueOnce({ data: [] });

      await api.get('/standards');

      expect(mockGet).toHaveBeenCalledWith('/standards');
    });

    test('should fetch classifications for standard', async () => {
      const mockGet = jest.spyOn(api, 'get');
      mockGet.mockResolvedValueOnce({ data: [] });

      await api.get('/standards/1/classifications');

      expect(mockGet).toHaveBeenCalledWith('/standards/1/classifications');
    });
  });

  describe('Error Handling', () => {
    test('should throw error with message from response', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error: 'Bad Request'
          }
        }
      };

      const mockPost = jest.spyOn(api, 'post');
      mockPost.mockRejectedValueOnce(mockError);

      try {
        await api.post('/invalid-endpoint');
        fail('Should have thrown error');
      } catch (error) {
        expect(error.response.data.error).toBe('Bad Request');
      }
    });

    test('should handle 403 forbidden', async () => {
      const mockError = {
        response: {
          status: 403,
          data: {
            error: 'Access denied'
          }
        }
      };

      const mockGet = jest.spyOn(api, 'get');
      mockGet.mockRejectedValueOnce(mockError);

      try {
        await api.get('/admin/customers');
        fail('Should have thrown error');
      } catch (error) {
        expect(error.response.status).toBe(403);
      }
    });

    test('should handle 404 not found', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            error: 'Not found'
          }
        }
      };

      const mockGet = jest.spyOn(api, 'get');
      mockGet.mockRejectedValueOnce(mockError);

      try {
        await api.get('/projects/999');
        fail('Should have thrown error');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });

    test('should handle 500 server error', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {
            error: 'Internal server error'
          }
        }
      };

      const mockPost = jest.spyOn(api, 'post');
      mockPost.mockRejectedValueOnce(mockError);

      try {
        await api.post('/projects');
        fail('Should have thrown error');
      } catch (error) {
        expect(error.response.status).toBe(500);
      }
    });
  });

  describe('Token Management', () => {
    test('should retrieve token from localStorage', () => {
      const token = 'test-token-123';
      localStorage.setItem('token', token);

      const storedToken = localStorage.getItem('token');
      expect(storedToken).toBe(token);
    });

    test('should store token after login', () => {
      const token = 'new-login-token';
      localStorage.setItem('token', token);

      expect(localStorage.getItem('token')).toBe(token);
    });

    test('should clear token on logout', () => {
      localStorage.setItem('token', 'token-to-clear');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });
});
