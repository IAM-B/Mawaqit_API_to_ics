"""
Time segmenter module for dividing available time slots between prayers.
This module handles the segmentation of time periods into manageable slots.
"""

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

def segment_available_time(prayer_times: dict, tz_str: str, padding_before: int, padding_after: int):
    """
    Segment available time between prayer times into slots.
    
    Args:
        prayer_times (dict): Dictionary of prayer times
        tz_str (str): Timezone string
        padding_before (int): Minutes to add before prayer times
        padding_after (int): Minutes to add after prayer times
        
    Returns:
        list: List of time segments with start and end times
    """
    times = []
    tz = ZoneInfo(tz_str)

    if not isinstance(prayer_times, dict):
        print(f"⛔ segment_available_time received invalid type: {type(prayer_times)} → {prayer_times}")
        return []
        
    # Convert prayer times to datetime objects
    for name, time_str in prayer_times.items():
        try:
            hour, minute = map(int, time_str.strip().split(":"))
            dt = datetime.now(tz).replace(hour=hour, minute=minute, second=0, microsecond=0)
            times.append(dt)
        except Exception as e:
            print(f"⚠️ Ignored: {name} → '{time_str}' ({e})")

    if len(times) < 2:
        print("⚠️ Not enough valid times to generate segments.")
        return []

    # Sort times and create segments
    times = sorted(times)
    segments = []

    for i in range(len(times) - 1):
        start = times[i] + timedelta(minutes=padding_before)
        end = times[i + 1] - timedelta(minutes=padding_after)
        if start < end:
            segments.append({"start": start.strftime("%H:%M"), "end": end.strftime("%H:%M")})
        else:
            print(f"⛔ Invalid slot ignored between {times[i]} and {times[i+1]}")

    return segments


def generate_empty_slots_for_timeline(slots: list) -> list:
    """
    Generate empty slots between available slots for timeline display.
    
    Args:
        slots (list): List of available slots with start and end times
        
    Returns:
        list: List of empty slots with start and end times
    """
    if not slots or len(slots) == 0:
        return [{"start": "00:00", "end": "23:59"}]
    
    empty_slots = []
    
    # Add empty slot before first slot (if not starting at 00:00)
    if slots[0].get('start') != '00:00':
        empty_slots.append({
            "start": "00:00",
            "end": slots[0].get('start')
        })
    
    # Add empty slots between available slots
    for i in range(len(slots) - 1):
        current_slot = slots[i]
        next_slot = slots[i + 1]
        
        if current_slot.get('end') != next_slot.get('start'):
            empty_slots.append({
                "start": current_slot.get('end'),
                "end": next_slot.get('start')
            })
    
    # Add empty slot after last slot (if not ending at 23:59)
    if slots[-1].get('end') != '23:59':
        empty_slots.append({
            "start": slots[-1].get('end'),
            "end": "23:59"
        })
    
    return empty_slots


def generate_empty_slots(start_time: str, end_time: str, date: datetime) -> list[tuple[datetime, datetime]]:
    """
    Generate empty time slots between start and end times, divided into hour-long segments.
    
    Args:
        start_time (str): Start time in format "HH:MM"
        end_time (str): End time in format "HH:MM"
        date (datetime): Reference date for the slots
        
    Returns:
        list[tuple[datetime, datetime]]: List of time slot tuples (start, end)
    """
    fmt = "%H:%M"
    slots = []

    start_dt = datetime.combine(date, datetime.strptime(start_time, fmt).time())
    end_dt = datetime.combine(date, datetime.strptime(end_time, fmt).time())

    if start_dt >= end_dt:
        print(f"⚠️ Empty slot ignored: {start_time} >= {end_time}")
        return []

    # Handle partial hour at the beginning
    next_hour = (start_dt + timedelta(minutes=60)).replace(minute=0, second=0, microsecond=0)
    if next_hour > end_dt:
        slots.append((start_dt, end_dt))
        return slots

    slots.append((start_dt, next_hour))

    # Add full hour slots
    current = next_hour
    while current + timedelta(hours=1) <= end_dt:
        next_slot = current + timedelta(hours=1)
        slots.append((current, next_slot))
        current = next_slot

    # Handle partial hour at the end
    if current < end_dt:
        slots.append((current, end_dt))

    return slots
