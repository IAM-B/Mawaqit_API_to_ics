import pytest
from datetime import datetime, time
from app.modules.slot_utils import round_down_to_hour, round_up_to_hour, parse_time_str, adjust_slots_rounding

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

def test_adjust_slots_rounding():
    """Test adjusting time slots by rounding, respecting prayer-adjacent slots"""
    # Test data based on the ICS files
    slots = [
        # Slot after Fajr (should not be rounded)
        {'start': '04:33', 'end': '06:00'},
        # Intermediate slot (should be rounded)
        {'start': '06:00', 'end': '07:00'},
        # Slot before Dohr (should not be rounded)
        {'start': '11:00', 'end': '12:54'},
        # Intermediate slot (should be rounded)
        {'start': '13:39', 'end': '15:00'},
        # Slot before Asr (should not be rounded)
        {'start': '15:00', 'end': '16:44'}
    ]
    
    # Indices of slots adjacent to prayers (0: after Fajr, 2: before Dohr, 4: before Asr)
    prayer_adjacent_slots = [0, 2, 4]
    
    adjusted = adjust_slots_rounding(slots, prayer_adjacent_slots)
    
    # Verify results
    assert len(adjusted) == 5  # All slots should be valid
    
    # Check prayer-adjacent slots (should not be rounded)
    assert adjusted[0]['start'].hour == 4 and adjusted[0]['start'].minute == 33  # After Fajr
    assert adjusted[2]['end'].hour == 12 and adjusted[2]['end'].minute == 54    # Before Dohr
    assert adjusted[4]['end'].hour == 16 and adjusted[4]['end'].minute == 44    # Before Asr
    
    # Check intermediate slots (should be rounded)
    assert adjusted[1]['start'].hour == 6 and adjusted[1]['start'].minute == 0  # Rounded
    assert adjusted[3]['start'].hour == 14 and adjusted[3]['start'].minute == 0 # Rounded up 