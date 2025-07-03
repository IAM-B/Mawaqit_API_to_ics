# Mawaqit to ICS

**Mawaqit to ICS** is a local tool that generates a personalized schedule synchronized with prayer times from your local mosque.

This application fetches prayer times from [Mawaqit](https://mawaqit.net), calculates free time slots between prayers, and helps you plan your daily, monthly, or yearly routine.

It also generates an `.ics` calendar file that you can import into your favorite calendar app (Google Calendar, Proton Calendar, etc.).

---

## 📦 Features

* 🌍 Select your mosque
* 🕒 Choose scope: daily, monthly, or yearly prayer times
* 📅 Calculate free time slots between prayers
* 📤 Export schedule as `.ics` file
* 📁 Local web interface via Flask
* 🎨 Modern interface with timeline and circular clock
* ⚙️ Padding configuration (delays before/after prayers)
* 🔄 Generate three types of ICS files:
  * Prayer times
  * Empty slots
  * Available slots
* 🌟 Features integration (Hijri dates, voluntary fasts, adhkar)
* 📊 Slot segmentation with hourly breakdown
* 📚 Modern documentation server with HTML template

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/IAM-B/Mawaqit_API_to_ics
cd Mawaqit_API_to_ics
```

### 2. Environment Setup

```bash
# Create and activate virtual environment
make install
```

### 3. Run the application

```bash
# Development mode
make run-dev

# Production mode
make run-prod

# Test mode
make run-test
```

Then open your browser at: [http://localhost:5000](http://localhost:5000)

---

## 🏗️ Project Structure

```
Mawaqit_API_to_ics/
├── app/
│   ├── api/                 # API endpoints
│   ├── cache/               # Cache management
│   ├── controllers/         # Flask controllers
│   ├── modules/             # Business modules
│   │   ├── mawaqit_fetcher.py
│   │   ├── prayer_generator.py
│   │   ├── slots_generator.py
│   │   └── ...
│   ├── static/              # Static assets
│   │   ├── css/            # Styles (landing, planner, styles)
│   │   ├── js/             # JavaScript modules
│   │   │   ├── components/ # UI components (calendar, clock, map, etc.)
│   │   │   ├── pages/      # Page-specific logic (landing, planner)
│   │   │   ├── utils/      # Utility functions
│   │   │   └── main.js     # Main initialization
│   │   └── ics/            # Generated ICS files
│   ├── templates/           # HTML templates
│   ├── utils/               # Utilities
│   └── views/               # Flask views
├── config/                  # Multi-environment configuration
├── data/                    # Data (metadata, mosques)
├── docs/                    # Documentation
├── tests/                   # Complete tests
│   ├── js/                 # JavaScript tests
│   │   ├── unit/           # Unit tests
│   │   └── integration/    # Integration tests
│   ├── python/             # Python tests
│   │   ├── unit/           # Unit tests
│   │   └── integration/    # Integration tests
│   └── e2e/                # End-to-end Playwright tests
├── app.py                   # Flask entry point
├── package.json             # Node.js dependencies
├── requirements.txt         # Python dependencies
└── Makefile                 # Automated commands
```

---

## 🛠️ Available Commands

### 🚀 Launch
```bash
make install        # Create environment and install dependencies
make run-dev        # Launch in development mode
make run-prod       # Launch in production mode
make run-test       # Launch in test mode
```

### 🧪 Tests
```bash
make test           # All tests (JS + E2E + Python)
make test-js        # JavaScript unit tests (Jest)
make test-js-integration # JavaScript integration tests (Jest)
make test-js-all    # All JavaScript tests (Jest)
make test-e2e       # End-to-end tests (Playwright)
make test-py        # Python tests (pytest)
make coverage       # Complete coverage (JS + Python)
```

### 🧼 Maintenance
```bash
make cleanup        # Clean environment and test files
make reset          # Reset project
```

### 📚 Documentation
```bash
make docs-serve     # Start documentation server
```

---

## 🧪 Test Structure

### Python Tests (`tests/python/`)
- **Unit tests** (`unit/`): Individual functions and components
- **Integration tests** (`integration/`): Component interactions
- **Coverage**: 65% (140 tests, 1 xfailed)

### JavaScript Tests (`tests/js/`)
- **Unit tests** (`unit/`): Individual components and utilities
- **Integration tests** (`integration/`): Component interactions
- **E2E tests** (`tests/e2e/`): User interface tests with Playwright
- **JS coverage**: 94% for landing.js, 1.73% for planner.js

### Test Commands
```bash
# Python tests
pytest tests/python/ --cov=app --cov-report=html:htmlcov/python

# JavaScript unit tests
npm run test:js:unit

# JavaScript integration tests
npm run test:js:integration

# All JavaScript tests
npm run test:js

# E2E tests
npm run test:e2e

# All tests
npm run test:full
```

---

## 🎨 User Interface

### Interactive Timeline
- Prayer time display
- Automatically calculated free slots
- Padding management (before/after delays)
- Responsive interface
- **Slot segmentation**: Optional hourly breakdown mode

### Circular Clock
- Circular visualization of schedules
- Colored arcs for each prayer
- Automatic adaptation based on paddings
- Touch interaction

### Padding Configuration
- Customizable delays before each prayer
- Customizable delays after each prayer
- Minimum values for display
- Calculation/display separation

---

## 📝 Documentation

- [Installation Guide](docs/setup.md)
- [API Documentation](docs/api.md)
- [Testing Guide](docs/testing.md)
- [Timeline and Interface](docs/timeline.md)
- [Features Integration](docs/features_integration.md)
- [Project Review](docs/project_review.md)
- [E2E Testing Status](docs/e2e-testing-status.md)
- [Documentation Updates](docs/documentation_updates.md)

### 📚 Documentation Server
```bash
make docs-serve  # Start modern documentation server
```
Access at: [http://localhost:8000](http://localhost:8000)

---

## 🗺️ Roadmap

* [x] Python unit and integration tests
* [x] JavaScript unit tests (Jest)
* [x] End-to-end tests (Playwright)
* [x] Timeline interface with circular clock
* [x] Padding management
* [x] Modular JavaScript architecture
* [x] Religious features integration (Hijri dates, voluntary fasts, adhkar)
* [x] Slot segmentation with hourly breakdown
* [x] Modern documentation server
* [x] Complete documentation structure
* [ ] Individual padding configuration per prayer
* [ ] Add recurring tasks to free slots
* [ ] Mobile interface

---

## 🛠️ Technologies Used

### Backend
- **Python 3.13**: Main language
- **Flask**: Web framework
- **pytest**: Python testing
- **requests**: Mawaqit API

### Frontend
- **JavaScript ES6+**: User interface
- **CSS3**: Styles and animations
- **HTML5**: Structure

### Testing
- **Jest**: JavaScript unit testing
- **Playwright**: End-to-end testing
- **jsdom**: DOM environment for Jest

### Tools
- **Make**: Task automation
- **npm**: Node.js dependency management
- **pip**: Python dependency management
- **Markdown**: Documentation conversion
- **Jinja2**: HTML templating

---

## 📖 License

MIT License – © 2025

