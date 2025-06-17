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
├── app
│   ├── controllers
│   ├── __init__.py
│   ├── models
│   ├── modules
│   ├── static
│   ├── templates
│   ├── utils
│   └── views
├── config
│   ├── development.py
│   ├── __init__.py
│   ├── production.py
│   └── testing.py
├── data
│   ├── log_20250602.log
│   ├── metadata.json
│   └── mosques_by_country
├── docs
│   ├── api.md
│   ├── setup.md
│   └── testing.md
├── logs
│    └── .gitkeep
├── tests
│    ├── conftest.py
│    ├── integration
│    └── unit
├── .gitignore
├── app.py
├── Makefile
├── pyproject.toml
├── README.md
├── requirements.txt
└── setup.py

```

---

## 🛠️ Available Commands

```bash
# Installation
make install        # Create environment and install dependencies

# Running
make run-dev        # Run in development mode
make run-prod       # Run in production mode

# Testing
make test-unit      # Run unit tests
make test-integration # Run integration tests
make test-all       # Run all tests

# Maintenance
make cleanup        # Clean environment and remove test files
make reset          # Reset project
```

---

## 🧪 Testing Structure

tests/
├── unit/ # Unit tests
│ ├── modules/ # Module-specific unit tests
│ └── utils/ # Utility function tests
└── integration/ # Integration tests
├── api/ # API endpoint tests
├── ics/ # ICS generation tests
└── modules/ # Module integration tests

---

### Test Coverage

Current test coverage: 87%

- Unit tests focus on individual components and functions
- Integration tests verify the interaction between components
- All tests can be run with coverage report using `make test-all`

---

## 📝 Documentation

- [API Documentation](docs/api.md)
- [Setup Guide](docs/setup.md)
- [Testing Guide](docs/testing.md)

---

## 🗺️ Roadmap

* [ ] Add unit and integration tests
* [ ] Calendar simulator with slot editor
* [ ] Add recurring tasks to free slots
* [ ] Create mobile interface
* [ ] Complete documentation

---

## 📖 License

MIT License – © 2025

