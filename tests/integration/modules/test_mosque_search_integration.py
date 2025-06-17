import pytest
import json
from pathlib import Path
from flask import current_app
from app import create_app
from app.modules.mosque_search import (
    get_mosque_dir,
    format_country_display,
    list_countries,
    list_mosques_by_country,
    get_formatted_mosques
)

@pytest.fixture
def app():
    app = create_app()
    app.config['MOSQUE_DATA_DIR'] = Path(__file__).resolve().parent.parent.parent / "data" / "mosques_by_country"
    return app

@pytest.fixture
def sample_mosque_data(tmp_path):
    """Create sample mosque data"""
    mosque_dir = tmp_path / "mosques_by_country"
    mosque_dir.mkdir()
    
    # Create a test file for France
    france_data = [
        {
            "name": "Grande Mosquée de Paris",
            "city": "Paris",
            "address": "2bis Place du Puits de l'Ermite",
            "zipcode": "75005",
            "slug": "grande-mosquee-paris"
        }
    ]
    
    with open(mosque_dir / "france123.json", "w", encoding="utf-8") as f:
        json.dump(france_data, f)
    
    return mosque_dir

def test_list_countries_integration(app, sample_mosque_data):
    """Test integration of the list_countries function"""
    app.config['MOSQUE_DATA_DIR'] = sample_mosque_data
    
    with app.app_context():
        countries = list_countries()
        assert len(countries) == 1
        assert countries[0]["code"] == "france123"
        assert countries[0]["name"] == "FRANCE"

def test_list_mosques_by_country_integration(app, sample_mosque_data):
    """Test integration of the list_mosques_by_country function"""
    app.config['MOSQUE_DATA_DIR'] = sample_mosque_data
    
    with app.app_context():
        # Test with an existing country
        mosques = list_mosques_by_country("france123")
        assert len(mosques) == 1
        assert mosques[0]["name"] == "Grande Mosquée de Paris"
        assert mosques[0]["city"] == "Paris"
        
        # Test with an non-existing country
        empty_mosques = list_mosques_by_country("pays_inexistant")
        assert len(empty_mosques) == 0

def test_get_formatted_mosques_integration(app, sample_mosque_data):
    """Test integration of the get_formatted_mosques function"""
    app.config['MOSQUE_DATA_DIR'] = sample_mosque_data
    
    with app.test_request_context("?country=france123"):
        response = get_formatted_mosques()
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 1
        assert "text" in data[0]
        assert "Grande Mosquée de Paris" in data[0]["text"]
        assert "Paris" in data[0]["text"]
        assert "75005" in data[0]["text"] 