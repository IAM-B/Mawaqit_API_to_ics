# Variables
VENV := env-planner
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip


init-direnv:
	@echo "👉 Création du fichier .envrc pour direnv..."
	@echo 'source env-planner/bin/activate' > .envrc
	@direnv allow .
	@echo "✅ direnv configuré. Il activera automatiquement l'environnement en entrant dans le dossier."


# 📦 Création environnement + dépendances
install: $(VENV)/bin/activate

$(VENV)/bin/activate: requirements.txt
	@echo "🔧 Création de l’environnement virtuel..."
	python -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	@$(MAKE) init-direnv
	@echo "✅ Installation terminée."
	@echo "🧠 Astuce : direnv activera ton environnement automatiquement à l'avenir."
	@echo "✅ Environnement prêt."

# 🚀 Lancer l'application
run: install
	@echo "🚀 Démarrage de l'application Flask..."
	$(PYTHON) app.py

# 🧼 Nettoyer l'environnement
clean:
	@echo "🗑️ Suppression de l’environnement virtuel..."
	rm -rf $(VENV)

# 🔄 Réinitialisation complète
reset: clean install
	@echo "♻️ Projet réinitialisé."

# ℹ️ Aide
help:
	@echo ""
	@echo "Commandes disponibles :"
	@echo "  make install   → Créer l’environnement et installer les dépendances"
	@echo "  make run       → Lancer l’interface Flask"
	@echo "  make clean     → Supprimer l’environnement virtuel"
	@echo "  make reset     → Nettoyer et réinstaller"
	@echo ""
