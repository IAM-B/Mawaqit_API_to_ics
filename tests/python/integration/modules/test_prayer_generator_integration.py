from datetime import date, datetime, time
from pathlib import Path

import pytest

from app.modules.prayer_generator import generate_prayer_ics_file, parse_time_str


def test_parse_time_str_valid():
    """Test parsing valid time strings"""
    test_date = date(2024, 1, 1)

    # Test valid time formats
    assert parse_time_str("12:00", test_date) == datetime(2024, 1, 1, 12, 0)
    assert parse_time_str("00:00", test_date) == datetime(2024, 1, 1, 0, 0)
    assert parse_time_str("23:59", test_date) == datetime(2024, 1, 1, 23, 59)

    # Test without date (should use today)
    today = datetime.now().date()
    result = parse_time_str("12:00")
    assert result.date() == today
    assert result.time() == time(12, 0)


def test_parse_time_str_invalid():
    """Test parsing invalid time strings"""
    test_date = date(2024, 1, 1)

    # Test invalid formats
    with pytest.raises(ValueError):
        parse_time_str("invalid", test_date)

    with pytest.raises(ValueError):
        parse_time_str("25:00", test_date)  # Invalid hour

    with pytest.raises(ValueError):
        parse_time_str("12:60", test_date)  # Invalid minute

    with pytest.raises(ValueError):
        parse_time_str("", test_date)  # Empty string

    with pytest.raises(ValueError):
        parse_time_str(None, test_date)  # None value


def test_generate_prayer_ics_file_today(tmp_path, app):
    """Test generating ICS file for today"""
    with app.app_context():
        # Mock prayer times for today
        prayer_times = {
            "fajr": "05:30",
            "dohr": "12:30",
            "asr": "15:30",
            "maghreb": "18:30",
            "icha": "20:30",
        }

        # Generate ICS file
        output_path = generate_prayer_ics_file(
            masjid_id="test-mosque",
            scope="today",
            timezone_str="Europe/Paris",
            padding_before=15,
            padding_after=30,
            prayer_times=prayer_times,
        )

        # Verify file was created
        assert Path(output_path).exists()

        # Read and verify content
        with open(output_path, "rb") as f:
            content = f.read()
            assert b"BEGIN:VCALENDAR" in content
            assert b"END:VCALENDAR" in content
            assert b"Fajr" in content
            assert b"Dohr" in content
            assert b"Asr" in content
            assert b"Maghreb" in content
            assert b"Icha" in content


def test_generate_prayer_ics_file_month(tmp_path, app):
    """Test generating ICS file for a month"""
    with app.app_context():
        # Mock prayer times for a month (first 3 days)
        prayer_times = [
            {
                "fajr": "05:30",
                "dohr": "12:30",
                "asr": "15:30",
                "maghreb": "18:30",
                "icha": "20:30",
            },
            {
                "fajr": "05:31",
                "dohr": "12:31",
                "asr": "15:31",
                "maghreb": "18:31",
                "icha": "20:31",
            },
            {
                "fajr": "05:32",
                "dohr": "12:32",
                "asr": "15:32",
                "maghreb": "18:32",
                "icha": "20:32",
            },
        ]

        # Generate ICS file
        output_path = generate_prayer_ics_file(
            masjid_id="test-mosque",
            scope="month",
            timezone_str="Europe/Paris",
            padding_before=15,
            padding_after=30,
            prayer_times=prayer_times,
        )

        # Verify file was created
        assert Path(output_path).exists()

        # Read and verify content
        with open(output_path, "rb") as f:
            content = f.read()
            assert b"BEGIN:VCALENDAR" in content
            assert b"END:VCALENDAR" in content
            # Verify first day times
            assert b"05:30" in content
            assert b"12:30" in content
            # Verify second day times
            assert b"05:31" in content
            assert b"12:31" in content


def test_generate_prayer_ics_file_year(tmp_path, app):
    """Test generating ICS file for a year"""
    with app.app_context():
        # Mock prayer times for a year (first month, first 3 days)
        prayer_times = {
            "1": ["05:30", "07:00", "12:30", "15:30", "18:30", "20:30"],
            "2": ["05:31", "07:01", "12:31", "15:31", "18:31", "20:31"],
            "3": ["05:32", "07:02", "12:32", "15:32", "18:32", "20:32"],
        }

        # Generate ICS file
        output_path = generate_prayer_ics_file(
            masjid_id="test-mosque",
            scope="year",
            timezone_str="Europe/Paris",
            padding_before=15,
            padding_after=30,
            prayer_times=[prayer_times],  # List of months
        )

        # Verify file was created
        assert Path(output_path).exists()

        # Read and verify content
        with open(output_path, "rb") as f:
            content = f.read()
            assert b"BEGIN:VCALENDAR" in content
            assert b"END:VCALENDAR" in content
            # Verify first day times
            assert b"05:30" in content
            assert b"12:30" in content
            # Verify second day times
            assert b"05:31" in content
            assert b"12:31" in content


def test_generate_prayer_ics_file_invalid_scope(tmp_path, app):
    """Test generating ICS file with invalid scope"""
    with app.app_context():
        with pytest.raises(
            ValueError, match="Scope must be 'today', 'month', or 'year'"
        ):
            generate_prayer_ics_file(
                masjid_id="test-mosque",
                scope="invalid",
                timezone_str="Europe/Paris",
                padding_before=15,
                padding_after=30,
                prayer_times={},
            )
