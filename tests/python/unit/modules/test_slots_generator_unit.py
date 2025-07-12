from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from app.modules.slots_generator import format_duration, to_datetime


def test_to_datetime():
    """Test converting time strings to datetime objects with timezone"""
    test_date = datetime(2024, 3, 15, 12, 0)
    tz = ZoneInfo("Europe/Paris")

    # Test valid time conversions
    result = to_datetime("09:30", test_date, tz)
    assert result == datetime(2024, 3, 15, 9, 30, tzinfo=tz)

    result = to_datetime("23:59", test_date, tz)
    assert result == datetime(2024, 3, 15, 23, 59, tzinfo=tz)

    result = to_datetime("00:00", test_date, tz)
    assert result == datetime(2024, 3, 15, 0, 0, tzinfo=tz)


def test_to_datetime_invalid():
    """Test invalid time string conversions"""
    test_date = datetime(2024, 3, 15, 12, 0)
    tz = ZoneInfo("Europe/Paris")

    with pytest.raises(ValueError):
        to_datetime("25:00", test_date, tz)  # Invalid hour
    with pytest.raises(ValueError):
        to_datetime("12:60", test_date, tz)  # Invalid minute
    with pytest.raises(ValueError):
        to_datetime("12.30", test_date, tz)  # Invalid format


def test_format_duration():
    """Test formatting timedelta objects into human-readable strings"""
    # Test various durations
    assert format_duration(timedelta(hours=2, minutes=30)) == "2h30"
    assert format_duration(timedelta(hours=1, minutes=5)) == "1h05"
    assert format_duration(timedelta(hours=0, minutes=45)) == "0h45"
    assert format_duration(timedelta(hours=24, minutes=0)) == "24h00"

    # Test edge cases
    assert format_duration(timedelta(hours=0, minutes=0)) == "0h00"
    assert format_duration(timedelta(hours=0, minutes=59)) == "0h59"
    assert format_duration(timedelta(hours=1, minutes=0)) == "1h00"
    # Test negative durations (should return '0h00')
    assert format_duration(timedelta(hours=-2, minutes=-30)) == "0h00"
    assert format_duration(timedelta(hours=-1, minutes=-5)) == "0h00"
