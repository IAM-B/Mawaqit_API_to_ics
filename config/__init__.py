"""
Module de configuration pour l'application Mawaqit to ICS.
Gère le chargement de la configuration selon l'environnement.
"""

import os
from typing import Dict, Any
from pathlib import Path

class Config:
    """Configuration de base pour l'application."""
    
    # Configuration Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
    DEBUG = False
    TESTING = False
    
    # Configuration de la base de données
    DATABASE_URI = os.environ.get('DATABASE_URI', 'sqlite:///app.db')
    
    # Configuration de Mawaqit
    MAWAQIT_BASE_URL = 'https://mawaqit.net/fr'
    MAWAQIT_REQUEST_TIMEOUT = 10
    MAWAQIT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    
    # Configuration des logs
    LOG_LEVEL = 'INFO'
    LOG_FILE = 'logs/app.log'
    
    # Configuration ICS
    ICS_CALENDAR_NAME = 'Horaires de prières'
    ICS_CALENDAR_DESCRIPTION = 'Horaires de prières générés depuis Mawaqit'
    
    # Configuration des chemins
    BASE_DIR = Path(__file__).resolve().parent.parent
    DATA_DIR = BASE_DIR / 'data'
    MOSQUE_DATA_DIR = DATA_DIR / 'mosques_by_country'
    ICS_OUTPUT_DIR = BASE_DIR / 'app' / 'static' / 'ics'
    
    # Création des répertoires nécessaires
    @classmethod
    def init_directories(cls):
        """Crée les répertoires nécessaires au fonctionnement de l'application."""
        cls.DATA_DIR.mkdir(parents=True, exist_ok=True)
        cls.MOSQUE_DATA_DIR.mkdir(parents=True, exist_ok=True)
        cls.ICS_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        Path(cls.LOG_FILE).parent.mkdir(parents=True, exist_ok=True)
    
    @classmethod
    def get_config(cls) -> Dict[str, Any]:
        """Retourne la configuration sous forme de dictionnaire."""
        return {key: value for key, value in cls.__dict__.items() 
                if not key.startswith('_') and key.isupper()}

class DevelopmentConfig(Config):
    """Configuration pour l'environnement de développement."""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'
    LOG_FILE = 'logs/dev.log'
    DATABASE_URI = 'sqlite:///dev.db'

class ProductionConfig(Config):
    """Configuration pour l'environnement de production."""
    DEBUG = False
    LOG_LEVEL = 'INFO'
    LOG_FILE = 'logs/prod.log'
    DATABASE_URI = 'sqlite:///prod.db'

class TestingConfig(Config):
    """Configuration pour l'environnement de test."""
    TESTING = True
    DEBUG = True
    LOG_LEVEL = 'DEBUG'
    LOG_FILE = 'logs/test.log'
    DATABASE_URI = 'sqlite:///test.db'

# Mapping des configurations disponibles
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig
}

def get_config(config_name: str = None) -> Config:
    """
    Retourne la configuration appropriée selon l'environnement.
    
    Args:
        config_name (str): Nom de la configuration à charger.
            Si None, utilise la variable d'environnement FLASK_ENV.
    
    Returns:
        Config: Instance de configuration
    """
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    config = config_by_name.get(config_name, DevelopmentConfig)
    config.init_directories()
    return config
