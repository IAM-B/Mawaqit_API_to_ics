"""
Empty slot generator module for creating ICS calendar files with available time slots between prayers.
This module handles the generation of calendar events for free time slots between prayer times.
"""

from uuid import uuid4
from pathlib import Path
from zoneinfo import ZoneInfo
from icalendar import Calendar, Event
from datetime import datetime, timedelta, time
from flask import current_app

# Order of prayers in the day
PRAYERS_ORDER = ["fajr", "dohr", "asr", "maghreb", "icha"]

def to_datetime(time_str: str, base_date: datetime, tz: ZoneInfo) -> datetime:
    """
    Convert a time string to a datetime object with timezone.
    
    Args:
        time_str (str): Time string in format "HH:MM"
        base_date (datetime): Base date to combine with the time
        tz (ZoneInfo): Timezone information
        
    Returns:
        datetime: Datetime object with timezone
    """
    t = datetime.strptime(time_str, "%H:%M").time()
    return datetime.combine(base_date.date(), t).replace(tzinfo=tz)

def format_duration(delta: timedelta) -> str:
    """
    Format a timedelta into a human-readable duration string.
    
    Args:
        delta (timedelta): Time duration to format
        
    Returns:
        str: Formatted duration string (e.g., "2h30")
        Returns "0h00" if the duration is negative or zero.
    """
    total_minutes = int(delta.total_seconds() // 60)
    if total_minutes <= 0:
        return "0h00"
    hours = total_minutes // 60
    minutes = total_minutes % 60
    return f"{hours}h{minutes:02d}"

def generate_empty_slot_events(
    prayer_times: dict,
    base_date: datetime,
    filename: str,
    timezone_str: str,
    padding_before: int,
    padding_after: int
) -> str:
    """
    Generate calendar events for empty slots between prayers for a single day.
    
    Args:
        prayer_times (dict): Dictionary of prayer times
        base_date (datetime): Base date for the events
        filename (str): Output ICS file path
        timezone_str (str): Timezone string
        padding_before (int): Minutes to add before prayer times
        padding_after (int): Minutes to add after prayer times
        
    Returns:
        str: Path to the generated ICS file
    """
    tz = ZoneInfo(timezone_str)
    calendar = Calendar()
    calendar.add('prodid', '-//Planning Sync//Mawaqit//FR')
    calendar.add('version', '2.0')

    def to_datetime(time_str: str) -> datetime:
        t = datetime.strptime(time_str, "%H:%M").time()
        return datetime.combine(base_date.date(), t).replace(tzinfo=tz)

    full_hour = timedelta(hours=1)
    slots = []

    # Generate slots between consecutive prayers
    for i in range(len(PRAYERS_ORDER) - 1):
        t1 = prayer_times.get(PRAYERS_ORDER[i])
        t2 = prayer_times.get(PRAYERS_ORDER[i + 1])
        if not t1 or not t2:
            continue

        start = to_datetime(t1) + timedelta(minutes=padding_after)
        end = to_datetime(t2) - timedelta(minutes=padding_before)
        if start >= end:
            continue

        # Handle slots that cross hour boundaries
        next_hour = (start + timedelta(minutes=59)).replace(minute=0, second=0, microsecond=0)
        if next_hour > end:
            slots.append((start, end))
            continue

        first_slot_end = min(next_hour + timedelta(hours=1), end)
        slots.append((start, first_slot_end))
        current = first_slot_end

        # Add full-hour slots
        while current + full_hour <= end:
            slots.append((current, current + full_hour))
            current += full_hour

        # Adjust last slot if needed
        if current < end and slots:
            last_start, last_end = slots[-1]
            slots[-1] = (last_start, end)

    # Create calendar events for each slot
    for start, end in slots:
        duration = end - start
        formatted = format_duration(duration)

        event = Event()
        event.add("uid", str(uuid4()))
        event.add("dtstart", start)
        event.add("dtend", end)
        event.add("transp", "TRANSPARENT")
        event.add("categories", "Empty slot")
        event.add("summary", f"Slot ({formatted})")
        event.add("description", "Free time slot between prayers")
        calendar.add_component(event)

    with open(filename, "wb") as f:
        f.write(calendar.to_ical())

    return filename

# ✅ NEW: multi-scope support
def generate_empty_by_scope(
    masjid_id: str,
    scope: str,
    timezone_str: str,
    padding_before: int,
    padding_after: int,
    prayer_times: list | dict
) -> str:
    """
    Generate empty slot events for a specific time scope (today/month/year).
    
    Args:
        masjid_id (str): Mosque identifier
        scope (str): Time scope (today/month/year)
        timezone_str (str): Timezone string
        padding_before (int): Minutes to add before prayer times
        padding_after (int): Minutes to add after prayer times
        prayer_times (list | dict): Prayer time data for the specified scope
        
    Returns:
        str: Path to the generated ICS file
        
    Raises:
        ValueError: If scope is invalid
    """
    YEAR = datetime.now().year
    now = datetime.now()
    tz = ZoneInfo(timezone_str)
    cal = Calendar()
    cal.add('prodid', f'-//{current_app.config["ICS_CALENDAR_NAME"]}//FR')
    cal.add('version', '2.0')
    cal.add('name', current_app.config['ICS_CALENDAR_NAME'])
    cal.add('description', current_app.config['ICS_CALENDAR_DESCRIPTION'])

    def append_day_to_calendar(base_date, daily_times: dict):
        """
        Generate and append empty slot events for a single day to the calendar.
        
        Args:
            base_date (datetime): Base date for the events
            daily_times (dict): Dictionary of prayer times for the day
        """
        tmp_file = Path("tmp_empty.ics")
        generate_empty_slot_events(daily_times, base_date, tmp_file, timezone_str, padding_before, padding_after)
        with open(tmp_file, "rb") as f:
            sub_cal = Calendar.from_ical(f.read())
            for component in sub_cal.walk():
                if component.name == "VEVENT":
                    cal.add_component(component)
        tmp_file.unlink(missing_ok=True)

    if scope == "today":
        append_day_to_calendar(now, prayer_times)
        filename = f"empty_slots_{masjid_id}_{now.date()}.ics"

    elif scope == "month":
        month = now.month
        for i, daily_times in enumerate(prayer_times):
            date_obj = datetime(YEAR, month, i + 1)
            append_day_to_calendar(date_obj, daily_times)
        filename = f"empty_slots_{masjid_id}_{YEAR}_{month:02d}.ics"

    elif scope == "year":
        for month_index, month_days in enumerate(prayer_times, start=1):
            for day_str, time_list in month_days.items():
                try:
                    date_obj = datetime(YEAR, month_index, int(day_str))
                    if isinstance(time_list, list) and len(time_list) >= 6:
                        # Remove sunrise time (index 1)
                        cleaned_list = [v for i, v in enumerate(time_list) if i != 1]
                        times_dict = dict(zip(PRAYERS_ORDER, cleaned_list[:len(PRAYERS_ORDER)]))
                        append_day_to_calendar(date_obj, times_dict)
                except Exception as e:
                    print(f"⚠️ Error {day_str}/{month_index}: {e}")
        filename = f"empty_slots_{masjid_id}_{YEAR}.ics"

    else:
        raise ValueError("Scope must be 'today', 'month' or 'year'")

    # Utiliser le chemin relatif au dossier static de l'application
    output_path = Path(current_app.static_folder) / "ics" / filename
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(cal.to_ical())
    return str(output_path)
