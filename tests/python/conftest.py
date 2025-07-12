"""
Configuration pytest pour les tests Python
Gère les tests unitaires et d'intégration Python
"""

import sys
from pathlib import Path

import pytest

# Ajouter le répertoire racine du projet au path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))


# Configuration spécifique pour les tests Python
@pytest.fixture(scope="session")
def python_test_config():
    """Configuration globale pour les tests Python"""
    return {
        "app_path": "app",
        "modules_path": "app/modules",
        "controllers_path": "app/controllers",
        "views_path": "app/views",
        "utils_path": "app/utils",
    }


# Marqueurs pytest pour les tests Python
def pytest_configure(config):
    """Configuration des marqueurs pytest pour les tests Python"""
    config.addinivalue_line("markers", "python_unit: marque les tests unitaires Python")
    config.addinivalue_line(
        "markers", "python_integration: marque les tests d'intégration Python"
    )
    config.addinivalue_line("markers", "api: marque les tests d'API")
    config.addinivalue_line("markers", "database: marque les tests de base de données")
