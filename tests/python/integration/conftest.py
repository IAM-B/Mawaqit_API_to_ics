import pytest
from app import create_app
from pathlib import Path

@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        'TESTING': True,
        'ICS_CALENDAR_NAME': 'Test Calendar',
        'ICS_CALENDAR_DESCRIPTION': 'Test Description',
        'STATIC_FOLDER': 'static',
        'MOSQUE_DATA_DIR': str(Path(__file__).parent.parent.parent / 'data' / 'mosques_by_country')
    })
    return app 