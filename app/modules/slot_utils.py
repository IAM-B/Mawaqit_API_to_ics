"""
Slot utilities module for handling time slot operations.
This module provides helper functions for rounding and adjusting time slots.
"""

from datetime import datetime, timedelta, time

def round_up_to_hour(dt):
    """
    Round a datetime up to the next hour.
    
    Args:
        dt (datetime): Datetime to round
        
    Returns:
        datetime: Datetime rounded up to the next hour
    """
    return (dt.replace(second=0, microsecond=0, minute=0) + timedelta(hours=1)) if dt.minute > 0 else dt

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

def adjust_slots_rounding(slots):
    """
    Adjust time slots by rounding start times up and end times down to the nearest hour.
    
    Args:
        slots (list): List of time slot dictionaries with 'start' and 'end' keys
        
    Returns:
        list: List of adjusted time slot dictionaries
    """
    adjusted = []
    for slot in slots:
        start = slot['start']
        end = slot['end']

        if isinstance(start, str):
            start = parse_time_str(start)
        if isinstance(end, str):
            end = parse_time_str(end)

        start = round_up_to_hour(start)
        end = round_down_to_hour(end)

        if end > start:
            adjusted.append({'start': start, 'end': end})
    return adjusted
