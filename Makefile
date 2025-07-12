# Variables
PYTHON := uv run python
UV := uv
APP := main.py

# 📦 Installation and configuration
install:
	$(UV) sync
	@echo "✅ Installation of dependencies with UV completed."

# 🚀 Launching the application
run-dev: install
	@echo "🚀 Starting the Flask application in development mode..."
	FLASK_ENV=development $(UV) run python $(APP)

run-prod: install
	@echo "🚀 Starting the Flask application in production mode..."
	FLASK_ENV=production $(UV) run python $(APP)

run-test: install
	@echo "🧪 Starting the Flask application in test mode..."
	FLASK_ENV=testing $(UV) run python $(APP)

# 🧪 Tests
test-js:
	npm run test -- tests/js/unit/

test-js-integration:
	npm run test -- tests/js/integration/

test-js-all:
	npm run test -- tests/js/

test-e2e:
	npm run test:e2e

test-py:
	$(UV) run pytest tests/python/ --maxfail=2 --disable-warnings -v

test: test-js-all test-e2e test-py
	@echo "✅ All tests are done."

# 📊 Coverage
coverage-js:
	npm run test:coverage

coverage-py:
	$(UV) run pytest tests/python/ --cov=app --cov-report=html:htmlcov/python --cov-report=term-missing --disable-warnings -q

coverage: coverage-js coverage-py
	@echo "✅ Complete coverage generated."

# 🧼 Clean files
clean-ics:
	rm -f *.ics
	rm -f tests/*.ics
	rm -f tests/python/unit/*.ics
	rm -f tests/python/integration/*.ics
	rm -f tests/python/unit/modules/*.ics
	rm -f tests/python/integration/modules/*.ics
	rm -f tests/python/integration/api/*.ics
	rm -f tests/python/integration/ics/*.ics
	rm -f app/static/ics/*.ics
	rm -f app/cache/*.json
	rm -f app/cache/*.ics
	@echo "✅ ICS files and cache cleaned."

cleanup:
	rm -rf .venv
	find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	rm -rf logs/*.log logs/*.txt 2>/dev/null || true
	rm -rf htmlcov/ coverage/ .nyc_output/ 2>/dev/null || true
	rm -rf test-results/ playwright-report/ 2>/dev/null || true
	rm -rf node_modules/ 2>/dev/null || true
	$(MAKE) clean-ics
	@echo "✅ Complete cleanup."

# 🔄 Reset
reset: cleanup install
	@echo "♻️ Project reset."

# 📚 Documentation
docs-serve:
	cd docs && $(UV) run python docs_server.py

# 🔧 Configuration
config-dev:
	@echo "🔧 Configuring development environment..."
	cp config/development.py config/__init__.py

config-prod:
	@echo "🔧 Configuring production environment..."
	cp config/production.py config/__init__.py

config-test:
	@echo "🔧 Configuring test environment..."
	cp config/testing.py config/__init__.py

# 🎨 Code Quality
format:
	@echo "🎨 Formatting code with Ruff..."
	$(UV) run ruff format .

lint:
	@echo "🔍 Linting code with Ruff..."
	$(UV) run ruff check .

check: format lint
	@echo "✅ Code quality check completed."

fix:
	@echo "🔧 Auto-fixing code issues with Ruff..."
	$(UV) run ruff check --fix .

# ℹ️ Help
help:
	@echo ""
	@echo "Available commands:"
	@echo ""
	@echo "🚀 Launch:"
	@echo "  make install        → Install dependencies with UV"
	@echo "  make run-dev        → Launch in development mode"
	@echo "  make run-prod       → Launch in production mode"
	@echo "  make run-test       → Launch in test mode"
	@echo ""
	@echo "🧪 Tests :"
	@echo "  make test           → All tests (JS + E2E + Python)"
	@echo "  make test-js        → Unit tests JS (Jest)"
	@echo "  make test-js-integration → Integration tests JS (Jest)"
	@echo "  make test-js-all    → All JS tests (Jest)"
	@echo "  make test-e2e       → End-to-end tests (Playwright)"
	@echo "  make test-py        → Python tests (pytest)"
	@echo "  make coverage       → Complete coverage (JS + Python)"
	@echo ""
	@echo "🎨 Code Quality:"
	@echo "  make format         → Format code with Ruff"
	@echo "  make lint           → Lint code with Ruff"
	@echo "  make check          → Format + Lint"
	@echo "  make fix            → Auto-fix code issues"
	@echo ""
	@echo "🧼 Maintenance :"
	@echo "  make cleanup        → Clean environment and temporary files"
	@echo "  make reset          → Clean and reinstall"
	@echo ""
	@echo "📚 Documentation :"
	@echo "  make docs-serve     → Launch the documentation server"
	@echo ""
	@echo "🔧 Configuration:"
	@echo "  make config-dev     → Configure development environment"
	@echo "  make config-prod    → Configure production environment"
	@echo "  make config-test    → Configure test environment"
	@echo ""
	@echo "📝 Git:"
	@echo "  make gcommit        → Add and commit changes"
	@echo "  make gpush          → Push to origin/master"
	@echo "  make gpull          → Pull from origin/master"
	@echo "  make greset         → Reset last commit (soft)"
	@echo "  make gstatus        → Show Git status"
	@echo ""

.PHONY: help test test-js test-js-integration test-js-all test-e2e test-py coverage coverage-js coverage-py cleanup reset clean-ics