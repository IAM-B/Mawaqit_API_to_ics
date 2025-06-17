# Setup Guide

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- make (optional, but recommended)

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/IAM-B/Mawaqit_API_to_ics
cd Mawaqit_API_to_ics
```

2. **Create and activate virtual environment**
```bash
make install
```

## Project Structure

```
Mawaqit_API_to_ics/
├── app/                    # Application code
│   ├── __init__.py
│   ├── models/            # Data models
│   ├── views/             # View templates
│   ├── controllers/       # Route handlers
│   ├── utils/             # Utility functions
│   ├── modules/           # Core functionality
│   ├── static/            # Static assets
│   └── templates/         # HTML templates
├── config/                # Configuration files
│   ├── __init__.py
│   ├── development.py
│   ├── production.py
│   └── testing.py
├── tests/                 # Test suite
│   ├── unit/             # Unit tests
│   │   ├── modules/      # Module-specific tests
│   │   └── utils/        # Utility function tests
│   └── integration/      # Integration tests
│       ├── api/          # API endpoint tests
│       ├── ics/          # ICS generation tests
│       └── modules/      # Module integration tests
├── docs/                  # Documentation
├── data/                  # Data storage
└── logs/                  # Application logs (reserved for future logging implementation)
```

> Note: The `logs/` directory is currently empty but reserved for future logging implementation. It contains a `.gitkeep` file to maintain the directory structure in Git.

## Available Commands

### Installation
```bash
make install        # Create environment and install dependencies
```

### Running the Application
```bash
make run-dev        # Run in development mode
make run-prod       # Run in production mode
```

### Testing
```bash
make test-unit      # Run unit tests (auto-cleans test files)
make test-integration # Run integration tests (auto-cleans test files)
make test-all       # Run all tests with coverage report
```

### Maintenance
```bash
make clean          # Clean environment, cache files, and test artifacts
make reset          # Reset project (clean + reinstall)
```

## Testing

### Test Structure
- **Unit Tests**: Located in `tests/unit/`
  - Test individual components in isolation
  - Use mocks and stubs to isolate dependencies
  - Focus on edge cases and error handling

- **Integration Tests**: Located in `tests/integration/`
  - Test component interactions
  - Verify API endpoints
  - Test ICS file generation
  - Validate mosque search functionality

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
make clean-test-files  # Clean only test artifacts
make clean            # Full cleanup including cache
```

### Current Coverage
- Overall coverage: 87%
- Areas needing coverage:
  - `app/models/prayer.py`
  - `app/utils/date_utils.py`
  - `app/modules/slot_editor.py`

### Best Practices
1. Keep unit and integration tests separate
2. Use meaningful test names
3. Follow the Arrange-Act-Assert pattern
4. Clean up test data after each test
5. Use fixtures for common test setup

## Troubleshooting

### Common Issues

1. **Import Errors**
   - Ensure virtual environment is activated
   - Check PYTHONPATH includes project root
   - Run `make clean` to clear cache files

2. **Test Failures**
   - Run `make clean` to clear cache and test files
   - Check test database configuration
   - Verify all dependencies are installed

3. **Environment Issues**
   - Ensure correct Python version
   - Check all required packages are installed
   - Verify environment variables are set correctly

4. **Test Artifacts**
   - If test files (`.ics`) remain after tests:
     ```bash
     make clean-test-files  # Clean only test artifacts
     ```
   - If Python cache issues persist:
     ```bash
     make clean  # Full cleanup including cache
     ```
