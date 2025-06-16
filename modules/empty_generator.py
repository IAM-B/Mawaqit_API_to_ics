from uuid import uuid4
from pathlib import Path
from zoneinfo import ZoneInfo
from icalendar import Calendar, Event
from datetime import datetime, timedelta, time

PRAYERS_ORDER = ["fajr", "dohr", "asr", "maghreb", "icha"]

def to_datetime(time_str: str, base_date: datetime, tz: ZoneInfo) -> datetime:
    t = datetime.strptime(time_str, "%H:%M").time()
    return datetime.combine(base_date.date(), t).replace(tzinfo=tz)

def format_duration(delta: timedelta) -> str:
    total_minutes = int(delta.total_seconds() // 60)
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
    tz = ZoneInfo(timezone_str)
    calendar = Calendar()
    calendar.add('prodid', '-//Planning Sync//Mawaqit//FR')
    calendar.add('version', '2.0')

    def to_datetime(time_str: str) -> datetime:
        t = datetime.strptime(time_str, "%H:%M").time()
        return datetime.combine(base_date.date(), t).replace(tzinfo=tz)

    full_hour = timedelta(hours=1)
    slots = []

    for i in range(len(PRAYERS_ORDER) - 1):
        t1 = prayer_times.get(PRAYERS_ORDER[i])
        t2 = prayer_times.get(PRAYERS_ORDER[i + 1])
        if not t1 or not t2:
            continue

        start = to_datetime(t1) + timedelta(minutes=padding_after)
        end = to_datetime(t2) - timedelta(minutes=padding_before)
        if start >= end:
            continue

        next_hour = (start + timedelta(minutes=59)).replace(minute=0, second=0, microsecond=0)
        if next_hour > end:
            slots.append((start, end))
            continue

        first_slot_end = min(next_hour + timedelta(hours=1), end)
        slots.append((start, first_slot_end))
        current = first_slot_end

        while current + full_hour <= end:
            slots.append((current, current + full_hour))
            current += full_hour

        if current < end and slots:
            last_start, last_end = slots[-1]
            slots[-1] = (last_start, end)

    for start, end in slots:
        duration = end - start
        formatted = format_duration(duration)

        event = Event()
        event.add("uid", str(uuid4()))
        event.add("dtstart", start)
        event.add("dtend", end)
        event.add("transp", "TRANSPARENT")
        event.add("categories", "Empty slot")
        event.add("summary", f"Créneau ({formatted})")
        event.add("description", "Créneau libre entre deux prières")
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
    YEAR = datetime.now().year
    now = datetime.now()
    tz = ZoneInfo(timezone_str)
    cal = Calendar()
    cal.add('prodid', '-//Planning Sync//Mawaqit//FR')
    cal.add('version', '2.0')

    def append_day_to_calendar(base_date, daily_times: dict):
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
                        # Suppression de l'heure du lever du soleil (index 1)
                        cleaned_list = [v for i, v in enumerate(time_list) if i != 1]
                        times_dict = dict(zip(PRAYERS_ORDER, cleaned_list[:len(PRAYERS_ORDER)]))
                        append_day_to_calendar(date_obj, times_dict)
                except Exception as e:
                    print(f"⚠️ Erreur {day_str}/{month_index} : {e}")
        filename = f"empty_slots_{masjid_id}_{YEAR}.ics"

    else:
        raise ValueError("Scope must be 'today', 'month' or 'year'")

    output_path = Path("static/ics") / filename
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(cal.to_ical())
    return str(output_path)
