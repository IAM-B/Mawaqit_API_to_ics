import pytest
from datetime import datetime, date
from zoneinfo import ZoneInfo

@pytest.fixture
def test_date():
    """Fixture providing a fixed test date"""
    return date(2024, 3, 15)

@pytest.fixture
def test_datetime():
    """Fixture providing a fixed test datetime"""
    return datetime(2024, 3, 15, 14, 30, 0)

@pytest.fixture
def test_timezone():
    """Fixture providing a test timezone"""
    return ZoneInfo("Europe/Paris") 