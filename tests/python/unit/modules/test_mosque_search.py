import os
import sys

import pytest

sys.path.insert(
    0,
    os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ),
)

from pathlib import Path

# Import create_app from app.py instead of app/__init__.py
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from main import create_app
from app.modules.mosque_search import format_country_display, get_mosque_dir


@pytest.fixture
def app():
    app = create_app()
    app.config["MOSQUE_DATA_DIR"] = (
        Path(__file__).resolve().parent.parent.parent / "data" / "mosques_by_country"
    )
    return app


def test_get_mosque_dir(app):
    """Test getting mosque directory path"""
    with app.app_context():
        # Test with default config
        result = get_mosque_dir()
        assert isinstance(result, Path)
        assert result.name == "mosques_by_country"
        assert result.parent.name == "data"


def test_format_country_display():
    """Test formatting country display names"""
    # Test with valid country codes
    assert format_country_display("allemagne1313.json") == "ALLEMAGNE"
    assert format_country_display("espagne749.json") == "ESPAGNE"
    assert format_country_display("maroc1289.json") == "MAROC"
    
    # Test with invalid input
    assert format_country_display("") == ""
    assert format_country_display(None) == "" 
