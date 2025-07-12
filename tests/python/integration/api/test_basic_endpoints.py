import os
import sys

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

import json
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
    app.config["TESTING"] = True
    app.config["MAWAQIT_BASE_URL"] = "http://example.com"
    return app


@pytest.fixture
def client(app):
    """Create a test client for the Flask app."""
    return app.test_client()


@pytest.fixture
def fake_mosque_data(tmp_path):
    mosque_dir = tmp_path / "mosques_by_country"
    mosque_dir.mkdir()
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


def test_index_page(client):
    """Test the main index page (landing page)."""
    response = client.get("/")
    assert response.status_code == 200
    assert b"Prayer Planner" in response.data
    assert b"G" in response.data  # Le bouton "Générer planning"
    assert b'id="mosque-map"' not in response.data
    assert b'id="country-select"' not in response.data


def test_planner_page(client):
    """Test the planner page avec le formulaire."""
    response = client.get("/planner")
    assert response.status_code == 200
    # Vérifier la présence du marqueur unique du template
    assert b"<!-- TEST-ID: planner-page -->" in response.data
    # Le formulaire n'a plus d'action/method car il utilise AJAX
    assert b'id="plannerForm"' in response.data
    assert b'id="mosque-map"' in response.data
    assert b'id="country-select"' in response.data
    assert b'id="mosque-select"' in response.data
    # Nouvelle structure avec configuration globale et individuelle
    assert b'name="global_padding_before"' in response.data
    assert b'name="global_padding_after"' in response.data
    assert b'name="scope"' in response.data
    # Vérifier la présence des options features
    assert b'name="include_voluntary_fasts"' in response.data
    assert b'name="show_hijri_date"' in response.data
    assert b'name="include_adhkar"' in response.data


def test_favicon(client):
    response = client.get("/favicon.ico")
    assert response.status_code == 200
    assert response.mimetype in ["image/x-icon", "image/vnd.microsoft.icon"]


def test_404_error(client):
    response = client.get("/static/doesnotexist.png")
    assert response.status_code == 404
    assert b"Page non trouv" in response.data or b"Erreur" in response.data


def test_405_error(client):
    response = client.post("/")
    assert response.status_code == 405
    assert (
        b"Erreur 405" in response.data or b"M\xc3\xa9thode non autoris" in response.data
    )


@pytest.mark.xfail(reason="Flask test client does not trigger custom 500 handler")
def test_500_error(client):
    @client.application.route("/force-error")
    def force_error():
        raise Exception("Test error")

    client.application.debug = False
    response = client.get("/force-error")
    assert response.status_code == 500
    assert (
        b"Erreur interne du serveur" in response.data
        or b"Internal Server Error" in response.data
    )


def test_get_countries_endpoint(client, fake_mosque_data):
    # Patch le dossier de données pour pointer sur le fake
    with patch(
        "app.modules.mosque_search.get_mosque_dir", return_value=fake_mosque_data
    ):
        response = client.get("/get_countries")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) > 0
        for country in data:
            assert "code" in country
            assert "name" in country
            assert isinstance(country["code"], str)
            assert isinstance(country["name"], str)


def test_get_mosques_endpoint(client, fake_mosque_data):
    with patch(
        "app.modules.mosque_search.get_mosque_dir", return_value=fake_mosque_data
    ):
        response = client.get("/get_mosques?country=algerie6641")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) > 0
        mosque = data[0]
        assert "name" in mosque
        assert "city" in mosque
        assert "text" in mosque
        assert isinstance(mosque["name"], str)
        assert isinstance(mosque["city"], str)
        assert isinstance(mosque["text"], str)
        response = client.get("/get_mosques?country=invalid")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 0


def test_edit_slot_endpoint(client):
    response = client.get("/edit_slot")
    assert response.status_code == 200
    assert b"Slot Editor" in response.data or b"Edit" in response.data
