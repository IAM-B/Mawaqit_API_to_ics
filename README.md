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
```

Then open your browser at: [http://localhost:5000](http://localhost:5000)

---

## 🏗️ Project Structure

```
Mawaqit_API_to_ics/
├── app/
│   ├── __init__.py
│   ├── models/
│   ├── views/
│   ├── controllers/
│   ├── utils/
│   ├── modules/
│   ├── static/
│   └── templates/
├── config/
│   ├── __init__.py
│   ├── development.py
│   └── production.py
├── tests/
│   ├── unit/
│   └── integration/
├── docs/
│   ├── api.md
│   └── setup.md
├── data/
├── logs/
├── requirements.txt
├── Makefile
└── app.py
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
make clean          # Clean environment
make reset          # Reset project
```

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

