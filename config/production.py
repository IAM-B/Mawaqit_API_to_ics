"""
Configuration pour l'environnement de production
"""

DEBUG = False
TESTING = False

# Configuration de la base de données
DATABASE_URI = 'sqlite:///prod.db'

# Configuration de Mawaqit
MAWAQIT_BASE_URL = 'https://mawaqit.net/fr'
MAWAQIT_REQUEST_TIMEOUT = 10  # secondes
MAWAQIT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

# Configuration des logs
LOG_LEVEL = 'INFO'
LOG_FILE = 'logs/prod.log'

# Configuration des données de mosquées
MOSQUE_DATA_DIR = 'data/mosques_by_country' 