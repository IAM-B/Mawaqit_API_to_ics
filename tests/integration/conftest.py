import pytest
from app import create_app

@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        'TESTING': True,
        'ICS_CALENDAR_NAME': 'Test Calendar',
        'ICS_CALENDAR_DESCRIPTION': 'Test Description',
        'STATIC_FOLDER': 'static'
    })
    return app 