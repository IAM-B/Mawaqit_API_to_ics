# Mawaqit to ICS

A modern web application that generates personalized prayer schedules synchronized with local mosque times from [Mawaqit](https://mawaqit.net). Exports `.ics` calendar files for seamless integration with your favorite calendar apps.

## 🛠️ Tech Stack

### Backend

- **Python 3.9+** with **UV** package manager
- **Flask 3.1.1** - Web framework
- **Pandas 2.3.0** - Data manipulation
- **iCalendar 6.3.1** - Calendar file generation
- **Requests 2.32.4** - HTTP client
- **BeautifulSoup4 4.13.4** - Web scraping

### Frontend

- **Vanilla JavaScript** with modular architecture
- **Jest** - Unit and integration testing
- **Playwright** - End-to-end testing
- **Modern CSS** with responsive design

### Development Tools

- **UV** - Fast Python package manager (replaces pip/venv)
- **Node.js** - JavaScript runtime and testing
- **Make** - Build automation and development scripts

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- UV package manager

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
# All tests (Python + JavaScript + E2E)
make test

# Python tests only
make test-py

# JavaScript tests only
make test-js-all

# End-to-end tests
make test-e2e

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
│   └── e2e/              # End-to-end tests (Playwright)
├── pyproject.toml        # Python dependencies (UV)
├── package.json          # Node.js dependencies
└── Makefile              # Development automation
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
make test-js-all  # JavaScript tests
make test-e2e     # End-to-end tests
make coverage     # Generate coverage reports
```

### Maintenance

```bash
make cleanup      # Clean temporary files
make reset        # Reset project state
make install      # Install dependencies
```

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

- Python: Follow PEP 8, use type hints
- JavaScript: Use ES6+ features, modular architecture
- Tests: Maintain >80% coverage
- Documentation: Update README for new features

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Run full test suite: `make test`
4. Update documentation if needed
5. Submit PR with clear description

## 📚 Documentation

- **API Documentation**: Available at `/docs` when running locally
- **UV Documentation**: [https://docs.astral.sh/uv/](https://docs.astral.sh/uv/)
- **Flask Documentation**: [https://flask.palletsprojects.com/](https://flask.palletsprojects.com/)

## 🔗 Links

- **Repository**: [https://github.com/IAM-B/Mawaqit_API_to_ics](https://github.com/IAM-B/Mawaqit_API_to_ics)
- **Issues**: [https://github.com/IAM-B/Mawaqit_API_to_ics/issues](https://github.com/IAM-B/Mawaqit_API_to_ics/issues)
- **Mawaqit API**: [https://mawaqit.net](https://mawaqit.net)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.
