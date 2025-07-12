# Mawaqit to ICS

A modern web application that generates personalized prayer schedules synchronized with local mosque times from [Mawaqit](https://mawaqit.net). Exports `.ics` calendar files for seamless integration with your favorite calendar apps.

---

**🚀 Major Update:**
- Full migration to [UV](https://github.com/astral-sh/uv) (no more venv/pip, no `env-planner/`)
- Centralized Flask configuration (all environments, with `ICS_CALENDAR_NAME` and `ICS_CALENDAR_DESCRIPTION`)
- Refactor: `app.py` renamed to `main.py`, only one application factory (`create_app`)
- Python linting and formatting with [Ruff](https://docs.astral.sh/ruff/) (replaces black, isort, flake8)
- All Python/JS tests pass (E2E Playwright: **coming soon**)
- `.gitignore` and Makefile updated for UV and modern workflow

---

## 🛠️ Tech Stack

### Backend

- **Python 3.9+** with **UV** package manager
- **Flask 3.1.1** - Web framework
- **iCalendar 6.3.1** - Calendar file generation
- **Requests 2.32.4** - HTTP client
- **BeautifulSoup4 4.13.4** - Web scraping

### Frontend

- **Vanilla JavaScript** with modular architecture
- **Jest** - Unit and integration testing
- **Playwright** - End-to-end testing (**E2E coming soon**)
- **Modern CSS** with responsive design

### Development Tools

- **UV** - Fast Python package manager (replaces pip/venv)
- **Ruff** - Python linter & formatter (replaces black, isort, flake8)
- **Node.js** - JavaScript runtime and testing
- **Make** - Build automation and development scripts

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- [UV](https://github.com/astral-sh/uv) package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/IAM-B/Mawaqit_API_to_ics
cd Mawaqit_API_to_ics

# Install dependencies
make install

# Start development server
make run-dev
```

Visit [http://localhost:5000](http://localhost:5000) to access the application.

## 🧪 Testing

```bash
# All tests (Python + JavaScript)
make test

# Python tests only
make test-py

# JavaScript tests only
make test-js-all

# End-to-end tests (Playwright)
make test-e2e   # (coming soon)

# Coverage reports
make coverage
```

## 📁 Project Structure

```
Mawaqit_API_to_ics/
├── app/                    # Flask application
│   ├── api/               # API endpoints
│   ├── controllers/       # Flask controllers
│   ├── modules/           # Business logic
│   ├── static/            # Frontend assets
│   │   ├── css/          # Stylesheets
│   │   ├── js/           # JavaScript modules
│   │   └── ics/          # Generated calendar files
│   └── templates/         # HTML templates
├── config/                # Environment configurations
├── data/                  # Mosque data and metadata
├── docs/                  # Documentation
├── tests/                 # Test suite
│   ├── python/           # Python tests (unit + integration)
│   ├── js/               # JavaScript tests (unit + integration)
│   └── e2e/              # End-to-end tests (Playwright, WIP)
├── main.py                # Main Flask entrypoint (was app.py)
├── pyproject.toml         # Python dependencies (UV)
├── package.json           # Node.js dependencies
└── Makefile               # Development automation
```

## 🔧 Development Commands

### Application

```bash
make run-dev      # Development mode
make run-prod     # Production mode
make run-test     # Test mode
```

### Testing

```bash
make test         # All tests
make test-py      # Python tests
make test-js      # JavaScript unit tests
make test-js-integration  # JavaScript integration tests
make test-js-all  # All JavaScript tests
make test-e2e     # End-to-end tests (coming soon)
make coverage     # Generate coverage reports
```

### Maintenance

```bash
make cleanup      # Clean temporary files
make reset        # Reset project state
make install      # Install dependencies
make fix          # Auto-fix Python code style (Ruff)
make lint         # Lint Python code (Ruff)
```

## ⚙️ Flask Configuration

- All environment variables and config options are centralized in `config/`
- Main variables: `ICS_CALENDAR_NAME`, `ICS_CALENDAR_DESCRIPTION`, `MAWAQIT_BASE_URL`, etc.
- Use `main.create_app(config_name, config_overrides)` for custom test/dev setups

## 🌟 Features

- **Mosque Selection**: Choose from 50,000+ mosques worldwide
- **Flexible Scheduling**: Daily, monthly, or yearly prayer times
- **Smart Time Slots**: Calculate free time between prayers
- **Calendar Export**: Generate `.ics` files for any calendar app
- **Modern UI**: Interactive timeline and circular clock visualization
- **Padding Configuration**: Customize delays before/after prayers
- **Multiple Export Types**: Prayer times, empty slots, available slots
- **Advanced Features**: Hijri dates, voluntary fasts, adhkar
- **Slot Segmentation**: Hourly breakdown mode

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Install dependencies: `make install`
3. Run tests: `make test`
4. Start development: `make run-dev`

### Code Quality

- Python: Use type hints, follow PEP 8, auto-format with Ruff
- JavaScript: Use ES6+ features, modular architecture
- Tests: Maintain high coverage, use mocks for external APIs
- Documentation: Update README and docs for new features

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Run full test suite: `make test`
4. Update documentation if needed
5. Submit PR with clear description

## 📚 Documentation

- **API Documentation**: Available at `/docs` when running locally
- **UV Documentation**: [https://docs.astral.sh/uv/](https://docs.astral.sh/uv/)
- **Ruff Documentation**: [https://docs.astral.sh/ruff/](https://docs.astral.sh/ruff/)
- **Flask Documentation**: [https://flask.palletsprojects.com/](https://flask.palletsprojects.com/)

## 🔗 Links

- **Repository**: [https://github.com/IAM-B/Mawaqit_API_to_ics](https://github.com/IAM-B/Mawaqit_API_to_ics)
- **Issues**: [https://github.com/IAM-B/Mawaqit_API_to_ics/issues](https://github.com/IAM-B/Mawaqit_API_to_ics/issues)
- **Mawaqit API**: [https://mawaqit.net](https://mawaqit.net)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.
