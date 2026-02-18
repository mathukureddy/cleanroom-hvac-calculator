# Testing Guide for Cleanroom HVAC Calculator

## Quick Start

### Run Example Tests

```bash
# Backend - Run the example test
cd backend
npm install --save-dev jest supertest
npm test

# Expected output: 3 test suites, all passing
```

## Test Coverage Rule

The `test-coverage.mdc` rule provides comprehensive testing patterns for:

### Backend Testing
✅ **Controller Tests** - API endpoint testing with Supertest
✅ **Service Tests** - Business logic and calculation testing
✅ **Middleware Tests** - Authentication and authorization
✅ **Integration Tests** - Complete workflow testing

### Frontend Testing
✅ **Component Tests** - React component testing with Testing Library
✅ **Page Tests** - Full page testing with mocked APIs
✅ **Form Tests** - Input validation and submission
✅ **Navigation Tests** - Routing and user flow

## Coverage Goals

| Component Type | Minimum Coverage |
|---------------|------------------|
| Controllers   | 90%              |
| Services      | 95%              |
| Middleware    | 95%              |
| Components    | 75%              |
| Pages         | 70%              |
| **Overall**   | **80%**          |

## Test Files Created

### Backend
- `backend/jest.config.js` - Jest configuration
- `backend/tests/setup.js` - Test environment setup
- `backend/tests/example.test.js` - Example working tests

### To Add
- `backend/tests/controllers/*.test.js` - Controller tests
- `backend/tests/services/*.test.js` - Service tests
- `backend/tests/middleware/*.test.js` - Middleware tests

## Installation

### Backend Dependencies
```bash
cd backend
npm install --save-dev jest supertest
```

### Frontend Dependencies (if needed)
```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

## Running Tests

### Backend
```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm test:coverage

# Run in watch mode
npm test:watch

# Run specific test file
npm test example.test.js
```

### Frontend
```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Example Test Output

```
PASS  tests/example.test.js
  Calculation Service Example
    getAHUSizeByModel
      ✓ should return correct AHU size for small CFM (2 ms)
      ✓ should return correct AHU size for medium CFM (1 ms)
      ✓ should return "Refer" for very large CFM
    getFilterStages
      ✓ should return correct stages for ISO classifications (1 ms)
      ✓ should return correct stages for GMP classifications
      ✓ should return default for unknown classification
    getCoolingCoilRows
      ✓ should return correct rows for different classifications (1 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```

## Writing Your First Test

### 1. Create Test File
```bash
touch backend/tests/services/myService.test.js
```

### 2. Write Test
```javascript
const myService = require('../../services/myService');

describe('My Service', () => {
  it('should do something', () => {
    const result = myService.doSomething('input');
    expect(result).toBe('expected output');
  });
});
```

### 3. Run Test
```bash
npm test myService.test.js
```

## Test Patterns Reference

The `test-coverage.mdc` rule includes:

1. **Setup/Teardown** - beforeAll, afterAll, beforeEach, afterEach
2. **HTTP Testing** - Using Supertest for API endpoints
3. **Mocking** - jest.mock() for dependencies
4. **Assertions** - expect() with various matchers
5. **Async Testing** - async/await patterns
6. **Database Testing** - Transaction isolation
7. **Authentication Testing** - Token-based auth
8. **Component Testing** - React Testing Library
9. **Integration Testing** - Full workflow tests

## Best Practices

✅ **DO:**
- Test behavior, not implementation
- Use descriptive test names
- Keep tests independent
- Mock external dependencies
- Clean up after tests
- Test edge cases
- Follow Arrange-Act-Assert pattern

❌ **DON'T:**
- Test private methods directly
- Depend on test execution order
- Use real database in tests
- Test UI styling details
- Duplicate tests
- Skip error case testing

## Coverage Reports

### Generate Reports
```bash
# Backend
cd backend && npm test:coverage

# Frontend
cd frontend && npm test -- --coverage
```

### View HTML Reports
- Backend: Open `backend/coverage/lcov-report/index.html`
- Frontend: Open `frontend/coverage/lcov-report/index.html`

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: cleanroom_test
        ports:
          - 3306:3306
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Backend Tests
        run: |
          cd backend
          npm install
          npm test -- --coverage
      
      - name: Frontend Tests
        run: |
          cd frontend
          npm install
          npm test -- --coverage
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v2
```

## Next Steps

1. **Install Testing Dependencies**
   ```bash
   cd backend && npm install --save-dev jest supertest
   ```

2. **Run Example Tests**
   ```bash
   npm test
   ```

3. **Write Your First Test**
   - Pick a service function
   - Create test file
   - Write tests following patterns
   - Run and verify

4. **Expand Coverage**
   - Add controller tests
   - Add middleware tests
   - Add component tests
   - Aim for 80% overall coverage

5. **Set Up CI/CD**
   - Add GitHub Actions workflow
   - Configure coverage reporting
   - Make tests required for PRs

## Resources

- **Jest Documentation:** https://jestjs.io/
- **Supertest:** https://github.com/visionmedia/supertest
- **React Testing Library:** https://testing-library.com/react
- **Coverage Reports:** https://istanbul.js.org/

## Need Help?

1. Check `test-coverage.mdc` rule for patterns
2. Look at `backend/tests/example.test.js`
3. Ask Cursor AI: "How do I test [specific functionality]?"
4. The test-coverage rule will automatically provide guidance

Happy Testing! 🧪✅
