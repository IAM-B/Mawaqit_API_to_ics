import os
import sys

import pytest

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

# Import create_app from app.py instead of app/__init__.py
from pathlib import Path

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from main import create_app


@pytest.fixture
def app():
    app = create_app()
    app.config.update(
        {
            "TESTING": True,
            "ICS_CALENDAR_NAME": "Test Calendar",
            "ICS_CALENDAR_DESCRIPTION": "Test Description",
            "STATIC_FOLDER": "static",
            "MOSQUE_DATA_DIR": str(
                Path(__file__).parent.parent.parent / "data" / "mosques_by_country"
            ),
        }
    )
    return app
