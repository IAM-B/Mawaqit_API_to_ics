import pytest
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo
from app.modules.slots_generator import (
    to_datetime,
    format_duration,
    generate_slot_ics_file,
    generate_slots_by_scope
)

def test_to_datetime():
    """Test converting time string to datetime with timezone"""
    base_date = datetime(2024, 1, 1, 12, 0)
    tz = ZoneInfo("Europe/Paris")
    
    # Test valid time conversion
    result = to_datetime("14:30", base_date, tz)
    assert result == datetime(2024, 1, 1, 14, 30, tzinfo=tz)
    
    # Test midnight
    result = to_datetime("00:00", base_date, tz)
    assert result == datetime(2024, 1, 1, 0, 0, tzinfo=tz)
    
    # Test end of day
    result = to_datetime("23:59", base_date, tz)
    assert result == datetime(2024, 1, 1, 23, 59, tzinfo=tz)

def test_format_duration():
    """Test formatting timedelta into human-readable duration"""
    # Test hours and minutes
    assert format_duration(timedelta(hours=2, minutes=30)) == "2h30"
    
    # Test only hours
    assert format_duration(timedelta(hours=3)) == "3h00"
    
    # Test only minutes
    assert format_duration(timedelta(minutes=45)) == "0h45"
    
    # Test zero duration
    assert format_duration(timedelta()) == "0h00"
    
    # Test negative duration
    assert format_duration(timedelta(minutes=-30)) == "0h00"

def test_generate_slot_ics_file(tmp_path, app):
    """Test generating ICS file for available slots between prayers"""
    with app.app_context():
        # Mock prayer times
        prayer_times = {
            "fajr": "05:30",
            "dohr": "12:30",
            "asr": "15:30",
            "maghreb": "18:30",
            "icha": "20:30"
        }
        
        base_date = datetime(2024, 1, 1)
        output_file = tmp_path / "test_slots.ics"
        
        # Generate ICS file
        result_path = generate_slot_ics_file(
            prayer_times=prayer_times,
            base_date=base_date,
            filename=str(output_file),
            timezone_str="Europe/Paris",
            padding_before=15,
            padding_after=15
        )
        
        # Verify file was created
        assert Path(result_path).exists()
        
        # Read and verify content
        with open(result_path, "rb") as f:
            content = f.read()
            assert b"BEGIN:VCALENDAR" in content
            assert b"END:VCALENDAR" in content
            assert b"Availability" in content
            assert b"Free slot between" in content

def test_generate_slots_by_scope_today(tmp_path, app):
    """Test generating slots ICS file for today"""
    with app.app_context():
        # Mock prayer times for today
        prayer_times = {
            "fajr": "05:30",
            "dohr": "12:30",
            "asr": "15:30",
            "maghreb": "18:30",
            "icha": "20:30"
        }
        
        # Generate ICS file
        output_path = generate_slots_by_scope(
            masjid_id="test-mosque",
            scope="today",
            timezone_str="Europe/Paris",
            padding_before=15,
            padding_after=30,
            prayer_times=prayer_times
        )
        
        # Verify file was created
        assert Path(output_path).exists()
        
        # Read and verify content
        with open(output_path, "rb") as f:
            content = f.read()
            assert b"BEGIN:VCALENDAR" in content
            assert b"END:VCALENDAR" in content
            assert b"Availability" in content

def test_generate_slots_by_scope_month(tmp_path, app):
    """Test generating slots ICS file for a month"""
    with app.app_context():
        # Mock prayer times for a month (first 3 days)
        prayer_times = [
            {
                "fajr": "05:30",
                "dohr": "12:30",
                "asr": "15:30",
                "maghreb": "18:30",
                "icha": "20:30"
            },
            {
                "fajr": "05:31",
                "dohr": "12:31",
                "asr": "15:31",
                "maghreb": "18:31",
                "icha": "20:31"
            },
            {
                "fajr": "05:32",
                "dohr": "12:32",
                "asr": "15:32",
                "maghreb": "18:32",
                "icha": "20:32"
            }
        ]
        
        # Generate ICS file
        output_path = generate_slots_by_scope(
            masjid_id="test-mosque",
            scope="month",
            timezone_str="Europe/Paris",
            padding_before=15,
            padding_after=30,
            prayer_times=prayer_times
        )
        
        # Verify file was created
        assert Path(output_path).exists()
        
        # Read and verify content
        with open(output_path, "rb") as f:
            content = f.read()
            assert b"BEGIN:VCALENDAR" in content
            assert b"END:VCALENDAR" in content
            assert b"Availability" in content

def test_generate_slots_by_scope_year(tmp_path, app):
    """Test generating slots ICS file for a year"""
    with app.app_context():
        # Mock prayer times for a year (first month, first 3 days)
        prayer_times = {
            "1": ["05:30", "07:00", "12:30", "15:30", "18:30", "20:30"],
            "2": ["05:31", "07:01", "12:31", "15:31", "18:31", "20:31"],
            "3": ["05:32", "07:02", "12:32", "15:32", "18:32", "20:32"]
        }
        
        # Generate ICS file
        output_path = generate_slots_by_scope(
            masjid_id="test-mosque",
            scope="year",
            timezone_str="Europe/Paris",
            padding_before=15,
            padding_after=30,
            prayer_times=[prayer_times]  # List of months
        )
        
        # Verify file was created
        assert Path(output_path).exists()
        
        # Read and verify content
        with open(output_path, "rb") as f:
            content = f.read()
            assert b"BEGIN:VCALENDAR" in content
            assert b"END:VCALENDAR" in content
            assert b"Availability" in content

def test_generate_slots_by_scope_invalid_scope(tmp_path, app):
    """Test generating slots ICS file with invalid scope"""
    with app.app_context():
        with pytest.raises(ValueError, match="Scope must be 'today', 'month' or 'year'"):
            generate_slots_by_scope(
                masjid_id="test-mosque",
                scope="invalid",
                timezone_str="Europe/Paris",
                padding_before=15,
                padding_after=30,
                prayer_times={}
            ) 