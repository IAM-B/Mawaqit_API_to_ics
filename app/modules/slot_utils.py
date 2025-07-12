"""
Slot utilities module for handling time slot operations.
This module provides helper functions for rounding and adjusting time slots.
"""

from datetime import datetime, time, timedelta


def round_up_to_hour(dt):
    """
    Round a datetime up to the next hour.

    Args:
        dt (datetime): Datetime to round

    Returns:
        datetime: Datetime rounded up to the next hour
    """
    return (
        (dt.replace(second=0, microsecond=0, minute=0) + timedelta(hours=1))
        if dt.minute > 0
        else dt
    )


def round_down_to_hour(dt):
    """
    Round a datetime down to the current hour.

    Args:
        dt (datetime): Datetime to round

    Returns:
        datetime: Datetime rounded down to the current hour
    """
    return dt.replace(second=0, microsecond=0, minute=0)


def parse_time_str(s: str) -> datetime:
    """
    Convert a time string to a datetime object.
    Supports both ISO format and simple time format ('HH:MM').

    Args:
        s (str): Time string to parse

    Returns:
        datetime: Parsed datetime object

    Raises:
        ValueError: If the time string format is not supported
    """
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        # Handle simple 'HH:MM' format
        if ":" in s and "-" not in s:
            h, m = map(int, s.strip().split(":"))
            return datetime.combine(datetime.today().date(), time(h, m))
        raise ValueError(f"Unsupported format: {s}")


def adjust_slots_rounding(slots, prayer_adjacent_slots=None):
    """
    Adjust time slots by rounding start times up and end times down to the nearest hour.
    Only rounds slots that are not adjacent to prayer times.

    Args:
        slots (list): List of time slot dictionaries with 'start' and 'end' keys
        prayer_adjacent_slots (list, optional): List of slot indices that are adjacent to prayers.
            If None, assumes no slots are adjacent to prayers.

    Returns:
        list: List of adjusted time slot dictionaries
    """
    if prayer_adjacent_slots is None:
        prayer_adjacent_slots = []

    adjusted = []
    for i, slot in enumerate(slots):
        start = slot["start"]
        end = slot["end"]

        # Convert string times to datetime if needed
        if isinstance(start, str):
            start = parse_time_str(start)
        if isinstance(end, str):
            end = parse_time_str(end)

        # Only round if the slot is not adjacent to a prayer
        if i not in prayer_adjacent_slots:
            start = round_up_to_hour(start)
            end = round_down_to_hour(end)

        # Only add valid slots
        if end > start:
            adjusted.append({"start": start, "end": end})
    return adjusted
