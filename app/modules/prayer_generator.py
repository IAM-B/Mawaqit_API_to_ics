"""
Prayer time ICS generator module.
This module handles the generation of ICS calendar files for prayer times with customizable padding.
"""

from datetime import datetime, time, timedelta
from pathlib import Path
from typing import Optional
from uuid import uuid4
from zoneinfo import ZoneInfo

from flask import current_app
from icalendar import Calendar, Event

from .cache_manager import cache_manager
from .option_features import OptionFeatures

# Order of prayers in the day
PRAYERS_ORDER = ["fajr"]


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
        raise ValueError(f"Error parsing time '{time_str}': {e!s}") from e


def generate_prayer_ics_file(
    masjid_id: str,
    scope: str,
    timezone_str: str,
    padding_before: int,
    padding_after: int,
    prayer_times: list | dict,
    include_sunset: bool = False,
    prayer_paddings: Optional[dict] = None,
    features_options: Optional[dict] = None,
) -> str:
    """
    Generate an ICS file containing prayer times with customizable padding.
    Uses cache to avoid regeneration if the file already exists.

    Args:
        masjid_id (str): Mosque identifier
        scope (str): Time scope (today/month/year)
        timezone_str (str): Timezone string (e.g., "Europe/Paris")
        padding_before (int): Minutes to add before prayer time
        padding_after (int): Minutes to add after prayer time
        prayer_times (list | dict): Prayer time data for the specified scope
        include_sunset (bool): Whether to include sunset in the prayer times

    Returns:
        str: Path to the generated ICS file

    Raises:
        ValueError: If scope is invalid
    """
    print(f"🔄 Generating prayer ICS file for {masjid_id} ({scope})")

    # Check cache first
    cached_path = cache_manager.get_cached_file_path(
        masjid_id,
        scope,
        padding_before,
        padding_after,
        include_sunset,
        "prayer_times",
        prayer_paddings,
        features_options,
    )

    if cached_path:
        print(f"✅ Using cached prayer times file: {cached_path}")
        # Copy cached file to destination
        output_path = (
            Path(current_app.static_folder)
            / "ics"
            / f"prayer_times_{masjid_id}_{datetime.now().year}.ics"
        )
        if scope == "today":
            output_path = (
                Path(current_app.static_folder)
                / "ics"
                / f"prayer_times_{masjid_id}_{datetime.now().date()}.ics"
            )
        elif scope == "month":
            output_path = (
                Path(current_app.static_folder)
                / "ics"
                / f"prayer_times_{masjid_id}_{datetime.now().year}_{datetime.now().month:02d}.ics"
            )

        cache_manager.copy_cached_to_destination(
            masjid_id,
            scope,
            padding_before,
            padding_after,
            include_sunset,
            "prayer_times",
            str(output_path),
            prayer_paddings,
            features_options,
        )
        return str(output_path)

    print("🔄 Cache miss, generating new prayer times file...")

    # Generate the file (existing logic)
    YEAR = datetime.now().year
    tz = ZoneInfo(timezone_str)
    cal = Calendar()
    now = datetime.now()

    cal.add(
        "prodid",
        f"-//{current_app.config.get('ICS_CALENDAR_NAME', 'Prayer Times')}//FR",
    )
    cal.add("version", "2.0")
    cal.add("name", current_app.config.get("ICS_CALENDAR_NAME", "Prayer Times"))
    cal.add(
        "description",
        current_app.config.get("ICS_CALENDAR_DESCRIPTION", "Prayer times calendar"),
    )

    # Initialize features
    option_features = OptionFeatures(timezone_str)

    # Order of prayers in the day (dynamique)
    PRAYERS_ORDER = ["fajr"]
    if include_sunset:
        PRAYERS_ORDER.append("sunset")
    PRAYERS_ORDER += ["dohr", "asr", "maghreb", "icha"]

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

                # Get individual padding for this prayer
                prayer_before = padding_before
                prayer_after = padding_after

                if prayer_paddings and name in prayer_paddings:
                    prayer_before = prayer_paddings[name]["before"]
                    prayer_after = prayer_paddings[name]["after"]

                # Apply minimum padding of 10 minutes after prayer for uniform display
                MIN_PADDING_AFTER = 10
                if prayer_after < MIN_PADDING_AFTER:
                    original_after = prayer_after
                    prayer_after = MIN_PADDING_AFTER
                    print(
                        f"  ⚠️ [prayer_generator] Applied minimum padding for {name}: {original_after} → {prayer_after} min after"
                    )

                dt_start = base_dt - timedelta(minutes=prayer_before)
                dt_end = base_dt + timedelta(minutes=prayer_after)

                event = Event()
                event.add("uid", str(uuid4()))
                event.add("dtstart", dt_start)
                event.add("dtend", dt_end)

                # Build prayer title with features
                prayer_title = f"{name.capitalize()} ({time_str})"

                # Add Jummah prefix only for Dohr on Friday
                if date_obj.weekday() == 4 and name == "dohr":  # Friday and Dohr only
                    prayer_title = f"Jummah - {prayer_title}"

                # Note: Hijri dates are now separate events, not in prayer titles

                # Add adhkar info to specific prayers
                if features_options and features_options.get("include_adhkar", False):
                    adhkar_info = option_features.get_adhkar_info(name)
                    if adhkar_info:
                        prayer_title += adhkar_info

                # Handle sunset special case
                if name == "sunset":
                    prayer_title = f"Chourouk ({time_str})"

                event.add("summary", prayer_title)
                event.add("location", f"Mosque {masjid_id.replace('-', ' ').title()}")
                event.add(
                    "description",
                    f"Prayer including {prayer_before} min before and {prayer_after} min after",
                )

                # Add Jummah description only for Dohr on Friday
                if date_obj.weekday() == 4 and name == "dohr":  # Friday and Dohr only
                    current_desc = event.get("description", "")
                    event.add("description", f"{current_desc}\n🕌 Prière du Jummah")

                alarm = Event()
                alarm.add("action", "AUDIO")
                alarm.add("trigger", timedelta(minutes=0))
                alarm.add("description", f"🔊 Prayer call for {name.capitalize()}")
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
                filtered_times = {
                    k: v for k, v in daily_times.items() if k in PRAYERS_ORDER
                }
                add_event(date_obj, filtered_times)
            except Exception as e:
                print(f"⚠️ Error day {i + 1}/{month}: {e}")
        filename = f"prayer_times_{masjid_id}_{YEAR}_{month:02d}.ics"

    elif scope == "year":
        for month_index, month_days in enumerate(prayer_times, start=1):
            if not isinstance(month_days, dict):
                continue
            for day_str, times_dict in month_days.items():
                try:
                    date_obj = datetime(YEAR, month_index, int(day_str))
                    # Compatibility: also accepts the old format (list)
                    if isinstance(times_dict, list) and len(times_dict) >= 6:
                        # We assume the order: fajr, sunset, dohr, asr, maghreb, icha
                        keys = ["fajr"]
                        if "sunset" in PRAYERS_ORDER:
                            keys.append("sunset")
                        keys += ["dohr", "asr", "maghreb", "icha"]
                        times_dict = dict(zip(keys, times_dict))
                    if isinstance(times_dict, dict):
                        filtered_times = {
                            k: v for k, v in times_dict.items() if k in PRAYERS_ORDER
                        }
                        add_event(date_obj, filtered_times)
                except Exception as e:
                    print(f"⚠️ Error {day_str}/{month_index}: {e}")
        filename = f"prayer_times_{masjid_id}_{YEAR}.ics"

    else:
        raise ValueError("Scope must be 'today', 'month', or 'year'")

    # Add events to the calendar
    if features_options:
        print("🕌 Adding features to calendar...")

        # Determine date range for events
        if scope == "today":
            start_date = now.date()
            end_date = now.date()
        elif scope == "month":
            start_date = now.replace(day=1).date()
            if now.month == 12:
                end_date = now.replace(year=now.year + 1, month=1, day=1) - timedelta(
                    days=1
                )
            else:
                end_date = now.replace(month=now.month + 1, day=1) - timedelta(days=1)
        else:  # year
            start_date = now.replace(month=1, day=1).date()
            end_date = now.replace(month=12, day=31).date()

        option_features.add_options_events_to_calendar(
            cal, start_date, end_date, features_options
        )
        print("✅ features added to calendar")

    output_path = Path(current_app.static_folder) / "ics" / filename
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Generate the file content
    file_content = cal.to_ical()

    # Save to destination
    with open(output_path, "wb") as f:
        f.write(file_content)

    # Save to cache for future use
    cache_manager.save_to_cache(
        masjid_id,
        scope,
        padding_before,
        padding_after,
        include_sunset,
        "prayer_times",
        file_content,
        str(output_path),
        prayer_paddings,
        features_options,
    )

    print(f"✅ Generated and cached prayer times file: {output_path}")
    return str(output_path)
