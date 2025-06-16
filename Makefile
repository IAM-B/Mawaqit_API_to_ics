# Variables
VENV := env-planner
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
APP := app.py

# 📦 Installation et configuration
init-direnv:
	@echo "👉 Création du fichier .envrc pour direnv..."
	@echo 'source env-planner/bin/activate' > .envrc
	@direnv allow .
	@echo "✅ direnv configuré. Il activera automatiquement l'environnement en entrant dans le dossier."

install: $(VENV)/bin/activate

$(VENV)/bin/activate: requirements.txt
	@echo "🔧 Création de l'environnement virtuel..."
	python -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	@$(MAKE) init-direnv
	@echo "✅ Installation terminée."
	@echo "🧠 Astuce : direnv activera ton environnement automatiquement à l'avenir."
	@echo "✅ Environnement prêt."

# 🚀 Lancer l'application
run-dev: install
	@echo "🚀 Démarrage de l'application Flask en mode développement..."
	$(PYTHON) $(APP) --env development

run-prod: install
	@echo "🚀 Démarrage de l'application Flask en mode production..."
	$(PYTHON) $(APP) --env production

# 🧪 Tests
test-unit:
	@echo "🧪 Exécution des tests unitaires..."
	$(PYTHON) -m pytest tests/unit -v

test-integration:
	@echo "🧪 Exécution des tests d'intégration..."
	$(PYTHON) -m pytest tests/integration -v

test-all: test-unit test-integration

# 🧼 Nettoyage
clean:
	@echo "🗑️ Suppression de l'environnement virtuel..."
	rm -rf $(VENV)
	@echo "🗑️ Suppression des fichiers Python compilés..."
	find . -type d -name "__pycache__" -exec rm -r {} +
	find . -type f -name "*.pyc" -delete

# 🔄 Réinitialisation
reset: clean install
	@echo "♻️ Projet réinitialisé."

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
	@echo "📚 Démarrage du serveur de documentation..."
	cd docs && python -m http.server 8000

# ℹ️ Aide
help:
	@echo ""
	@echo "Commandes disponibles :"
	@echo "  make install        → Créer l'environnement et installer les dépendances"
	@echo "  make run-dev        → Lancer l'application en mode développement"
	@echo "  make run-prod       → Lancer l'application en mode production"
	@echo "  make test-unit      → Exécuter les tests unitaires"
	@echo "  make test-integration → Exécuter les tests d'intégration"
	@echo "  make test-all       → Exécuter tous les tests"
	@echo "  make clean          → Supprimer l'environnement virtuel et les fichiers compilés"
	@echo "  make reset          → Nettoyer et réinstaller"
	@echo "  make docs-serve     → Démarrer le serveur de documentation"
	@echo ""
	@echo "Commandes Git :"
	@echo "  make gcommit m=\"message\"  → Ajouter, commit avec message"
	@echo "  make gpush         → Pousser sur origin/master"
	@echo "  make gpull         → Récupérer depuis origin/master"
	@echo "  make greset        → Reset le dernier commit (soft)"
	@echo "  make gstatus       → Afficher le status git"
	@echo ""