"""
Prayer time ICS generator module.
This module handles the generation of ICS calendar files for prayer times with customizable padding.
"""

from uuid import uuid4
from pathlib import Path
from zoneinfo import ZoneInfo
from icalendar import Calendar, Event
from datetime import datetime, timedelta, time

# Order of prayers in the day
PRAYERS_ORDER = ["fajr", "dohr", "asr", "maghreb", "icha"]

def parse_time_str(time_str: str, date_ref=None) -> datetime:
    """
    Parse a time string into a datetime object.
    
    Args:
        time_str (str): Time string in format "HH:MM"
        date_ref (date, optional): Reference date. Defaults to today.
        
    Returns:
        datetime: Datetime object combining the reference date and parsed time
        
    Raises:
        ValueError: If time string format is invalid
    """
    if not date_ref:
        date_ref = datetime.today().date()
    
    try:
        if not isinstance(time_str, str):
            raise ValueError(f"Expected string, got {type(time_str)}")
            
        time_str = time_str.strip()
        if not time_str or ":" not in time_str:
            raise ValueError(f"Invalid time format: {time_str}")
            
        h, m = map(int, time_str.split(":"))
        if not (0 <= h <= 23 and 0 <= m <= 59):
            raise ValueError(f"Time out of range: {time_str}")
            
        return datetime.combine(date_ref, time(h, m))
    except Exception as e:
        raise ValueError(f"Error parsing time '{time_str}': {str(e)}")

def generate_prayer_ics_file(
    masjid_id: str,
    scope: str,
    timezone_str: str,
    padding_before: int,
    padding_after: int,
    prayer_times: list | dict
) -> str:
    """
    Generate an ICS file containing prayer times with customizable padding.
    
    Args:
        masjid_id (str): Mosque identifier
        scope (str): Time scope (today/month/year)
        timezone_str (str): Timezone string (e.g., "Europe/Paris")
        padding_before (int): Minutes to add before prayer time
        padding_after (int): Minutes to add after prayer time
        prayer_times (list | dict): Prayer time data for the specified scope
        
    Returns:
        str: Path to the generated ICS file
        
    Raises:
        ValueError: If scope is invalid
    """
    YEAR = datetime.now().year
    tz = ZoneInfo(timezone_str)
    cal = Calendar()
    now = datetime.now()

    def add_event(date_obj, times_dict):
        """
        Add prayer events to the calendar for a specific date.
        
        Args:
            date_obj (date): Date for the events
            times_dict (dict): Dictionary of prayer times
        """
        for name in PRAYERS_ORDER:
            time_str = times_dict.get(name)
            if not time_str:
                continue
            try:
                base_dt = parse_time_str(time_str, date_obj).replace(tzinfo=tz)
                dt_start = base_dt - timedelta(minutes=padding_before)
                dt_end = base_dt + timedelta(minutes=padding_after)

                event = Event()
                event.add('uid', str(uuid4()))
                event.add('dtstart', dt_start)
                event.add('dtend', dt_end)
                event.add('summary', f"{name.capitalize()} ({time_str})")
                event.add('location', f"Mosque {masjid_id.replace('-', ' ').title()}")
                event.add('description', f"Prayer including {padding_before} min before and {padding_after} min after")

                alarm = Event()
                alarm.add('action', 'AUDIO')
                alarm.add('trigger', timedelta(minutes=0))
                alarm.add('description', f"🔊 Prayer call for {name.capitalize()}")

                event.add_component(alarm)
                cal.add_component(event)

            except Exception as e:
                print(f"⚠️ Error for {name} ({time_str}) on {date_obj}: {e}")

    if scope == "today":
        today = now.date()
        filtered_times = {k: v for k, v in prayer_times.items() if k in PRAYERS_ORDER}
        add_event(today, filtered_times)
        filename = f"prayer_times_{masjid_id}_{today}.ics"

    elif scope == "month":
        month = now.month
        for i, daily_times in enumerate(prayer_times):
            try:
                date_obj = datetime(YEAR, month, i + 1)
                filtered_times = {k: v for k, v in daily_times.items() if k in PRAYERS_ORDER}
                add_event(date_obj, filtered_times)
            except Exception as e:
                print(f"⚠️ Error day {i + 1}/{month}: {e}")
        filename = f"prayer_times_{masjid_id}_{YEAR}_{month:02d}.ics"

    elif scope == "year":
        for month_index, month_days in enumerate(prayer_times, start=1):
            if not isinstance(month_days, dict):
                continue
            for day_str, time_list in month_days.items():
                try:
                    date_obj = datetime(YEAR, month_index, int(day_str))
                    if isinstance(time_list, list) and len(time_list) >= 6:
                        cleaned_list = [v for i, v in enumerate(time_list) if i != 1]  # remove sunrise
                        times_dict = dict(zip(PRAYERS_ORDER, cleaned_list[:len(PRAYERS_ORDER)]))
                        add_event(date_obj, times_dict)
                except Exception as e:
                    print(f"⚠️ Error {day_str}/{month_index}: {e}")
        filename = f"prayer_times_{masjid_id}_{YEAR}.ics"

    else:
        raise ValueError("Scope must be 'today', 'month', or 'year'")

    output_path = Path("app/static/ics") / filename
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(cal.to_ical())
    return str(output_path)
