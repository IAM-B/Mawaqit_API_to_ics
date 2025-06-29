# Testing Documentation

## Overview

The Mawaqit_API_to_ics project implements a comprehensive testing strategy covering Python backend, JavaScript frontend, and end-to-end user workflows. The testing suite ensures code quality, functionality, and user experience.

## Test Structure

### Python Tests

#### Unit Tests
- **Location**: `tests/unit/`
- **Purpose**: Test individual components in isolation
- **Tools**: pytest, pytest-cov
- **Coverage**: 65% overall

**Structure:**
```
tests/unit/
├── modules/          # Business logic tests
│   ├── test_mawaqit_fetcher.py
│   ├── test_prayer_generator.py
│   ├── test_slots_generator.py
│   └── ...
└── utils/            # Utility function tests
    └── test_slot_utils.py
```

#### Integration Tests
- **Location**: `tests/integration/`
- **Purpose**: Test component interactions and workflows
- **Tools**: pytest, Flask test client

**Structure:**
```
tests/integration/
├── api/              # API endpoint tests
│   ├── test_api_endpoints.py
│   └── test_basic_endpoints.py
├── controllers/      # Controller tests
│   └── test_main_controller.py
└── modules/          # Module integration tests
    ├── test_mawaqit_fetcher.py
    ├── test_planner_view.py
    └── ...
```

### JavaScript Tests

#### Unit Tests
- **Location**: `tests/js/`
- **Purpose**: Test individual JavaScript functions and components
- **Tools**: Jest, jsdom, @testing-library/jest-dom
- **Coverage**: 94% for landing.js, 1.73% for planner.js

**Structure:**
```
tests/js/
├── landing.test.js   # Landing page tests
└── planner.test.js   # Planner interface tests
```

#### Test Categories
- **Utility Functions**: Time formatting, padding calculations
- **DOM Manipulation**: Element creation, event handling
- **User Interactions**: Button clicks, form submissions
- **Error Handling**: Invalid inputs, edge cases

### End-to-End Tests

#### E2E Tests
- **Location**: `tests/e2e/`
- **Purpose**: Test complete user workflows
- **Tools**: Playwright
- **Coverage**: User interface and workflows

**Structure:**
```
tests/e2e/
├── landing.spec.js   # Landing page workflows
└── planner.spec.js   # Planner interface workflows
```

## Running Tests

### All Tests
```bash
make test           # Run all tests (JS + E2E + Python)
```

### Python Tests
```bash
make test-py        # Run Python tests with pytest
pytest              # Direct pytest command
pytest -v           # Verbose output
pytest -k "test_name"  # Run specific test
```

### JavaScript Tests
```bash
make test-js        # Run JavaScript unit tests
npm run test:js     # Direct Jest command
npm run test:js:watch  # Watch mode
```

### E2E Tests
```bash
make test-e2e       # Run end-to-end tests
npm run test:e2e    # Direct Playwright command
npm run test:e2e:ui # UI mode for debugging
npm run test:e2e:headed  # Headed browser mode
```

### Coverage Reports
```bash
make coverage       # Generate coverage for all tests
make coverage-py    # Python coverage only
make coverage-js    # JavaScript coverage only
```

## Test Configuration

### Python Configuration
```python
# pytest.ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --strict-markers
    --disable-warnings
    --tb=short
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow running tests
```

### JavaScript Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/js/setup.js'],
  testMatch: ['<rootDir>/tests/js/**/*.test.js'],
  collectCoverageFrom: [
    'app/static/js/**/*.js',
    '!app/static/js/**/*.min.js'
  ],
  coverageDirectory: 'htmlcov/js'
};
```

### Playwright Configuration
```javascript
// playwright.config.js
module.exports = {
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }]
  ]
};
```

## Test Data Management

### Python Test Data
```python
# conftest.py
import pytest
from app import create_app

@pytest.fixture
def app():
    app = create_app('testing')
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def sample_prayer_times():
    return {
        "fajr": "05:30",
        "dohr": "13:00",
        "asr": "16:30",
        "maghreb": "19:00",
        "icha": "20:30"
    }
```

### JavaScript Test Data
```javascript
// tests/js/setup.js
import '@testing-library/jest-dom';

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:5000',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true
});

// Global test utilities
global.testUtils = {
  createMockEvent: (type = 'click') => ({
    type,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn()
  })
};
```

## Best Practices

### Python Testing
1. **Use fixtures** for common test setup
2. **Mock external dependencies** (API calls, file system)
3. **Test edge cases** and error conditions
4. **Use descriptive test names**
5. **Follow AAA pattern** (Arrange, Act, Assert)
6. **Clean up test data** after each test

### JavaScript Testing
1. **Test user interactions** not implementation details
2. **Use semantic queries** (@testing-library/jest-dom)
3. **Mock browser APIs** (localStorage, fetch)
4. **Test accessibility** features
5. **Use data-testid** for complex selectors
6. **Test error states** and loading states

### E2E Testing
1. **Test user workflows** not individual components
2. **Use realistic test data**
3. **Test across different browsers**
4. **Handle async operations** properly
5. **Use page object pattern** for complex pages
6. **Test responsive design** on different screen sizes

## Coverage Goals

### Current Coverage
- **Python**: 65% (140 tests, 1 xfailed)
- **JavaScript**: 94% landing.js, 1.73% planner.js (36 tests)
- **E2E**: Complete user workflow coverage

### Coverage Targets
- **Python**: 80% minimum, 90% target
- **JavaScript**: 90% minimum, 95% target
- **E2E**: 100% of critical user paths

### Areas Needing Coverage
- **Python**: Complex business logic, error handling
- **JavaScript**: Planner interface interactions, state management
- **E2E**: Mobile responsiveness, accessibility

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.13'
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          make install
          npm install
      - name: Run tests
        run: make test
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Debugging Tests

### Python Debugging
```bash
# Run with debugger
pytest --pdb

# Run specific test with debugger
pytest test_file.py::test_function --pdb

# Verbose output
pytest -v -s

# Show local variables on failure
pytest --tb=long
```

### JavaScript Debugging
```bash
# Run in debug mode
npm run test:js -- --debug

# Run specific test
npm run test:js -- --testNamePattern="test name"

# Watch mode with coverage
npm run test:js:watch -- --coverage
```

### E2E Debugging
```bash
# Run with UI
npm run test:e2e:ui

# Run in headed mode
npm run test:e2e:headed

# Debug specific test
npm run test:e2e -- --grep "test name"
```

## Performance Testing

### Load Testing
```bash
# Install locust
pip install locust

# Run load test
locust -f tests/load/locustfile.py --host=http://localhost:5000
```

### Memory Testing
```bash
# Run with memory profiler
python -m memory_profiler app.py

# Check for memory leaks
pytest --memray
```

## Security Testing

### Static Analysis
```bash
# Python security
bandit -r app/

# JavaScript security
npm audit

# Dependency scanning
safety check
```

### Dynamic Testing
```bash
# Run security tests
pytest tests/security/

# API security testing
pytest tests/integration/test_security.py
```

## Support

For testing support:
- Check the test logs in `logs/` directory
- Review coverage reports in `htmlcov/`
- Examine test artifacts in `test-results/`
- Consult the [Setup Guide](setup.md) for environment issues