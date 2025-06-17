import pytest
from app import create_app

@pytest.fixture
def app():
    """Fixture to create a Flask application instance in test mode"""
    app = create_app()
    app.config.update({
        'TESTING': True,
        'ICS_CALENDAR_NAME': 'Test Calendar',
        'ICS_CALENDAR_DESCRIPTION': 'Test Description'
    })
    return app

@pytest.fixture
def client(app):
    """Fixture to create a test Flask client"""
    return app.test_client()

def test_home_page(client):
    """Test the home page"""
    response = client.get('/')
    assert response.status_code == 200
    assert b'Welcome' in response.data

def test_generate_ics_endpoint(client):
    """Test the ICS generation endpoint"""
    # Test data
    test_data = {
        'masjid_id': 'test-mosque',
        'scope': 'today',
        'timezone': 'Europe/Paris',
        'padding_before': 5,
        'padding_after': 5,
        'prayer_times': {
            'fajr': '05:30',
            'dohr': '13:00',
            'asr': '16:30',
            'maghreb': '20:00',
            'icha': '21:30'
        }
    }

    # Test ICS generation
    response = client.post('/generate-ics', json=test_data)
    
    # If the test fails, display the response content
    if response.status_code != 200:
        print("\nErreur API:")
        print(f"Status Code: {response.status_code}")
        print("Response Data:", response.get_json())
    
    assert response.status_code == 200
    assert response.headers['Content-Type'].startswith('text/calendar')
    assert response.data.startswith(b'BEGIN:VCALENDAR')
    assert response.data.endswith(b'END:VCALENDAR\r\n')

def test_invalid_request(client):
    """Test invalid requests handling"""
    # Test with missing data
    response = client.post('/generate-ics', json={})
    assert response.status_code == 400

    # Test with invalid data
    invalid_data = {
        'masjid_id': 'test-mosque',
        'scope': 'invalid_scope',  # Invalid scope
        'timezone': 'Invalid/Timezone',  # Invalid timezone
        'padding_before': -1,  # Negative padding
        'padding_after': -1,
        'prayer_times': {}
    }
    response = client.post('/generate-ics', json=invalid_data)
    assert response.status_code == 400 