"""
Available slots generator module for creating ICS calendar files with time slots between prayers.
This module handles the generation of calendar events for available time slots between prayer times.
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

def generate_slot_ics_file(
    prayer_times: dict,
    base_date: datetime,
    filename: str,
    timezone_str: str,
    padding_before: int,
    padding_after: int,
    PRAYERS_ORDER: list = None
) -> str:
    """
    Generate calendar events for available slots between prayers for a single day.
    
    Args:
        prayer_times (dict): Dictionary of prayer times
        base_date (datetime): Base date for the events
        filename (str): Output ICS file path
        timezone_str (str): Timezone string
        padding_before (int): Minutes to add before prayer times
        padding_after (int): Minutes to add after prayer times
        PRAYERS_ORDER (list): List of prayer times in order
        
    Returns:
        str: Path to the generated ICS file
    """
    tz = ZoneInfo(timezone_str)
    calendar = Calendar()
    calendar.add('prodid', f'-//{current_app.config["ICS_CALENDAR_NAME"]}//FR')
    calendar.add('version', '2.0')
    calendar.add('name', current_app.config['ICS_CALENDAR_NAME'])
    calendar.add('description', current_app.config['ICS_CALENDAR_DESCRIPTION'])

    if PRAYERS_ORDER is None:
        PRAYERS_ORDER = ["fajr", "dohr", "asr", "maghreb", "icha"]

    # Generate slots between consecutive prayers
    for i in range(len(PRAYERS_ORDER) - 1):
        t1 = prayer_times.get(PRAYERS_ORDER[i])
        t2 = prayer_times.get(PRAYERS_ORDER[i + 1])
        if not t1 or not t2:
            continue

        start = to_datetime(t1, base_date, tz) + timedelta(minutes=padding_after)
        end = to_datetime(t2, base_date, tz) - timedelta(minutes=padding_before)

        if start >= end:
            continue

        duration = end - start
        formatted = format_duration(duration)

        event = Event()
        event.add("uid", str(uuid4()))
        event.add("dtstart", start)
        event.add("dtend", end)
        event.add("transp", "TRANSPARENT")
        event.add("categories", "Empty slots")
        event.add("summary", f"Availability ({formatted})")
        event.add("description", f"Free slot between {PRAYERS_ORDER[i]} and {PRAYERS_ORDER[i + 1]} — Duration: {formatted}")
        calendar.add_component(event)

    with open(filename, "wb") as f:
        f.write(calendar.to_ical())

    return filename

def generate_slots_by_scope(
    masjid_id: str,
    scope: str,
    timezone_str: str,
    padding_before: int,
    padding_after: int,
    prayer_times: list | dict,
    include_sunset: bool = False
) -> str:
    """
    Generate available slot events for a specific time scope (today/month/year).
    
    Args:
        masjid_id (str): Mosque identifier
        scope (str): Time scope (today/month/year)
        timezone_str (str): Timezone string
        padding_before (int): Minutes to add before prayer times
        padding_after (int): Minutes to add after prayer times
        prayer_times (list | dict): Prayer time data for the specified scope
        include_sunset (bool): Whether to include 'sunset' in the prayer order
        
    Returns:
        str: Path to the generated ICS file
        
    Raises:
        ValueError: If scope is invalid
    """
    YEAR = datetime.now().year
    now = datetime.now()
    cal = Calendar()
    cal.add('prodid', f'-//{current_app.config["ICS_CALENDAR_NAME"]}//FR')
    cal.add('version', '2.0')
    cal.add('name', current_app.config['ICS_CALENDAR_NAME'])
    cal.add('description', current_app.config['ICS_CALENDAR_DESCRIPTION'])

    # Order of prayers in the day (dynamique)
    PRAYERS_ORDER = ["fajr"]
    if include_sunset:
        PRAYERS_ORDER.append("sunset")
    PRAYERS_ORDER += ["dohr", "asr", "maghreb", "icha"]

    def append_day_to_calendar(base_date, day_times: dict):
        """
        Generate and append available slot events for a single day to the calendar.
        
        Args:
            base_date (datetime): Base date for the events
            day_times (dict): Dictionary of prayer times for the day
        """
        tmp_file = Path("tmp.ics")
        generate_slot_ics_file(day_times, base_date, tmp_file, timezone_str, padding_before, padding_after, PRAYERS_ORDER)
        with open(tmp_file, "rb") as f:
            sub_cal = Calendar.from_ical(f.read())
            for component in sub_cal.walk():
                if component.name == "VEVENT":
                    cal.add_component(component)
        tmp_file.unlink(missing_ok=True)

    # Handle different time scopes
    if scope == "today":
        append_day_to_calendar(now, prayer_times)
        filename = f"slots_{masjid_id}_{now.date()}.ics"

    elif scope == "month":
        month = now.month
        for i, daily_times in enumerate(prayer_times):
            date_obj = datetime(YEAR, month, i + 1)
            append_day_to_calendar(date_obj, daily_times)
        filename = f"slots_{masjid_id}_{YEAR}_{month:02d}.ics"

    elif scope == "year":
        for month_index, month_days in enumerate(prayer_times, start=1):
            if not isinstance(month_days, dict):
                continue
            for day_str, times_dict in month_days.items():
                try:
                    date_obj = datetime(YEAR, month_index, int(day_str))
                    # Compatibility: also accepts the old format (list)
                    if isinstance(times_dict, list) and len(times_dict) >= 6:
                        keys = ["fajr"]
                        if "sunset" in PRAYERS_ORDER:
                            keys.append("sunset")
                        keys += ["dohr", "asr", "maghreb", "icha"]
                        times_dict = {k: v for k, v in zip(keys, times_dict)}
                    if isinstance(times_dict, dict):
                        append_day_to_calendar(date_obj, times_dict)
                except Exception as e:
                    print(f"⚠️ Error {day_str}/{month_index}: {e}")
        filename = f"slots_{masjid_id}_{YEAR}.ics"

    else:
        raise ValueError("Scope must be 'today', 'month' or 'year'")

    output_path = Path(current_app.static_folder) / "ics" / filename
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(cal.to_ical())
    return str(output_path)
