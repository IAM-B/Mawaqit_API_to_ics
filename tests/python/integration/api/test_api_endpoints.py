import os
import sys

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

import json
from pathlib import Path
from unittest.mock import patch

import pytest

# Import create_app from app.py instead of app/__init__.py
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from main import create_app


@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    app = create_app()
    app.config.update(
        {
            "TESTING": True,
            "MAWAQIT_BASE_URL": "http://example.com",
            "MAWAQIT_REQUEST_TIMEOUT": 5,
            "MAWAQIT_USER_AGENT": "pytest-agent",
            "MOSQUE_DATA_DIR": str(
                Path(__file__).resolve().parents[3] / "data" / "mosques_by_country"
            ),
        }
    )
    return app


@pytest.fixture
def client(app):
    """Create a test client for the Flask app."""
    return app.test_client()


@pytest.fixture
def sample_mosque_data(tmp_path):
    """Create sample mosque data for testing."""
    mosque_dir = tmp_path / "mosques_by_country"
    mosque_dir.mkdir(parents=True)
    
    # Create sample data for Algeria
    algeria_data = [
        {
            "name": "Grande Mosquée d'Alger",
            "city": "Alger",
            "address": "Boulevard des Martyrs",
            "zipcode": "16000",
            "slug": "grande-mosquee-alger",
        }
    ]
    
    with open(mosque_dir / "algerie6641.json", "w", encoding="utf-8") as f:
        json.dump(algeria_data, f)
    
    return mosque_dir


def test_get_countries(client, sample_mosque_data):
    """Test the /get_countries endpoint."""
    # Patch le dossier de données pour pointer sur les données de test
    with patch(
        "app.modules.mosque_search.get_mosque_dir", return_value=sample_mosque_data
    ):
        response = client.get("/get_countries")
        assert response.status_code == 200
        data = response.get_json()
        
        assert isinstance(data, list)
        assert len(data) > 0
        # Check that each country has a code and a name
        for country in data:
            assert "code" in country
            assert "name" in country
            assert isinstance(country["code"], str)
            assert isinstance(country["name"], str)


def test_get_mosques(client, sample_mosque_data):
    """Test the /get_mosques endpoint."""
    # Patch le dossier de données pour pointer sur les données de test
    with patch(
        "app.modules.mosque_search.get_mosque_dir", return_value=sample_mosque_data
    ):
        # Test with specific country parameter (Algeria)
        response = client.get("/get_mosques?country=algerie6641")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check the data structure
        mosque = data[0]
        assert "name" in mosque
        assert "city" in mosque
        assert "text" in mosque
        assert isinstance(mosque["name"], str)
        assert isinstance(mosque["city"], str)
        assert isinstance(mosque["text"], str)
        
        # Test with invalid country
        response = client.get("/get_mosques?country=invalid")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 0


def test_get_mosques_with_text(client, sample_mosque_data):
    """Test that mosques are returned with formatted text field."""
    # Patch le dossier de données pour pointer sur les données de test
    with patch(
        "app.modules.mosque_search.get_mosque_dir", return_value=sample_mosque_data
    ):
        response = client.get("/get_mosques?country=algerie6641")
        assert response.status_code == 200
        data = response.get_json()
        
        assert len(data) > 0
        mosque = data[0]
        assert "text" in mosque
        text = mosque["text"]
        assert mosque["name"] in text
        if mosque.get("city"):
            assert mosque["city"] in text
        if mosque.get("zipcode"):
            assert mosque["zipcode"] in text


def test_planner_post_endpoint(client):
    """Test the POST /planner endpoint."""
    # Test data for planning request
    data = {
        "masjid_id": "grande-mosquee-alger",
        "scope": "today",
        "padding_before": 10,
        "padding_after": 15,
        "mosque_name": "Grande Mosquée d'Alger",
        "mosque_address": "Boulevard des Martyrs, Alger",
        "mosque_lat": "36.7538",
        "mosque_lng": "3.0588",
    }
    
    with patch("app.views.planner_view.fetch_mosques_data") as mock_fetch:
        # Mock the response from fetch_mosques_data
        mock_fetch.return_value = (
            {
                "fajr": "05:00",
                "dohr": "13:00",
                "asr": "16:30",
                "maghreb": "20:00",
                "icha": "21:30",
            },
            "Africa/Algiers",
        )
        
        response = client.post("/planner", data=data)
        assert response.status_code == 200
        # Vérifier que la réponse contient le contenu du planning
        assert (
            b"TEST-ID: planner-page" in response.data
            or b"Prayer Planner" in response.data
        )


def test_planner_post_invalid_data(client):
    """Test the POST /planner endpoint with invalid data."""
    # Test with missing required fields
    data = {"scope": "today", "padding_before": 10, "padding_after": 15}
    
    response = client.post("/planner", data=data)
    assert response.status_code == 200  # Should still return 200 but with error message
    assert b"error" in response.data.lower() or b"erreur" in response.data.lower()


def test_edit_slot_get(client):
    """Test the GET /edit_slot endpoint."""
    response = client.get("/edit_slot")
    assert response.status_code == 200
    # Vérifier que la page contient les éléments de l'éditeur de créneaux
    assert b"Slot Editor" in response.data or b"Edit" in response.data


def test_edit_slot_post(client):
    """Test the POST /edit_slot endpoint."""
    data = {"action": "test", "data": "test_data"}
    
    response = client.post("/edit_slot", data=data)
    assert response.status_code == 200
    # Accepter la réponse JSON actuelle
    assert b"Slot POST not implemented" in response.data 
