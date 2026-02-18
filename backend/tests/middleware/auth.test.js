const authMiddleware = require('../../middleware/auth');
const jwt = require('jsonwebtoken');

// Mock Express request and response objects
const mockRequest = (headers = {}) => ({
  headers
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Auth Middleware', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key';
  });

  describe('verifyToken', () => {
    test('should authenticate valid token', () => {
      const token = jwt.sign(
        { loginId: 1, role: 'Customer', custId: 1 },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const req = mockRequest({ authorization: `Bearer ${token}` });
      const res = mockResponse();

      authMiddleware.verifyToken(req, res, mockNext);

      expect(req.user).toBeDefined();
      expect(req.user.loginId).toBe(1);
      expect(req.user.role).toBe('Customer');
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject missing token', () => {
      const req = mockRequest({});
      const res = mockResponse();

      authMiddleware.verifyToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No token provided'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject invalid token format', () => {
      const req = mockRequest({ authorization: 'InvalidFormat token123' });
      const res = mockResponse();

      authMiddleware.verifyToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject expired token', () => {
      const token = jwt.sign(
        { loginId: 1, role: 'Customer' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }  // Already expired
      );

      const req = mockRequest({ authorization: `Bearer ${token}` });
      const res = mockResponse();

      authMiddleware.verifyToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token expired'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject token with invalid signature', () => {
      const token = jwt.sign(
        { loginId: 1, role: 'Customer' },
        'wrong-secret-key',
        { expiresIn: '24h' }
      );

      const req = mockRequest({ authorization: `Bearer ${token}` });
      const res = mockResponse();

      authMiddleware.verifyToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle malformed token', () => {
      const req = mockRequest({ authorization: 'Bearer malformed.token.here' });
      const res = mockResponse();

      authMiddleware.verifyToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    test('should allow admin access to admin-only routes', () => {
      const req = mockRequest({});
      req.user = { loginId: 1, role: 'Admin' };
      const res = mockResponse();

      const middleware = authMiddleware.requireRole(['Admin']);
      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should deny customer access to admin-only routes', () => {
      const req = mockRequest({});
      req.user = { loginId: 1, role: 'Customer' };
      const res = mockResponse();

      const middleware = authMiddleware.requireRole(['Admin']);
      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Insufficient permissions.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should allow multiple roles', () => {
      const req = mockRequest({});
      req.user = { loginId: 1, role: 'Customer' };
      const res = mockResponse();

      const middleware = authMiddleware.requireRole(['Admin', 'Customer']);
      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should handle missing user object', () => {
      const req = mockRequest({});
      // No req.user set
      const res = mockResponse();

      const middleware = authMiddleware.requireRole(['Admin']);
      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should be case-sensitive for roles', () => {
      const req = mockRequest({});
      req.user = { loginId: 1, role: 'customer' };  // lowercase
      const res = mockResponse();

      const middleware = authMiddleware.requireRole(['Customer']);  // uppercase
      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Token Payload', () => {
    test('should include all required user data in token payload', () => {
      const userData = {
        loginId: 1,
        role: 'Customer',
        custId: 5,
        email: 'test@example.com'
      };

      const token = jwt.sign(userData, process.env.JWT_SECRET, {
        expiresIn: '24h'
      });

      const req = mockRequest({ authorization: `Bearer ${token}` });
      const res = mockResponse();

      authMiddleware.verifyToken(req, res, mockNext);

      expect(req.user).toMatchObject({
        loginId: 1,
        role: 'Customer',
        custId: 5,
        email: 'test@example.com'
      });
    });

    test('should not expose sensitive data in token', () => {
      const userData = {
        loginId: 1,
        role: 'Customer',
        password: 'should-not-be-here'  // Should never include password
      };

      const token = jwt.sign(userData, process.env.JWT_SECRET);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // In real implementation, password should never be in payload
      expect(decoded.password).toBeUndefined();
    });
  });

  describe('Token Expiration', () => {
    test('should have reasonable expiration time', () => {
      const token = jwt.sign(
        { loginId: 1, role: 'Customer' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const decoded = jwt.decode(token);
      const expiresIn = decoded.exp - decoded.iat;

      // Should be 24 hours (86400 seconds)
      expect(expiresIn).toBe(86400);
    });

    test('should reject token after expiration', (done) => {
      const token = jwt.sign(
        { loginId: 1, role: 'Customer' },
        process.env.JWT_SECRET,
        { expiresIn: '1s' }  // Expires in 1 second
      );

      setTimeout(() => {
        const req = mockRequest({ authorization: `Bearer ${token}` });
        const res = mockResponse();

        authMiddleware.verifyToken(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
        done();
      }, 1100);  // Wait for token to expire
    });
  });

  describe('Security Tests', () => {
    test('should not accept token without Bearer prefix', () => {
      const token = jwt.sign(
        { loginId: 1, role: 'Customer' },
        process.env.JWT_SECRET
      );

      const req = mockRequest({ authorization: token });  // Missing "Bearer "
      const res = mockResponse();

      authMiddleware.verifyToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle empty authorization header', () => {
      const req = mockRequest({ authorization: '' });
      const res = mockResponse();

      authMiddleware.verifyToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle authorization header with only Bearer', () => {
      const req = mockRequest({ authorization: 'Bearer ' });
      const res = mockResponse();

      authMiddleware.verifyToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
