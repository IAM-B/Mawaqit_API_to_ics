import requests
from pathlib import Path
from datetime import datetime, timedelta
from icalendar import Calendar, Event
from zoneinfo import ZoneInfo
from uuid import uuid4

PRAYERS_ORDER = ["fajr", "dohr", "asr", "maghreb", "icha"]

def to_datetime(time_str: str, base_date: datetime, tz: ZoneInfo) -> datetime:
    t = datetime.strptime(time_str, "%H:%M").time()
    return datetime.combine(base_date.date(), t).replace(tzinfo=tz)

def format_duration(delta: timedelta) -> str:
    total_minutes = int(delta.total_seconds() // 60)
    hours = total_minutes // 60
    minutes = total_minutes % 60
    return f"{hours}h{minutes:02d}"

def generate_slot_ics_file(
    prayer_times: dict,
    base_date: datetime,
    filename: str,
    timezone_str: str,
    padding_before: int,
    padding_after: int
) -> str:
    tz = ZoneInfo(timezone_str)
    calendar = Calendar()
    calendar.add('prodid', '-//Planning Sync//Mawaqit//FR')
    calendar.add('version', '2.0')

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
        event.add("summary", f"Disponibilité ({formatted})")
        event.add("description", f"Crenau libre entre {PRAYERS_ORDER[i]} et {PRAYERS_ORDER[i + 1]} — Durée : {formatted}")
        calendar.add_component(event)

    with open(filename, "wb") as f:
        f.write(calendar.to_ical())

    return filename

# ✅ Wrapper multi-scope
def generate_slots_by_scope(masjid_id: str, scope: str, timezone_str: str, padding_before: int, padding_after: int) -> str:
    BASE_URL = f"http://localhost:8000/api/v1/{masjid_id}"
    YEAR = datetime.now().year
    now = datetime.now()
    tz = ZoneInfo(timezone_str)
    cal = Calendar()
    cal.add('prodid', '-//Planning Sync//Mawaqit//FR')
    cal.add('version', '2.0')

    def append_day_to_calendar(base_date, prayer_times):
        tmp_file = Path("tmp.ics")
        generate_slot_ics_file(prayer_times, base_date, tmp_file, timezone_str, padding_before, padding_after)
        with open(tmp_file, "rb") as f:
            sub_cal = Calendar.from_ical(f.read())
            for component in sub_cal.walk():
                if component.name == "VEVENT":
                    cal.add_component(component)
        tmp_file.unlink(missing_ok=True)

    if scope == "today":
        response = requests.get(f"{BASE_URL}/prayer-times")
        response.raise_for_status()
        append_day_to_calendar(now, response.json())
        filename = f"slots_{masjid_id}_{now.date()}.ics"

    elif scope == "month":
        month = now.month
        response = requests.get(f"{BASE_URL}/calendar/{month}")
        response.raise_for_status()
        calendar_data = response.json()
        for i, daily_times in enumerate(calendar_data):
            date_obj = datetime(YEAR, month, i + 1)
            append_day_to_calendar(date_obj, daily_times)
        filename = f"slots_{masjid_id}_{YEAR}_{month:02d}.ics"

    elif scope == "year":
        response = requests.get(f"{BASE_URL}/calendar")
        response.raise_for_status()
        calendar_data = response.json()["calendar"]
        for month_index, month_days in enumerate(calendar_data, start=1):
            for day_str, time_list in month_days.items():
                date_obj = datetime(YEAR, month_index, int(day_str))
                times_dict = dict(zip(["fajr", "sunrise", "dohr", "asr", "maghreb", "icha"], time_list))
                filtered = {k: v for k, v in times_dict.items() if k in PRAYERS_ORDER}
                append_day_to_calendar(date_obj, filtered)
        filename = f"slots_{masjid_id}_{YEAR}.ics"

    else:
        raise ValueError("Scope must be 'today', 'month' or 'year'")

    output_path = Path("static/ics") / filename
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(cal.to_ical())
    return str(output_path)
