# Variables
VENV := env-mawaqit
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
APP := main:app
PORT := 8000

# ⚙️ Création de l'environnement virtuel + install des dépendances
install: $(VENV)/bin/activate

$(VENV)/bin/activate: requirements.txt
	@echo "📦 Création de l’environnement virtuel..."
	python -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	@touch $(VENV)/bin/activate
	@echo "✅ Dépendances installées."

# 🚀 Lancement de l'API en mode local
run: install
	@echo "🚀 Démarrage de l’API avec Uvicorn..."
	$(VENV)/bin/uvicorn $(APP) --host 0.0.0.0 --port $(PORT)

# 🐳 Docker build + run
docker-build:
	@echo "🐳 Construction de l’image Docker..."
	docker build -t mawaqit-api .

docker-run:
	@echo "🐳 Lancement du conteneur Docker..."
	docker run -d --name mawaqit-api -p $(PORT):80 mawaqit-api

# 🧼 Nettoyage
clean:
	@echo "🗑️ Suppression de l’environnement virtuel..."
	rm -rf $(VENV)

docker-clean:
	docker rm -f mawaqit-api || true
	docker rmi mawaqit-api || true

reset: clean install

# ℹ️ Aide
help:
	@echo ""
	@echo "Commandes disponibles :"
	@echo "  make install        → Installer les dépendances Python"
	@echo "  make run            → Lancer l’API localement avec Uvicorn"
	@echo "  make docker-build   → Construire l’image Docker"
	@echo "  make docker-run     → Lancer l’API en conteneur Docker"
	@echo "  make clean          → Supprimer l’environnement virtuel"
	@echo "  make docker-clean   → Supprimer le conteneur et l’image Docker"
	@echo "  make reset          → Recréer l’environnement local"
	@echo ""
