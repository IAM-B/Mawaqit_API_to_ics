from datetime import date, datetime

import pytest

from app.modules.prayer_generator import parse_time_str


def test_parse_time_str_valid():
    """Test parsing valid time strings"""
    test_date = date(2024, 3, 15)

    # Test valid time formats
    assert parse_time_str("09:30", test_date) == datetime(2024, 3, 15, 9, 30)
    assert parse_time_str("23:59", test_date) == datetime(2024, 3, 15, 23, 59)
    assert parse_time_str("00:00", test_date) == datetime(2024, 3, 15, 0, 0)

    # Test with default date (today)
    today = date.today()
    result = parse_time_str("12:00")
    assert result.date() == today
    assert result.hour == 12
    assert result.minute == 0


def test_parse_time_str_invalid():
    """Test parsing invalid time strings"""
    test_date = date(2024, 3, 15)

    # Test invalid formats
    with pytest.raises(ValueError):
        parse_time_str("25:00", test_date)  # Invalid hour
    with pytest.raises(ValueError):
        parse_time_str("12:60", test_date)  # Invalid minute
    with pytest.raises(ValueError):
        parse_time_str("12.30", test_date)  # Invalid separator
    with pytest.raises(ValueError):
        parse_time_str("", test_date)  # Empty string
    with pytest.raises(ValueError):
        parse_time_str(None, test_date)  # None value
    with pytest.raises(ValueError):
        parse_time_str(123, test_date)  # Non-string value
