from datetime import timedelta

from app.modules.empty_generator import format_duration


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

    # Test negative durations (doivent retourner '0h00')
    assert format_duration(timedelta(hours=-2, minutes=-30)) == "0h00"
    assert format_duration(timedelta(hours=-1, minutes=-5)) == "0h00"
