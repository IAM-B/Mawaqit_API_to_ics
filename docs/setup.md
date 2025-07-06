# Setup Guide

## Prerequisites

- **Python 3.8+** (Python 3.13 recommended)
- **Node.js 18+** (for JavaScript tests and tools)
- **pip** (Python package manager)
- **npm** (Node.js package manager)
- **make** (optional, but recommended for automation)

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
│   ├── __init__.py
│   ├── development.py
│   ├── production.py
│   └── testing.py
├── tests/                 # Test suite
│   ├── js/               # JavaScript unit tests
│   ├── e2e/              # End-to-end tests
│   ├── unit/             # Python unit tests
│   └── integration/      # Python integration tests
├── docs/                  # Documentation
├── data/                  # Data storage
└── logs/                  # Application logs
```

## Available Commands

### 🚀 Installation & Setup
```bash
make install        # Create environment and install dependencies
# make init-direnv    # Removed - using UV now
```

### 🚀 Running the Application
```bash
make run-dev        # Run in development mode
make run-prod       # Run in production mode
make run-test       # Run in test mode
```

### 🧪 Testing
```bash
make test           # All tests (JS + E2E + Python)
make test-js        # JavaScript unit tests (Jest)
make test-e2e       # End-to-end tests (Playwright)
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

### 🔧 Configuration
```bash
make config-dev     # Configure development environment
make config-prod    # Configure production environment
make config-test    # Configure test environment
```

## Testing

### Test Structure

#### Python Tests
- **Unit Tests**: Located in `tests/unit/`
  - Test individual components in isolation
  - Use mocks and stubs to isolate dependencies
  - Focus on edge cases and error handling

- **Integration Tests**: Located in `tests/integration/`
  - Test component interactions
  - Verify API endpoints
  - Test ICS file generation
  - Validate mosque search functionality

#### JavaScript Tests
- **Unit Tests**: Located in `tests/js/`
  - Test individual JavaScript functions
  - Use Jest with jsdom environment
  - Focus on UI logic and utilities

- **E2E Tests**: Located in `tests/e2e/`
  - Test complete user workflows
  - Use Playwright for browser automation
  - Validate user interface functionality

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
- **Python**: 65% overall coverage (140 tests, 1 xfailed)
- **JavaScript**: 94% for landing.js, 1.73% for planner.js (36 tests)

### Best Practices
1. Keep unit and integration tests separate
2. Use meaningful test names
3. Follow the Arrange-Act-Assert pattern
4. Clean up test data after each test
5. Use fixtures for common test setup
6. Test both success and error scenarios

## Environment Configuration

### Development Environment
```bash
make config-dev
FLASK_ENV=development make run-dev
```

### Production Environment
```bash
make config-prod
FLASK_ENV=production make run-prod
```

### Test Environment
```bash
make config-test
FLASK_ENV=testing make run-test
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

#### 2. Test Failures
```bash
# Clear cache and test files
make cleanup

# Check test database configuration
# Verify all dependencies are installed
npm install  # For JavaScript dependencies
```

#### 3. Environment Issues
```bash
# Ensure correct Python version
python --version  # Should be 3.8+

# Check all required packages are installed
pip list

# Verify environment variables are set correctly
echo $FLASK_ENV
```

#### 4. JavaScript Issues
```bash
# Install Node.js dependencies
npm install

# Run JavaScript tests
npm run test:js

# Check for linting issues
npm run lint  # If configured
```

#### 5. Test Artifacts
```bash
# If test files (.ics) remain after tests
make clean-ics

# If Python cache issues persist
make cleanup
```

### Performance Optimization

#### For Development
     ```bash
# Use development mode for faster reloads
make run-dev

# Enable debug mode for detailed error messages
export FLASK_DEBUG=1
```

#### For Production
     ```bash
# Use production mode for better performance
make run-prod

# Set appropriate environment variables
export FLASK_ENV=production
```

## Next Steps

After successful installation:

1. **Explore the interface** at [http://localhost:5000](http://localhost:5000)
2. **Run all tests** to ensure everything works: `make test`
3. **Check coverage** to understand test quality: `make coverage`
4. **Read the documentation** in the `docs/` folder
5. **Start developing** by modifying the code in `app/` directory

## Support

For additional help:
- Check the [API Documentation](api.md)
- Review the [Testing Guide](testing.md)
- Examine the [Timeline Documentation](timeline.md)
- Open an issue on GitHub for bugs or feature requests
