# Setup Guide

## Prerequisites

- **Python 3.9+** (Python 3.13 recommended)
- **Node.js 18+** (for JavaScript tests and tools)
- **[UV](https://github.com/astral-sh/uv)** (Python package manager - replaces pip/venv)
- **npm** (Node.js package manager - for JavaScript dependencies)
- **make** (recommended for automation - all commands use make)

## Quick Installation

1. **Clone the repository**
```bash
git clone https://github.com/IAM-B/Mawaqit_API_to_ics
cd Mawaqit_API_to_ics
```

2. **Install dependencies and setup environment**
```bash
make install
```

3. **Run the application**
```bash
make run-dev
```

4. **Open your browser**
Navigate to [http://localhost:5000](http://localhost:5000)

## Project Structure

```
Mawaqit_API_to_ics/
├── app/                    # Application code
│   ├── __init__.py
│   ├── api/               # API endpoints
│   ├── cache/             # Cache management
│   ├── controllers/       # Route handlers
│   ├── modules/           # Core business logic
│   │   ├── mawaqit_fetcher.py
│   │   ├── prayer_generator.py
│   │   ├── slots_generator.py
│   │   └── ...
│   ├── static/            # Static assets
│   │   ├── css/          # Stylesheets
│   │   ├── js/           # JavaScript files
│   │   └── ics/          # Generated ICS files
│   ├── templates/         # HTML templates
│   ├── utils/             # Utility functions
│   └── views/             # View handlers
├── config/                # Configuration files
│   ├── __init__.py        # Base configuration
│   ├── development.py     # Development environment
│   ├── production.py      # Production environment
│   └── testing.py         # Testing environment
├── tests/                 # Test suite
│   ├── js/               # JavaScript unit tests
│   ├── e2e/              # End-to-end tests (WIP)
│   ├── python/           # Python tests (unit + integration)
│   └── data/             # Test data files
├── docs/                  # Documentation
├── data/                  # Data storage
├── logs/                  # Application logs
└── main.py                # Main Flask entrypoint (was app.py)
```

## Available Commands

### 🚀 Installation & Setup
```bash
make install        # Install dependencies with UV
```

### 🚀 Running the Application
```bash
make run-dev        # Run in development mode
make run-prod       # Run in production mode
make run-test       # Run in test mode
```

### 🧪 Testing
```bash
make test           # All tests (JS + Python)
make test-js        # JavaScript unit tests (Jest)
make test-js-integration  # JavaScript integration tests (Jest)
make test-js-all    # All JavaScript tests (Jest)
make test-e2e       # End-to-end tests (Playwright - coming soon)
make test-py        # Python tests (pytest)
make coverage       # Complete coverage (JS + Python)
```

### 🧼 Maintenance
```bash
make cleanup        # Clean environment and temporary files
make reset          # Reset project (clean + reinstall)
make clean-ics      # Clean generated ICS files
```

### 📚 Documentation
```bash
make docs-serve     # Start documentation server
```

### 🔧 Code Quality
```bash
make lint           # Lint Python code (Ruff)
make fix            # Auto-fix Python code style (Ruff)
make format         # Format code (Ruff)
```

## Flask Configuration

### Centralized Configuration
All environment variables and configuration options are centralized in the `config/` directory:

- **`config/__init__.py`**: Base configuration class with common settings
- **`config/development.py`**: Development environment settings
- **`config/production.py`**: Production environment settings  
- **`config/testing.py`**: Testing environment settings

### Key Configuration Variables
```python
# ICS Calendar Settings
ICS_CALENDAR_NAME = 'Prayer Times'
ICS_CALENDAR_DESCRIPTION = 'Prayer times from Mawaqit'

# Mawaqit API Settings
MAWAQIT_BASE_URL = 'https://mawaqit.net/fr'
MAWAQIT_REQUEST_TIMEOUT = 10
MAWAQIT_USER_AGENT = 'Mozilla/5.0...'

# Data Directories
MOSQUE_DATA_DIR = 'data/mosques_by_country'

# Logging
LOG_LEVEL = 'DEBUG'  # or 'INFO' for production
LOG_FILE = 'logs/dev.log'
```

### Application Factory
The main application factory is in `main.py`:
```python
from main import create_app

# Create app with default configuration
app = create_app('development')

# Create app with custom overrides
app = create_app('testing', {
    'TESTING': True,
    'DEBUG': True,
    'ICS_CALENDAR_NAME': 'Test Calendar'
})
```

## Testing

### Test Structure

#### Python Tests
- **Unit Tests**: Located in `tests/python/unit/`
  - Test individual components in isolation
  - Use mocks and stubs to isolate dependencies
  - Focus on edge cases and error handling

- **Integration Tests**: Located in `tests/python/integration/`
  - Test component interactions
  - Verify API endpoints
  - Test ICS file generation
  - Validate mosque search functionality

#### JavaScript Tests
- **Unit Tests**: Located in `tests/js/unit/`
  - Test individual JavaScript functions
  - Use Jest with jsdom environment
  - Focus on UI logic and utilities

- **E2E Tests**: Located in `tests/e2e/`
  - Test complete user workflows
  - Use Playwright for browser automation
  - Validate user interface functionality
  - **Status**: Coming soon

### Test Artifacts Cleanup
The following files are automatically cleaned after test execution:
- Generated `.ics` files in:
  - Root directory
  - `tests/` directory and subdirectories
  - `app/static/ics/` directory
- Python cache files (`__pycache__` directories)
- `.pyc` files
- Test logs

To manually clean test artifacts:
```bash
make clean-ics      # Clean only ICS test files
make cleanup        # Full cleanup including cache
```

### Current Coverage
- **Python**: 65% overall coverage (147 tests, 1 xfailed)
- **JavaScript**: 128 tests total (100% pass rate)

### Best Practices
1. Keep unit and integration tests separate
2. Use meaningful test names
3. Follow the Arrange-Act-Assert pattern
4. Clean up test data after each test
5. Use fixtures for common test setup
6. Test both success and error scenarios
7. Use mocks for external API calls

## Environment Configuration

### Development Environment
```bash
make run-dev
# Uses config/development.py automatically
```

### Production Environment
```bash
make run-prod
# Uses config/production.py automatically
```

### Test Environment
```bash
make run-test
# Uses config/testing.py automatically
```

## Troubleshooting

### Common Issues

#### 1. Import Errors
```bash
# Ensure UV environment is ready
uv sync

# Check PYTHONPATH includes project root
export PYTHONPATH=.

# Clear cache files
make cleanup
```

#### 2. Configuration Issues
```bash
# Verify configuration is loaded
python -c "from main import create_app; app = create_app('development'); print(app.config['ICS_CALENDAR_NAME'])"

# Check environment variables
echo $FLASK_ENV
```

#### 3. Test Failures
```bash
# Clear test cache
make cleanup

# Run tests with verbose output
make test-py -v

# Check test data
ls -la tests/data/
```

#### 4. UV Issues
```bash
# Reinstall UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# Sync dependencies
uv sync

# Check UV version
uv --version
```

## Migration Notes

### From venv/pip to UV
- **Old**: `python -m venv env-planner && source env-planner/bin/activate && pip install -r requirements.txt`
- **New**: `uv sync` (automatically handled by `make install`)

### From app.py to main.py
- **Old**: `from app import create_app`
- **New**: `from main import create_app`

### From black/isort/flake8 to Ruff
- **Old**: `black . && isort . && flake8 .`
- **New**: `make fix` (auto-fix) or `make lint` (check only)

### Configuration Changes
- All configuration is now centralized in `config/` directory
- Environment-specific settings in separate files
- `ICS_CALENDAR_NAME` and `ICS_CALENDAR_DESCRIPTION` added to all environments
