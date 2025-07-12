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

### End-to-End Tests

#### E2E Tests
- **Location**: `tests/e2e/`
- **Purpose**: Test complete user workflows
- **Tools**: Playwright
- **Coverage**: User interface and workflows
- **Status**: Coming soon (basic structure in place)

**Structure:**
```
tests/e2e/
├── landing.spec.js           # Landing page workflows
├── planner.spec.js           # Planner interface workflows
├── planner-basic.spec.js     # Basic planner tests
├── helpers.js                # Reusable test helper functions
└── error-handling.spec.js    # Error handling workflows
```

**Helper Functions (`helpers.js`):**
- `waitForCountriesToLoad()` - Wait for country dropdown to populate
- `waitForMosquesToLoad()` - Wait for mosque dropdown to populate  
- `fillGlobalPadding()` - Configure padding values
- `selectCountry()` / `selectMosque()` - Select options by index
- `waitForElementStable()` - Wait for elements to be visible and stable
- `navigateToPlanner()` / `navigateToLanding()` - Page navigation with proper waits

**Current Coverage:**
- ✅ Page loading and form element visibility
- ✅ Padding configuration (input/output validation)
- ✅ Form submission button presence and state
- ✅ Responsive design (desktop/mobile viewports)
- ✅ Basic navigation between pages

**Browser Support:**
- ✅ **Chromium** - Fully working
- ❌ **Firefox/Webkit** - Missing system dependencies

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
```bash
make test-e2e       # Run end-to-end tests (coming soon)

# Direct Playwright commands (if needed)
npm run test:e2e    # Direct Playwright command
npm run test:e2e:ui # UI mode for debugging
npm run test:e2e:headed  # Headed browser mode

# Run specific E2E tests
npx playwright test tests/e2e/planner-basic.spec.js --project=chromium
npx playwright test tests/e2e/ --project=chromium  # All E2E tests (Chromium only)
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

## Test Data Management

### Python Test Data
- **Location**: `tests/data/`
- **Structure**: Organized by test type
- **Cleanup**: Automatic cleanup after tests

### JavaScript Test Data
- **Mock data**: Defined in test files
- **Fixtures**: Reusable test data
- **Cleanup**: Automatic DOM cleanup

## Coverage Goals

### Current Coverage
- **Python**: 65% overall (147 tests, 1 xfailed)
- **JavaScript**: 128 tests (100% pass rate)
- **E2E**: Coming soon

### Coverage Targets
- **Python**: 80% minimum
- **JavaScript**: 90% minimum
- **E2E**: 100% of user workflows

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
```

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