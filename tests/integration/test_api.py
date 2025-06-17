import pytest
from app import create_app
from unittest.mock import patch

@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    app = create_app()
    app.config.update({
        'TESTING': True,
        'ICS_CALENDAR_NAME': 'Test Calendar',
        'ICS_CALENDAR_DESCRIPTION': 'Test Description',
        'MAWAQIT_BASE_URL': 'https://mawaqit.net',
        'MAWAQIT_REQUEST_TIMEOUT': 10,
        'MAWAQIT_USER_AGENT': 'Mozilla/5.0 (Test)',
        'MOSQUE_DATA_DIR': 'data/mosques_by_country'
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
    assert b'Prayer Planner' in response.data

def test_generate_ics_endpoint(client):
    """Test the ICS generation endpoint"""
    # Test data
    test_data = {
        'masjid_id': '1-byt-llh-paris-75000-france',
        'scope': 'today',
        'timezone': 'Africa/Algiers',
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
        'masjid_id': '1-byt-llh-paris-75000-france',
        'scope': 'invalid_scope',  # Invalid scope
        'timezone': 'Invalid/Timezone',  # Invalid timezone
        'padding_before': -1,  # Negative padding
        'padding_after': -1,
        'prayer_times': {}
    }
    response = client.post('/generate-ics', json=invalid_data)
    assert response.status_code == 400

@patch('app.modules.mawaqit_fetcher.fetch_mosques_data')
@patch('app.modules.mawaqit_fetcher.fetch_mawaqit_data')
def test_planner_post_with_mocked_mosque(mock_fetch_mawaqit, mock_fetch_mosques, client):
    # Simulate the response of fetch_mawaqit_data
    mock_fetch_mawaqit.return_value = {
        "times": ["05:00", "13:00", "16:30", "20:00", "21:30"],
        "shuruq": "06:00",
        "timezone": "Africa/Algiers"
    }
    
    # Simulate the response of fetch_mosques_data
    mock_fetch_mosques.return_value = (
        {
            "fajr": "05:00",
            "dohr": "13:00",
            "asr": "16:30",
            "maghreb": "20:00",
            "icha": "21:30"
        },
        "Africa/Algiers"
    )
    
    data = {
        "masjid_id": "1-byt-llh-paris-75000-france",
        "scope": "today",
        "padding_before": 10,
        "padding_after": 15
    }
    response = client.post("/planner", data=data)
    assert response.status_code == 200
    assert b"Emploi du temps synchronis" in response.data 