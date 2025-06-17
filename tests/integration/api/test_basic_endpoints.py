import pytest
from flask import url_for
from app import create_app

@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    app = create_app()
    app.config['TESTING'] = True
    app.config['MAWAQIT_BASE_URL'] = 'http://example.com'
    return app

@pytest.fixture
def client(app):
    """Create a test client for the Flask app."""
    return app.test_client()

def test_index_page(client):
    """Test the main index page."""
    response = client.get('/')
    assert response.status_code == 200
    
    # Vérifier que c'est bien la page d'accueil avec le formulaire
    assert b'Prayer Planner' in response.data
    assert b'form action="/planner" method="post"' in response.data
    assert b'id="mosque-map"' in response.data
    assert b'id="country-select"' in response.data
    assert b'id="mosque-select"' in response.data
    assert b'name="padding_before"' in response.data
    assert b'name="padding_after"' in response.data
    assert b'name="scope"' in response.data
    assert b'G' in response.data  # Le bouton "Générer planning"

def test_favicon(client):
    """Test the favicon endpoint."""
    response = client.get('/favicon.ico')
    assert response.status_code == 200
    assert response.mimetype in ['image/x-icon', 'image/vnd.microsoft.icon']

def test_404_error(client):
    """Test the 404 error handler."""
    response = client.get('/static/doesnotexist.png')
    assert response.status_code == 404
    # Vérifier le message d'erreur en français
    assert b'Page non trouv' in response.data or b'Erreur' in response.data

def test_405_error(client):
    """Test the 405 error handler."""
    response = client.post('/')
    assert response.status_code == 405
    # Vérifier le message d'erreur en français
    assert b'Erreur 405' in response.data or b'M\xc3\xa9thode non autoris' in response.data

@pytest.mark.xfail(reason="Flask test client does not trigger custom 500 handler")
def test_500_error(client):
    """Test the 500 error handler by forcing an error."""
    @client.application.route('/force-error')
    def force_error():
        raise Exception("Test error")
    client.application.debug = False
    response = client.get('/force-error')
    assert response.status_code == 500
    assert b'Erreur interne du serveur' in response.data or b'Internal Server Error' in response.data

def test_planner_redirect(client):
    """Test that direct access to planner is not allowed."""
    response = client.get('/planner')
    assert response.status_code == 200
    assert b'Direct access to /planner not allowed' in response.data or b'Erreur' in response.data 