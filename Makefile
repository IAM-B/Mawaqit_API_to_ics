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
	@echo "✅ direnv configured. It will automatically activate the environment when entering the directory."

install: $(VENV)/bin/activate

$(VENV)/bin/activate: requirements.txt
	@echo "🔧 Creating virtual environment..."
	python -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	@$(MAKE) init-direnv
	@echo "✅ Installation complete."
	@echo "🧠 Tip: direnv will automatically activate your environment in the future."
	@echo "✅ Environment ready."

# 🚀 Launch Application
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
test-unit:
	@echo "🧪 Running unit tests..."
	FLASK_ENV=testing $(PYTHON) -m pytest tests/unit -v | tee logs/unit_tests.log
	@$(MAKE) clean-ics

test-integration:
	@echo "🧪 Running integration tests..."
	FLASK_ENV=testing $(PYTHON) -m pytest tests/integration -v | tee logs/integration_tests.log
	@$(MAKE) clean-ics

test-all:
	@$(MAKE) test-unit
	@$(MAKE) test-integration
	@cat logs/unit_tests.log logs/integration_tests.log > logs/all_tests.log

# 📊 Coverage
coverage:
	@mkdir -p logs
	PYTHONPATH=. $(PYTHON) -m pytest --cov=app --cov-report=term-missing --disable-warnings -q | tee logs/coverage_report.log

# 🧼 Cleanup
clean-ics:
	@echo "🗑️ Cleaning test generated files..."
	rm -f *.ics
	rm -f tests/*.ics
	rm -f tests/unit/*.ics
	rm -f tests/integration/*.ics
	rm -f tests/unit/modules/*.ics
	rm -f tests/integration/modules/*.ics
	rm -f tests/integration/api/*.ics
	rm -f tests/integration/ics/*.ics
	rm -f app/static/ics/*.ics
	@echo "✅ Test files cleaned."

cleanup:
	@echo "🗑️ Removing virtual environment..."
	rm -rf $(VENV)
	@echo "🗑️ Removing compiled Python files..."
	find . -type d -name "__pycache__" -exec rm -r {} +
	find . -type f -name "*.pyc" -delete
	@echo "🗑️ Removing log files..."
	rm -rf logs/*.log
	@$(MAKE) clean-ics
	@echo "✅ Cleanup complete."

# 🔄 Reset
reset: clean install
	@echo "♻️ Project reset complete."

# 📝 Git
gcommit:
	git add .
	git commit

gpush:
	git push origin master

gpull:
	git pull origin master

greset:
	git reset HEAD~

gstatus:
	git status

# 📚 Documentation
docs-serve:
	@echo "📚 Starting documentation server..."
	cd docs && python -m http.server 8000

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
	@echo "  make install        → Create environment and install dependencies"
	@echo "  make run-dev        → Launch application in development mode"
	@echo "  make run-prod       → Launch application in production mode"
	@echo "  make run-test       → Launch application in test mode"
	@echo "  make test-unit      → Run unit tests"
	@echo "  make test-integration → Run integration tests"
	@echo "  make test-all       → Run all tests"
	@echo "  make clean          → Remove virtual environment and compiled files"
	@echo "  make reset          → Clean and reinstall"
	@echo "  make docs-serve     → Start documentation server"
	@echo ""
	@echo "Configuration commands:"
	@echo "  make config-dev     → Configure development environment"
	@echo "  make config-prod    → Configure production environment"
	@echo "  make config-test    → Configure test environment"
	@echo ""
	@echo "Git commands:"
	@echo "  make gcommit m=\"message\"  → Add, commit with message"
	@echo "  make gpush         → Push to origin/master"
	@echo "  make gpull         → Pull from origin/master"
	@echo "  make greset        → Reset last commit (soft)"
	@echo "  make gstatus       → Show git status"
	@echo ""