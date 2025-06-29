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
│   │   ├── js/             # JavaScript (landing, planner)
│   │   └── ics/            # Generated ICS files
│   ├── templates/           # HTML templates
│   ├── utils/               # Utilities
│   └── views/               # Flask views
├── config/                  # Multi-environment configuration
├── data/                    # Data (metadata, mosques)
├── docs/                    # Documentation
├── tests/                   # Complete tests
│   ├── js/                 # JavaScript unit tests
│   ├── e2e/                # End-to-end Playwright tests
│   ├── integration/        # Python integration tests
│   └── unit/               # Python unit tests
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

### Python Tests
- **Unit tests**: Individual functions and components
- **Integration tests**: Component interactions
- **Coverage**: 65% (140 tests, 1 xfailed)

### JavaScript Tests
- **Unit tests (Jest)**: 36 tests for landing.js and planner.js
- **E2E tests (Playwright)**: User interface tests
- **JS coverage**: 94% for landing.js, 1.73% for planner.js

### Test Commands
```bash
# Python tests
pytest --cov=app --cov-report=html

# JavaScript tests
npm run test:js:coverage

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

---

## 🗺️ Roadmap

* [x] Python unit and integration tests
* [x] JavaScript unit tests (Jest)
* [x] End-to-end tests (Playwright)
* [x] Timeline interface with circular clock
* [x] Padding management
* [ ] Individual padding configuration per prayer
* [ ] Add recurring tasks to free slots
* [ ] Mobile interface
* [ ] Complete documentation

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

---

## 📖 License

MIT License – © 2025

