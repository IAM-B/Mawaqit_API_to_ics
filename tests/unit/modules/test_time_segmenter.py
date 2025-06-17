import pytest
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from app.modules.time_segmenter import segment_available_time

def test_segment_available_time_basic():
    """Test basic time segmenter"""
    prayer_times = {
        "fajr": "08:00",
        "dohr": "09:00",
        "asr": "10:00",
        "maghreb": "11:00",
        "icha": "12:00"
    }
    segments = segment_available_time(prayer_times, "Europe/Paris", 0, 0)
    assert isinstance(segments, list)
    assert len(segments) == 4
    assert segments[0]["start"] == "08:00"
    assert segments[0]["end"] == "09:00"
    assert segments[-1]["start"] == "11:00"
    assert segments[-1]["end"] == "12:00"

def test_segment_available_time_with_padding():
    """Test with padding before and after"""
    prayer_times = {
        "fajr": "08:00",
        "dohr": "09:00",
        "asr": "10:00"
    }
    segments = segment_available_time(prayer_times, "Europe/Paris", 10, 5)
    assert len(segments) == 2
    # Le premier segment commence à 08:10 et finit à 08:55
    assert segments[0]["start"] == "08:10"
    assert segments[0]["end"] == "08:55"
    # Le second segment commence à 09:10 et finit à 09:55
    assert segments[1]["start"] == "09:10"
    assert segments[1]["end"] == "09:55"

def test_segment_available_time_different_timezone():
    """Test with different timezone"""
    prayer_times = {
        "fajr": "05:00",
        "dohr": "13:00",
        "asr": "16:00"
    }
    segments = segment_available_time(prayer_times, "Europe/Paris", 0, 0)
    assert len(segments) == 2
    assert segments[0]["start"] == "05:00"
    assert segments[0]["end"] == "13:00"
    assert segments[1]["start"] == "13:00"
    assert segments[1]["end"] == "16:00"

def test_segment_available_time_close_prayers():
    """Test with close prayers (less padding)"""
    prayer_times = {
        "fajr": "08:00",
        "dohr": "08:05",
        "asr": "08:10"
    }
    segments = segment_available_time(prayer_times, "Europe/Paris", 2, 2)
    # Les segments sont très courts
    assert len(segments) == 2
    assert segments[0]["start"] == "08:02"
    assert segments[0]["end"] == "08:03"
    assert segments[1]["start"] == "08:07"
    assert segments[1]["end"] == "08:08"

def test_segment_available_time_edge_cases():
    """Test edge cases (not enough prayers, bad format, etc.)"""
    # Moins de 2 prières
    prayer_times = {"fajr": "08:00"}
    segments = segment_available_time(prayer_times, "Europe/Paris", 0, 0)
    assert segments == []
    # Mauvais format d'entrée
    segments = segment_available_time(["08:00", "09:00"], "Europe/Paris", 0, 0)
    assert segments == []
    # Mauvais format d'heure
    prayer_times = {"fajr": "bad", "dohr": "09:00"}
    segments = segment_available_time(prayer_times, "Europe/Paris", 0, 0)
    assert segments == []
    # Prières non triées
    prayer_times = {"asr": "10:00", "fajr": "08:00", "dohr": "09:00"}
    segments = segment_available_time(prayer_times, "Europe/Paris", 0, 0)
    assert len(segments) == 2
    assert segments[0]["start"] == "08:00"
    assert segments[0]["end"] == "09:00"
    assert segments[1]["start"] == "09:00"
    assert segments[1]["end"] == "10:00"

def test_segment_available_time_error_handling():
    """Test error handling"""
    # Test with prayers outside the time range
    prayer_times = {
        "fajr": "07:00",  # Before start_time
        "dohr": "13:00"   # After end_time
    }
    segments = segment_available_time(prayer_times, "Europe/Paris", 0, 0)
    assert len(segments) == 1  # One segment because prayers are ignored
    assert segments[0]["start"] == "07:00"
    assert segments[0]["end"] == "13:00"

    # Test with prayers in the wrong order
    prayer_times = {
        "asr": "10:00",
        "fajr": "08:00",
        "dohr": "09:00"
    }
    segments = segment_available_time(prayer_times, "Europe/Paris", 0, 0)
    assert len(segments) == 2  # Prayers are automatically sorted
    assert segments[0]["start"] == "08:00"
    assert segments[0]["end"] == "09:00"
    assert segments[1]["start"] == "09:00"
    assert segments[1]["end"] == "10:00"