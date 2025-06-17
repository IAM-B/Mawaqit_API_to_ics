import pytest
import json
from pathlib import Path
from unittest.mock import patch
from flask import current_app
from app import create_app

@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    app = create_app()
    app.config['TESTING'] = True
    app.config['MAWAQIT_BASE_URL'] = 'http://example.com'
    app.config['MAWAQIT_REQUEST_TIMEOUT'] = 5
    app.config['MAWAQIT_USER_AGENT'] = 'pytest-agent'
    app.config['MOSQUE_DATA_DIR'] = Path(__file__).resolve().parents[3] / "data" / "mosques_by_country"
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
            "slug": "grande-mosquee-alger"
        }
    ]
    
    with open(mosque_dir / "algerie6641.json", "w", encoding="utf-8") as f:
        json.dump(algeria_data, f)
    
    return mosque_dir

def test_get_countries(client):
    """Test the /get_countries endpoint."""
    response = client.get('/get_countries')
    assert response.status_code == 200
    data = response.get_json()
    
    assert isinstance(data, list)
    assert len(data) > 0
    # Check that each country has a code and a name
    for country in data:
        assert 'code' in country
        assert 'name' in country
        assert isinstance(country['code'], str)
        assert isinstance(country['name'], str)

def test_get_mosques(client):
    """Test the /get_mosques endpoint."""
    # Test with specific country parameter (Algeria)
    response = client.get('/get_mosques?country=algerie6641')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) > 0
    
    # Check the data structure
    mosque = data[0]
    assert 'name' in mosque
    assert 'city' in mosque
    assert 'text' in mosque
    assert isinstance(mosque['name'], str)
    assert isinstance(mosque['city'], str)
    assert isinstance(mosque['text'], str)
    
    # Test with invalid country
    response = client.get('/get_mosques?country=invalid')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 0

def test_get_mosques_with_text(client):
    """Test that mosques are returned with formatted text field."""
    response = client.get('/get_mosques?country=algerie6641')
    assert response.status_code == 200
    data = response.get_json()
    
    assert len(data) > 0
    mosque = data[0]
    assert 'text' in mosque
    text = mosque['text']
    assert mosque['name'] in text
    if mosque.get('city'):
        assert mosque['city'] in text
    if mosque.get('zipcode'):
        assert mosque['zipcode'] in text

@patch('app.modules.mawaqit_fetcher.fetch_mawaqit_data')
def test_get_prayer_times(mock_fetch, client):
    """Test the /<masjid_id>/today endpoint."""
    # Mock the response from Mawaqit with the format expected by get_prayer_times_of_the_day
    mock_fetch.return_value = {
        "times": ["03:58", "13:04", "16:54", "20:24", "22:04"],
        "shuruq": "05:47"
    }
    
    # Use specific mosque ID
    response = client.get('/grande-mosquee-alger/today')
    assert response.status_code == 200
    data = response.get_json()
    
    # Check the prayer times
    required_prayers = ['fajr', 'sunset', 'dohr', 'asr', 'maghreb', 'icha']
    for prayer in required_prayers:
        assert prayer in data
        assert isinstance(data[prayer], str)
        assert len(data[prayer]) == 5  # Format "HH:MM"

@patch('app.modules.mawaqit_fetcher.fetch_mawaqit_data')
def test_get_calendar(mock_fetch, client):
    """Test the /<masjid_id>/calendar endpoint."""
    # Mock the response from Mawaqit
    mock_fetch.return_value = {
        "calendar": {
            "1": {"1": {"fajr": "05:30", "sunrise": "07:00", "dhuhr": "12:30", "asr": "15:30", "maghrib": "18:30", "isha": "20:00"}},
            "2": {"1": {"fajr": "05:30", "sunrise": "07:00", "dhuhr": "12:30", "asr": "15:30", "maghrib": "18:30", "isha": "20:00"}},
            "3": {"1": {"fajr": "05:30", "sunrise": "07:00", "dhuhr": "12:30", "asr": "15:30", "maghrib": "18:30", "isha": "20:00"}},
            "4": {"1": {"fajr": "05:30", "sunrise": "07:00", "dhuhr": "12:30", "asr": "15:30", "maghrib": "18:30", "isha": "20:00"}},
            "5": {"1": {"fajr": "05:30", "sunrise": "07:00", "dhuhr": "12:30", "asr": "15:30", "maghrib": "18:30", "isha": "20:00"}},
            "6": {"1": {"fajr": "05:30", "sunrise": "07:00", "dhuhr": "12:30", "asr": "15:30", "maghrib": "18:30", "isha": "20:00"}},
            "7": {"1": {"fajr": "05:30", "sunrise": "07:00", "dhuhr": "12:30", "asr": "15:30", "maghrib": "18:30", "isha": "20:00"}},
            "8": {"1": {"fajr": "05:30", "sunrise": "07:00", "dhuhr": "12:30", "asr": "15:30", "maghrib": "18:30", "isha": "20:00"}},
            "9": {"1": {"fajr": "05:30", "sunrise": "07:00", "dhuhr": "12:30", "asr": "15:30", "maghrib": "18:30", "isha": "20:00"}},
            "10": {"1": {"fajr": "05:30", "sunrise": "07:00", "dhuhr": "12:30", "asr": "15:30", "maghrib": "18:30", "isha": "20:00"}},
            "11": {"1": {"fajr": "05:30", "sunrise": "07:00", "dhuhr": "12:30", "asr": "15:30", "maghrib": "18:30", "isha": "20:00"}},
            "12": {"1": {"fajr": "05:30", "sunrise": "07:00", "dhuhr": "12:30", "asr": "15:30", "maghrib": "18:30", "isha": "20:00"}}
        }
    }
    # Use specific mosque ID
    response = client.get('/grande-mosquee-alger/calendar')
    assert response.status_code == 200
    data = response.get_json()
    
    # Check the data structure
    assert isinstance(data, dict)
    assert 'calendar' in data
    calendar = data['calendar']
    assert isinstance(calendar, dict)
    
    # Check that there are data for each month
    assert len(calendar) == 12
    for month in range(1, 13):
        assert str(month) in calendar
        month_data = calendar[str(month)]
        assert isinstance(month_data, dict)
        assert len(month_data) > 0  # At least one day in the month 