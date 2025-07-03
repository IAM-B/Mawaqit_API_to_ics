# Variables
VENV := env-planner
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
APP := app.py

# 📦 Installation and Configuration
init-direnv:
	@echo "👉 Creating .envrc file for direnv..."
	@echo 'source env-planner/bin/activate' > .envrc
	@direnv allow .
	@echo "✅ direnv configured. Environment will activate automatically."

install: $(VENV)/bin/activate

$(VENV)/bin/activate: requirements.txt
	@echo "🔧 Creating virtual environment..."
	python -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	@$(MAKE) init-direnv
	@echo "✅ Installation complete."
	@echo "🧠 Tip: direnv will automatically activate your environment in the future."

# 🚀 Application Launch
run-dev: install
	@echo "🚀 Starting Flask application in development mode..."
	FLASK_ENV=development $(PYTHON) $(APP)

run-prod: install
	@echo "🚀 Starting Flask application in production mode..."
	FLASK_ENV=production $(PYTHON) $(APP)

run-test: install
	@echo "🧪 Starting Flask application in test mode..."
	FLASK_ENV=testing $(PYTHON) $(APP)

# 🧪 Tests
test-js:
	@echo "🧪 Running JavaScript unit tests (Jest)..."
	npm run test -- tests/js/unit/

test-js-integration:
	@echo "🧪 Running JavaScript integration tests (Jest)..."
	npm run test -- tests/js/integration/

test-js-all:
	@echo "🧪 Running all JavaScript tests (Jest)..."
	npm run test -- tests/js/

test-e2e:
	@echo "🧪 Running end-to-end tests (Playwright)..."
	npm run test:e2e

test-py:
	@echo "🧪 Running Python tests (pytest)..."
	@mkdir -p logs
	FLASK_ENV=testing $(PYTHON) -m pytest tests/python/ --maxfail=2 --disable-warnings -v | tee logs/python_tests.log logs/result_tests.txt
	@$(MAKE) clean-ics

test: test-js-all test-e2e test-py
	@echo "✅ All tests completed."

# 📊 Coverage
coverage-js:
	@echo "📊 Generating JavaScript coverage..."
	npm run test:coverage

coverage-py:
	@echo "📊 Generating Python coverage..."
	@mkdir -p logs
	PYTHONPATH=. $(PYTHON) -m pytest tests/python/ --cov=app --cov-report=html:htmlcov/python --cov-report=term-missing --disable-warnings -q | tee logs/coverage_report.log

coverage: coverage-js coverage-py
	@echo "✅ Complete coverage generated."

# 🧼 Cleanup
clean-ics:
	@echo "🗑️ Cleaning generated test files..."
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
	@echo "✅ Test files cleaned."

cleanup:
	@echo "🗑️ Removing virtual environment..."
	rm -rf $(VENV)
	@echo "🗑️ Removing compiled Python files..."
	find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "🗑️ Removing log files..."
	rm -rf logs/*.log logs/*.txt 2>/dev/null || true
	@echo "🗑️ Removing coverage files..."
	rm -rf htmlcov/ coverage/ .nyc_output/ 2>/dev/null || true
	@echo "🗑️ Removing test reports..."
	rm -rf test-results/ playwright-report/ 2>/dev/null || true
	@echo "🗑️ Removing Node.js modules..."
	rm -rf node_modules/ 2>/dev/null || true
	@$(MAKE) clean-ics
	@echo "✅ Cleanup complete."

# 🔄 Reset
reset: cleanup install
	@echo "♻️ Project reset complete."

# 📝 Git
gcommit:
	@echo "📝 Adding and committing changes..."
	git add .
	git commit

gpush:
	@echo "📤 Pushing to origin/master..."
	git push origin master

gpull:
	@echo "📥 Pulling from origin/master..."
	git pull origin master

greset:
	@echo "↩️ Resetting last commit (soft)..."
	git reset HEAD~

gstatus:
	@echo "📊 Git status..."
	git status

# 📚 Documentation
docs-serve:
	@echo "📚 Starting modern documentation server..."
	cd docs && python docs_server.py

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

# ℹ️ Help
help:
	@echo ""
	@echo "Available commands:"
	@echo ""
	@echo "🚀 Launch:"
	@echo "  make install        → Create environment and install dependencies"
	@echo "  make run-dev        → Launch in development mode"
	@echo "  make run-prod       → Launch in production mode"
	@echo "  make run-test       → Launch in test mode"
	@echo ""
	@echo "🧪 Tests:"
	@echo "  make test           → All tests (JS + E2E + Python)"
	@echo "  make test-js        → JavaScript unit tests (Jest)"
	@echo "  make test-js-integration → JavaScript integration tests (Jest)"
	@echo "  make test-js-all    → All JavaScript tests (Jest)"
	@echo "  make test-e2e       → End-to-end tests (Playwright)"
	@echo "  make test-py        → Python tests (pytest)"
	@echo "  make coverage       → Complete coverage (JS + Python)"
	@echo ""
	@echo "🧼 Maintenance:"
	@echo "  make cleanup        → Clean environment and temporary files"
	@echo "  make reset          → Clean and reinstall"
	@echo ""
	@echo "📚 Documentation:"
	@echo "  make docs-serve     → Start documentation server"
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