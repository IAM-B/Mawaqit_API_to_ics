"""
Mute utilities module for handling silent time slots.
This module provides functions to apply silent settings to calendar events.
"""

def apply_silent_settings(slots):
    """
    Apply silent settings to time slots to make them non-intrusive in calendars.
    
    Args:
        slots (list): List of time slot dictionaries
        
    Returns:
        list: List of time slots with silent settings applied
    """
    for slot in slots:
        slot['summary'] = 'Available slot'
        slot['description'] = 'Free time between prayers'
        slot['transparent'] = True
        slot['mute'] = True
    return slots
