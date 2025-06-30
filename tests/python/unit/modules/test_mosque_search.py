import pytest
from pathlib import Path
from flask import current_app
from app import create_app
from app.modules.mosque_search import get_mosque_dir, format_country_display

@pytest.fixture
def app():
    app = create_app()
    app.config['MOSQUE_DATA_DIR'] = Path(__file__).resolve().parent.parent.parent / "data" / "mosques_by_country"
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