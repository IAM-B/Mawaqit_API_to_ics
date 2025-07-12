"""
Available slots generator module for creating ICS calendar files with time slots between prayers.
This module handles the generation of calendar events for available time slots between prayer times.
"""

from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4
from zoneinfo import ZoneInfo

from flask import current_app
from icalendar import Calendar, Event

from .cache_manager import cache_manager

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


def format_duration(duration: timedelta) -> str:
    """
    Format a timedelta duration into a human-readable string.

    Args:
        duration (timedelta): Duration to format

    Returns:
        str: Formatted duration string
    """
    total_minutes = int(duration.total_seconds() / 60)
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
    PRAYERS_ORDER: list = None,
    prayer_paddings: dict = None,
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
    calendar.add(
        "prodid",
        f"-//{current_app.config.get('ICS_CALENDAR_NAME', 'Prayer Times')}//FR",
    )
    calendar.add("version", "2.0")
    calendar.add("name", current_app.config.get("ICS_CALENDAR_NAME", "Prayer Times"))
    calendar.add("description", current_app.config["ICS_CALENDAR_DESCRIPTION"])

    if PRAYERS_ORDER is None:
        PRAYERS_ORDER = ["fajr", "dohr", "asr", "maghreb", "icha"]

    # Generate slots between consecutive prayers
    for i in range(len(PRAYERS_ORDER) - 1):
        current_prayer = PRAYERS_ORDER[i]
        next_prayer = PRAYERS_ORDER[i + 1]

        t1 = prayer_times.get(current_prayer)
        t2 = prayer_times.get(next_prayer)
        if not t1 or not t2:
            continue

        # Get individual paddings for current and next prayer
        current_padding_after = padding_after
        next_padding_before = padding_before

        if prayer_paddings and current_prayer in prayer_paddings:
            current_padding_after = prayer_paddings[current_prayer]["after"]

        if prayer_paddings and next_prayer in prayer_paddings:
            next_padding_before = prayer_paddings[next_prayer]["before"]

        # Apply minimum padding of 10 minutes after prayer for uniform display
        MIN_PADDING_AFTER = 10
        if current_padding_after < MIN_PADDING_AFTER:
            current_padding_after = MIN_PADDING_AFTER

        start = to_datetime(t1, base_date, tz) + timedelta(
            minutes=current_padding_after
        )
        end = to_datetime(t2, base_date, tz) - timedelta(minutes=next_padding_before)

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
        event.add(
            "description",
            f"Free slot between {PRAYERS_ORDER[i]} and {PRAYERS_ORDER[i + 1]} — Duration: {formatted}",
        )
        calendar.add_component(event)

    # Add slot between icha and fajr (night slot)
    icha_time = prayer_times.get("icha")
    fajr_time = prayer_times.get("fajr")

    if icha_time and fajr_time:
        icha_dt = to_datetime(icha_time, base_date, tz)
        fajr_dt = to_datetime(fajr_time, base_date, tz)

        # If fajr is the next day, add 24 hours to fajr
        if fajr_dt <= icha_dt:
            fajr_dt += timedelta(days=1)

        # Get individual paddings for icha and fajr
        icha_padding_after = padding_after
        fajr_padding_before = padding_before

        if prayer_paddings and "icha" in prayer_paddings:
            icha_padding_after = prayer_paddings["icha"]["after"]

        if prayer_paddings and "fajr" in prayer_paddings:
            fajr_padding_before = prayer_paddings["fajr"]["before"]

        # Apply minimum padding of 10 minutes after prayer for uniform display
        MIN_PADDING_AFTER = 10
        if icha_padding_after < MIN_PADDING_AFTER:
            icha_padding_after = MIN_PADDING_AFTER

        night_start = icha_dt + timedelta(minutes=icha_padding_after)
        night_end = fajr_dt - timedelta(minutes=fajr_padding_before)

        if night_start < night_end:
            duration = night_end - night_start
            formatted = format_duration(duration)

            event = Event()
            event.add("uid", str(uuid4()))
            event.add("dtstart", night_start)
            event.add("dtend", night_end)
            event.add("transp", "TRANSPARENT")
            event.add("categories", "Empty slots")
            event.add("summary", f"Night Availability ({formatted})")
            event.add(
                "description",
                f"Free slot between icha and fajr (night) — Duration: {formatted}",
            )
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
    include_sunset: bool = False,
    prayer_paddings: dict = None,
    features_options: dict = None,
) -> str:
    """
    Generate available slot events for a specific time scope (today/month/year).
    Uses cache to avoid regeneration if the file already exists.

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
    print(f"🔄 Generating slots ICS file for {masjid_id} ({scope})")

    # Check cache first
    cached_path = cache_manager.get_cached_file_path(
        masjid_id,
        scope,
        padding_before,
        padding_after,
        include_sunset,
        "slots",
        prayer_paddings,
        features_options,
    )

    if cached_path:
        print(f"✅ Using cached slots file: {cached_path}")
        # Copy cached file to destination
        output_path = (
            Path(current_app.static_folder)
            / "ics"
            / f"slots_{masjid_id}_{datetime.now().year}.ics"
        )
        if scope == "today":
            output_path = (
                Path(current_app.static_folder)
                / "ics"
                / f"slots_{masjid_id}_{datetime.now().date()}.ics"
            )
        elif scope == "month":
            output_path = (
                Path(current_app.static_folder)
                / "ics"
                / f"slots_{masjid_id}_{datetime.now().year}_{datetime.now().month:02d}.ics"
            )

        cache_manager.copy_cached_to_destination(
            masjid_id,
            scope,
            padding_before,
            padding_after,
            include_sunset,
            "slots",
            str(output_path),
            prayer_paddings,
            features_options,
        )
        return str(output_path)

    print("🔄 Cache miss, generating new slots file...")

    # Generate the file (existing logic)
    YEAR = datetime.now().year
    now = datetime.now()
    cal = Calendar()
    cal.add(
        "prodid",
        f"-//{current_app.config.get('ICS_CALENDAR_NAME', 'Prayer Times')}//FR",
    )
    cal.add("version", "2.0")
    cal.add("name", current_app.config.get("ICS_CALENDAR_NAME", "Prayer Times"))
    cal.add("description", current_app.config["ICS_CALENDAR_DESCRIPTION"])

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
        generate_slot_ics_file(
            day_times,
            base_date,
            tmp_file,
            timezone_str,
            padding_before,
            padding_after,
            PRAYERS_ORDER,
            prayer_paddings,
        )
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

    # Use the relative path to the static folder of the application
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
        "slots",
        file_content,
        str(output_path),
        prayer_paddings,
        features_options,
    )

    print(f"✅ Generated and cached slots file: {output_path}")
    return str(output_path)
