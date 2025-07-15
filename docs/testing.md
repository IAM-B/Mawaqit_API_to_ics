# Testing Documentation

## Overview

The Mawaqit_API_to_ics project implements a comprehensive testing strategy covering Python backend, JavaScript frontend, and end-to-end user workflows. The testing suite ensures code quality, functionality, and user experience.

## Test Structure

### Python Tests (`tests/python/`)

#### Unit Tests
- **Location**: `tests/python/unit/`
- **Purpose**: Test individual components in isolation
- **Tools**: pytest, pytest-cov
- **Coverage**: 65% overall

**Structure:**
```
tests/python/unit/
├── modules/          # Business logic tests
│   ├── test_mawaqit_fetcher.py
│   ├── test_prayer_generator.py
│   ├── test_slots_generator.py
│   └── ...
└── utils/            # Utility function tests
    └── test_slot_utils.py
```

#### Integration Tests
- **Location**: `tests/python/integration/`
- **Purpose**: Test component interactions and workflows
- **Tools**: pytest, Flask test client

**Structure:**
```
tests/python/integration/
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

### JavaScript Tests (`tests/js/`)

#### Unit Tests
- **Location**: `tests/js/unit/`
- **Purpose**: Test individual JavaScript functions and components
- **Tools**: Jest, jsdom, @testing-library/jest-dom
- **Coverage**: 128 tests total (100% pass rate)

**Structure:**
```
tests/js/unit/
├── test_timeline.js              # Timeline class tests
├── test_clock.js                 # Clock class tests
├── test_planner_page.js          # PlannerPage class tests
├── test_calendar_views_manager.js # CalendarViewsManager tests
├── test_planner_utils.js         # Utility functions tests
├── test_landing.js               # Landing page tests
└── setup.js                      # Test configuration
```

#### Integration Tests
- **Location**: `tests/js/integration/`
- **Purpose**: Test component interactions and workflows
- **Tools**: Jest, jsdom

**Structure:**
```
tests/js/integration/
└── test_planner_integration.js   # Planner component integration tests
```

#### Test Categories
- **Component Classes**: Timeline, Clock, PlannerPage, CalendarViewsManager
- **Utility Functions**: Time formatting, padding calculations, date management
- **DOM Manipulation**: Element creation, event handling, view management
- **User Interactions**: Button clicks, form submissions, navigation
- **Error Handling**: Invalid inputs, edge cases, error states
- **State Management**: Component state, data flow, synchronization

### End-to-End Tests (`tests/e2e/`)

#### E2E Test Strategy
- **Location**: `tests/e2e/`
- **Purpose**: Test complete user workflows and critical features
- **Tools**: Playwright
- **Strategy**: Hierarchical approach focusing on core features

#### Test Structure
```
tests/e2e/
├── core-features.spec.js         # Critical user journeys
├── advanced-features.spec.js     # Important but non-critical features
├── quick-test.spec.js            # Ultra-fast validation
├── helpers.js                    # Reusable test helper functions
├── landing.spec.js               # Landing page workflows
├── planner-basic.spec.js         # Basic planner tests
├── error-handling.spec.js        # Error handling workflows
└── slot-editor.spec.js           # Slot editor functionality
```

#### Test Hierarchy

**🔥 Level 1 - Core Features (Critical)**
- **User Journey**: Country selection → Mosque selection → Configuration → ICS generation
- **Critical Functions**: Mosque search, padding configuration, ICS file generation
- **Error Handling**: Invalid selections, network errors
- **Files**: `core-features.spec.js`, `quick-test.spec.js`

**⚡ Level 2 - Advanced Features (Important)**
- **Features**: Slot segmentation mode, circular clock, responsive design
- **Performance**: Loading times, user feedback
- **Navigation**: Page transitions, form interactions
- **Files**: `advanced-features.spec.js`

**🎨 Level 3 - Nice-to-Have (Optional)**
- **Accessibility**: ARIA labels, keyboard navigation
- **Multi-browser**: Firefox, WebKit support
- **Performance**: Advanced performance testing
- **Security**: Input validation testing

#### Helper Functions (`helpers.js`)
```javascript
// Navigation helpers
navigateToPlanner(page)           // Navigate to planner with proper waits
navigateToLanding(page)           // Navigate to landing page

// Data loading helpers
waitForCountriesToLoad(page)      // Wait for countries dropdown (20s timeout)
waitForMosquesToLoad(page)        // Wait for mosques dropdown (20s timeout)

// Selection helpers
selectCountry(page, index)        // Select country by index
selectMosque(page, index)         // Select mosque by index
fillGlobalPadding(page, before, after)  // Configure padding values

// Utility helpers
waitForElementStable(page, selector)     // Wait for element to be stable
waitForFormSubmission(page)              // Handle form submission
verifyICSFiles(page)                     // Check ICS file generation
completeBasicSetup(page)                 // Complete basic test setup
```

#### Current Coverage
- ✅ **Page Loading**: Form elements visibility, responsive design
- ✅ **User Interactions**: Country/mosque selection, padding configuration
- ✅ **Form Submission**: Button states, validation
- ✅ **ICS Generation**: File creation and download verification
- ✅ **Error Handling**: Invalid inputs, network issues
- ✅ **Navigation**: Landing page to planner transitions

#### Browser Support
- ✅ **Chromium**: Fully working (primary target)
- ❌ **Firefox/WebKit**: Missing system dependencies

## Running Tests

### All Tests
```bash
make test           # Run all tests (JS + Python)
```

### Python Tests
```bash
make test-py        # Run Python tests with pytest
pytest tests/python/              # Direct pytest command
pytest tests/python/ -v           # Verbose output
pytest tests/python/ -k "test_name"  # Run specific test
```

### JavaScript Tests
```bash
make test-js-all    # Run all JavaScript tests
make test-js        # Run JavaScript unit tests only
make test-js-integration  # Run JavaScript integration tests only

# Direct Jest commands (if needed)
npm run test:js:unit     # Direct Jest command for unit tests
npm run test:js:integration  # Direct Jest command for integration tests
npm run test:js          # Direct Jest command for all JS tests
```

### E2E Tests

#### Quick Commands
```bash
# Ultra-fast validation (30 seconds)
npm run test:e2e:quick

# Core features only (2-3 minutes)
npm run test:e2e:core

# Advanced features (3-4 minutes)
npm run test:e2e:advanced

# All E2E tests (5-8 minutes)
npm run test:e2e
```

#### Debug Commands
```bash
# Interface graphique pour debug
npm run test:e2e:ui

# Navigateur visible
npm run test:e2e:headed

# Mode debug pas à pas
npm run test:e2e:debug

# Voir le rapport
npm run test:e2e:report
```

#### Direct Playwright Commands
```bash
# Tests spécifiques
npx playwright test tests/e2e/core-features.spec.js --project=chromium
npx playwright test tests/e2e/ --project=chromium  # All E2E tests (Chromium only)

# Tests avec options
npx playwright test --timeout=30000 --workers=1 --retries=1
```

### Coverage Reports
```bash
make coverage       # Generate coverage for all tests
make coverage-py    # Python coverage only
make coverage-js    # JavaScript coverage only
```

## E2E Testing Strategy

### Performance Targets
- **Quick Tests**: < 30 seconds
- **Core Tests**: < 3 minutes
- **Complete Tests**: < 8 minutes

### Success Rates
- **Core Features**: 100% (critical)
- **Advanced Features**: 95% (acceptable)
- **Nice-to-Have**: 90% (tolerant)

### Configuration Optimizations

#### Fast Configuration (Development)
```javascript
// playwright.config.js
module.exports = {
  timeout: 10000,        // Reduced timeout
  workers: 1,            // Single worker
  retries: 1,            // Single retry
  use: {
    browserName: 'chromium',  // Chromium only
  }
};
```

#### Complete Configuration (CI/CD)
```javascript
// playwright.config.js
module.exports = {
  timeout: 30000,        // Standard timeout
  workers: 2,            // Two workers
  retries: 2,            // Two retries
  use: {
    browserName: 'chromium',
  }
};
```

### Best Practices

#### Test Structure
```javascript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup rapide
    await navigateToPlanner(page);
  });

  test('should complete user journey', async ({ page }) => {
    // Use helpers for common operations
    await completeBasicSetup(page);
    await waitForFormSubmission(page);
    await verifyICSFiles(page);
  });
});
```

#### Smart Waiting
```javascript
// ✅ Good - Wait for specific state
await page.waitForSelector('#element:not([disabled])');

// ❌ Avoid - Wait for fixed time
await page.waitForTimeout(2000);
```

#### Robust Selectors
```javascript
// ✅ Good - Specific selector
await page.locator('#country-select option[value="FR"]');

// ❌ Avoid - Generic selector
await page.locator('option').nth(1);
```

### Troubleshooting

#### Common Issues
1. **Slow Tests**
   - Check timeouts in `playwright.config.js`
   - Use `test:e2e:fast` for quick tests
   - Avoid `networkidle` waits

2. **Unstable Tests**
   - Use more specific selectors
   - Wait for element states
   - Avoid time-based waits

3. **Failed Tests**
   - Use `test:e2e:headed` to see browser
   - Use `test:e2e:debug` for step-by-step debug
   - Check server logs

#### Debug Commands
```bash
# See browser during tests
npm run test:e2e:headed

# Step-by-step debug
npm run test:e2e:debug

# UI interface
npm run test:e2e:ui

# View report
npm run test:e2e:report
```

### Workflow Recommendations

#### Daily Development
```bash
# Quick validation before commit
npm run test:e2e:quick

# Core tests before merge
npm run test:e2e:core
```

#### CI/CD Pipeline
```bash
# Fast pipeline (2-3 minutes)
npm run test:e2e:core

# Complete pipeline (5-8 minutes)
npm run test:e2e
```

#### Manual Testing
```bash
# UI interface for debugging
npm run test:e2e:ui

# Specific tests
npm run test:e2e -- --grep "should complete full user journey"
```

## Test Configuration

### Python Configuration
```python
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests/python"]
python_files = ["test_*.py"]
addopts = "--cov=app --cov-report=term-missing --cov-report=html:htmlcov/python"
```

### JavaScript Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/js/unit/setup.js'],
  testMatch: [
    '<rootDir>/tests/js/unit/test_*.js',
    '<rootDir>/tests/js/integration/test_*.js',
    '<rootDir>/tests/e2e/*.spec.js'
  ],
  collectCoverageFrom: [
    'app/static/js/pages/landing.js',
    'app/static/js/main.js',
    'app/static/js/components/*.js',
    'app/static/js/utils/*.js',
    '!app/static/js/**/*.min.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'htmlcov/js'
}
```

## Code Quality

### Python Linting with Ruff
```bash
make lint           # Check code style
make fix            # Auto-fix code style issues
make format         # Format code
```

**Ruff Configuration (`pyproject.toml`):**
```toml
[tool.ruff]
target-version = "py39"
line-length = 88
select = [
    "E",  # pycodestyle errors
    "W",  # pycodestyle warnings
    "F",  # pyflakes
    "I",  # isort
    "B",  # flake8-bugbear
    "C4", # flake8-comprehensions
    "UP", # pyupgrade
]
ignore = [
    "E501",  # line too long, handled by black
    "B008",  # do not perform function calls in argument defaults
    "C901",  # too complex
]
```

### JavaScript Linting with ESLint
```bash
npm run lint        # Check JavaScript code style
npm run lint:fix    # Auto-fix JavaScript code style issues
```

**ESLint Configuration:**
- Includes E2E tests in linting scope
- Standard configuration with custom rules
- Automatic fixing for common issues

### Test Import Structure
All Python tests now use the correct import structure:
```python
# Correct import for tests
from main import create_app

# Example test fixture
@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    test_config = {
        "TESTING": True,
        "DEBUG": True,
        "ICS_CALENDAR_NAME": "Test Calendar",
        "ICS_CALENDAR_DESCRIPTION": "Test Description",
    }
    app = create_app("testing", test_config)
    return app
```

## Test Best Practices

### Python Testing
1. **Use the application factory pattern**:
   ```python
   from main import create_app
   app = create_app("testing", config_overrides)
   ```

2. **Mock external dependencies**:
   ```python
   with patch("app.modules.mawaqit_fetcher.fetch_mawaqit_data") as mock_fetch:
       mock_fetch.return_value = {"times": ["05:00", "13:00"]}
       # Test your code
   ```

3. **Use fixtures for common setup**:
   ```python
   @pytest.fixture
   def mock_mosque_data():
       return {"name": "Test Mosque", "address": "Test Address"}
   ```

4. **Test both success and error scenarios**:
   ```python
   def test_success_case(app):
       # Test normal operation
       pass
   
   def test_error_case(app):
       # Test error handling
       with pytest.raises(ValueError):
           # Code that should raise an error
           pass
   ```

### JavaScript Testing
1. **Use Jest with jsdom environment**:
   ```javascript
   // tests/js/unit/setup.js
   import '@testing-library/jest-dom';
   ```

2. **Test component initialization**:
   ```javascript
   test('should initialize with correct properties', () => {
     const timeline = new Timeline(container, data);
     expect(timeline.container).toBe(container);
     expect(timeline.data).toBe(data);
   });
   ```

3. **Test user interactions**:
   ```javascript
   test('should handle button click', () => {
     const button = screen.getByRole('button');
     fireEvent.click(button);
     expect(mockCallback).toHaveBeenCalled();
   });
   ```

4. **Test error handling**:
   ```javascript
   test('should handle missing DOM elements', () => {
     const container = document.createElement('div');
     expect(() => new Timeline(container, data)).not.toThrow();
   });
   ```

### E2E Testing
1. **Use helper functions for consistency**:
   ```javascript
   const { navigateToPlanner, completeBasicSetup } = require('./helpers');
   
   test('should complete user journey', async ({ page }) => {
     await navigateToPlanner(page);
     await completeBasicSetup(page);
     // Test specific functionality
   });
   ```

2. **Use realistic timeouts**:
   ```javascript
   // Wait for data loading (20s for slow operations)
   await waitForCountriesToLoad(page);
   
   // Wait for UI elements (10s for quick operations)
   await expect(page.locator('#element')).toBeVisible({ timeout: 10000 });
   ```

3. **Test error scenarios**:
   ```javascript
   test('should handle network errors', async ({ page }) => {
     // Simulate network issue
     await page.route('**/api/**', route => route.abort());
     
     // Verify graceful handling
     await expect(page.locator('.error')).toBeVisible();
   });
   ```

4. **Use specific selectors**:
   ```javascript
   // ✅ Good - Specific and reliable
   await page.locator('#country-select option[value="FR"]');
   
   // ❌ Avoid - Generic and fragile
   await page.locator('option').nth(1);
   ```

## Test Data Management

### Python Test Data
- **Location**: `tests/data/`
- **Structure**: Organized by test type
- **Cleanup**: Automatic cleanup after tests

### JavaScript Test Data
- **Mock data**: Defined in test files
- **Fixtures**: Reusable test data
- **Cleanup**: Automatic DOM cleanup

### E2E Test Data
- **Helper functions**: Centralized in `helpers.js`
- **Test setup**: Reusable setup functions
- **Data validation**: Built-in validation in helpers

## Coverage Goals

### Current Coverage
- **Python**: 65% overall (147 tests, 1 xfailed)
- **JavaScript**: 128 tests (100% pass rate)
- **E2E**: Core features covered, advanced features in progress

### Coverage Targets
- **Python**: 80% minimum
- **JavaScript**: 90% minimum
- **E2E**: 100% of critical user workflows

## Troubleshooting

### Common Test Issues

#### Python Tests
```bash
# Import errors
export PYTHONPATH=.
python -c "from main import create_app"

# Configuration issues
python -c "from main import create_app; app = create_app('testing'); print(app.config)"

# Cache issues
make cleanup
pytest tests/python/ --cache-clear
```

#### JavaScript Tests
```bash
# Node modules issues
npm install

# Jest configuration (direct commands)
npm run test:js -- --verbose

# Coverage issues
npm run test:js -- --coverage --watchAll=false

# Or use make commands
make test-js-all
make coverage-js
```

#### E2E Tests
```bash
# Playwright installation
npx playwright install

# Browser dependencies
npx playwright install-deps

# Debug mode
npm run test:e2e:headed

# Check configuration
npx playwright test --list
```

### Performance Issues

#### Slow E2E Tests
1. **Check timeouts**: Review `playwright.config.js`
2. **Use fast commands**: `npm run test:e2e:quick`
3. **Avoid networkidle**: Use `domcontentloaded` instead
4. **Optimize selectors**: Use specific IDs over generic tags

#### Unstable Tests
1. **Use stable selectors**: Prefer IDs and specific attributes
2. **Wait for states**: Use `:not([disabled])` selectors
3. **Avoid time-based waits**: Use element state waits instead
4. **Check server logs**: Verify backend is responding

## Migration Notes

### From app.py to main.py
- **Old**: `from app import create_app`
- **New**: `from main import create_app`

### From venv to UV
- **Old**: `source env-planner/bin/activate && pip install -r requirements.txt`
- **New**: `uv sync` (handled by `make install`)

### From black/isort/flake8 to Ruff
- **Old**: `black . && isort . && flake8 .`
- **New**: `make fix` (auto-fix) or `make lint` (check only)

### E2E Test Evolution
- **Old**: Basic structure with manual timeouts
- **New**: Hierarchical strategy with optimized helpers and realistic timeouts