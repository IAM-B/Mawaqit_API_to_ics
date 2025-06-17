import pytest
from datetime import datetime, time
from app.modules.slot_utils import round_down_to_hour, round_up_to_hour, parse_time_str

def test_round_down_to_hour():
    """Test rounding datetime down to the current hour"""
    # Test various times
    assert round_down_to_hour(datetime(2024, 3, 15, 14, 30, 45)) == datetime(2024, 3, 15, 14, 0, 0)
    assert round_down_to_hour(datetime(2024, 3, 15, 14, 0, 0)) == datetime(2024, 3, 15, 14, 0, 0)
    assert round_down_to_hour(datetime(2024, 3, 15, 14, 59, 59)) == datetime(2024, 3, 15, 14, 0, 0)
    assert round_down_to_hour(datetime(2024, 3, 15, 0, 0, 0)) == datetime(2024, 3, 15, 0, 0, 0)
    assert round_down_to_hour(datetime(2024, 3, 15, 23, 59, 59)) == datetime(2024, 3, 15, 23, 0, 0)

def test_round_up_to_hour():
    """Test rounding datetime up to the next hour"""
    # Test various times
    assert round_up_to_hour(datetime(2024, 3, 15, 14, 30, 45)) == datetime(2024, 3, 15, 15, 0, 0)
    assert round_up_to_hour(datetime(2024, 3, 15, 14, 0, 0)) == datetime(2024, 3, 15, 14, 0, 0)
    assert round_up_to_hour(datetime(2024, 3, 15, 14, 59, 59)) == datetime(2024, 3, 15, 15, 0, 0)
    assert round_up_to_hour(datetime(2024, 3, 15, 0, 0, 0)) == datetime(2024, 3, 15, 0, 0, 0)
    assert round_up_to_hour(datetime(2024, 3, 15, 23, 59, 59)) == datetime(2024, 3, 16, 0, 0, 0)

def test_parse_time_str():
    """Test parsing time strings into datetime objects"""
    # Test ISO format
    iso_time = "2024-03-15T14:30:00"
    assert parse_time_str(iso_time) == datetime(2024, 3, 15, 14, 30)
    
    # Test simple time format
    simple_time = "14:30"
    result = parse_time_str(simple_time)
    assert result.date() == datetime.today().date()
    assert result.hour == 14
    assert result.minute == 30
    
    # Test invalid formats
    with pytest.raises(ValueError):
        parse_time_str("invalid")
    with pytest.raises(ValueError):
        parse_time_str("25:00")
    with pytest.raises(ValueError):
        parse_time_str("12:60") 