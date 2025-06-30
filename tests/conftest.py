"""
Configuration pytest globale
Gère les tests Python et JavaScript
"""

import pytest
import sys
from pathlib import Path
from datetime import datetime, date
from zoneinfo import ZoneInfo

# Ajouter le répertoire racine du projet au path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Configuration globale
@pytest.fixture(scope="session")
def test_config():
    """Configuration globale pour tous les tests"""
    return {
        "project_root": str(project_root),
        "python_tests": str(project_root / "tests" / "python"),
        "js_tests": str(project_root / "tests" / "js"),
        "e2e_tests": str(project_root / "tests" / "e2e"),
        "data_tests": str(project_root / "tests" / "data")
    }

# Marqueurs pytest globaux
def pytest_configure(config):
    """Configuration des marqueurs pytest globaux"""
    config.addinivalue_line(
        "markers", "python: marque les tests Python"
    )
    config.addinivalue_line(
        "markers", "javascript: marque les tests JavaScript"
    )
    config.addinivalue_line(
        "markers", "e2e: marque les tests end-to-end"
    )
    config.addinivalue_line(
        "markers", "slow: marque les tests lents"
    )

@pytest.fixture
def test_date():
    """Fixture providing a fixed test date"""
    return date(2024, 3, 15)

@pytest.fixture
def test_datetime():
    """Fixture providing a fixed test datetime"""
    return datetime(2024, 3, 15, 14, 30, 0)

@pytest.fixture
def test_timezone():
    """Fixture providing a test timezone"""
    return ZoneInfo("Europe/Paris") 