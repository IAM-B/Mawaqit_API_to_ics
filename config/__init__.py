"""
Configuration pour l'environnement de développement
"""

import os

class Config:
    """Configuration de base"""
    DEBUG = True
    TESTING = False
    
    # Configuration de la base de données
    DATABASE_URI = 'sqlite:///dev.db'
    
    # Configuration de Mawaqit
    MAWAQIT_BASE_URL = 'https://mawaqit.net/fr'
    MAWAQIT_REQUEST_TIMEOUT = 10
    MAWAQIT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    
    # Configuration des logs
LOG_LEVEL = 'DEBUG'
LOG_FILE = 'logs/dev.log'

# Configuration des données de mosquées
MOSQUE_DATA_DIR = 'data/mosques_by_country'

class DevelopmentConfig(Config):
    """Configuration pour l'environnement de développement"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Configuration pour l'environnement de production"""
    DEBUG = False
    TESTING = False

class TestingConfig(Config):
    """Configuration pour l'environnement de test"""
    DEBUG = True
    TESTING = True

def get_config(config_name=None):
    """
    Retourne la configuration appropriée selon l'environnement.
    
    Args:
        config_name (str): Nom de la configuration ('development', 'production', 'testing')
    
    Returns:
        Config: Instance de configuration appropriée
    """
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    config_map = {
        'development': DevelopmentConfig,
        'production': ProductionConfig,
        'testing': TestingConfig
    }
    
    return config_map.get(config_name, DevelopmentConfig) 