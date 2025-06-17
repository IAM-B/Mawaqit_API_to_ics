import pytest
from pathlib import Path
from app import create_app
from app.modules.prayer_generator import generate_prayer_ics_file

@pytest.fixture
def app():
    """Fixture pour créer une instance de l'application Flask en mode test"""
    app = create_app()
    app.config.update({
        'TESTING': True,
        'ICS_CALENDAR_NAME': 'Test Calendar',
        'ICS_CALENDAR_DESCRIPTION': 'Test Description'
    })
    return app

@pytest.fixture
def client(app):
    """Fixture pour créer un client de test Flask"""
    return app.test_client()

def test_generate_prayer_ics_file(app):
    """Test d'intégration pour la génération de fichier ICS"""
    # Test data
    masjid_id = "test-mosque"
    scope = "today"
    timezone_str = "Europe/Paris"
    padding_before = 5
    padding_after = 5
    prayer_times = {
        "fajr": "05:30",
        "dohr": "13:00",
        "asr": "16:30",
        "maghreb": "20:00",
        "icha": "21:30"
    }

    # Generate ICS file
    with app.app_context():
        output_path = generate_prayer_ics_file(
            masjid_id=masjid_id,
            scope=scope,
            timezone_str=timezone_str,
            padding_before=padding_before,
            padding_after=padding_after,
            prayer_times=prayer_times
        )

    # Check that the file has been created
    assert Path(output_path).exists()
    
    # Check the file content
    with open(output_path, 'rb') as f:
        content = f.read()
        # Check that the file contains the essential information
        assert b'BEGIN:VCALENDAR' in content
        assert b'END:VCALENDAR' in content
        assert b'BEGIN:VEVENT' in content
        assert b'END:VEVENT' in content
        assert b'Test Calendar' in content
        assert b'Test Description' in content

    # Clean up the test file
    Path(output_path).unlink(missing_ok=True) 