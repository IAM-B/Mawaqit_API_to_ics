import os
import requests
from pathlib import Path
from datetime import datetime, timedelta, time
from icalendar import Calendar, Event
from uuid import uuid4
from zoneinfo import ZoneInfo

PRAYERS_ORDER = ["fajr", "dohr", "asr", "maghreb", "icha"]

def parse_time_str(time_str: str, date_ref=None) -> datetime:
    if not date_ref:
        date_ref = datetime.today().date()
    h, m = map(int, time_str.strip().split(":"))
    return datetime.combine(date_ref, time(h, m))


def generate_slot_ics_file(slots, filepath, timezone_str):
    tz = ZoneInfo(timezone_str)
    cal = Calendar()

    for slot in slots:
        try:
            start = slot["start"]
            end = slot["end"]

            if isinstance(start, str):
                start = parse_time_str(start)
            if isinstance(end, str):
                end = parse_time_str(end)

            if start.tzinfo is None:
                start = start.replace(tzinfo=tz)
                end = end.replace(tzinfo=tz)

            event = Event()
            event.add('uid', str(uuid4()))
            event.add('dtstart', start)
            event.add('dtend', end)
            event.add('summary', slot.get('summary', 'Créneau libre'))
            event.add('description', slot.get('description', ''))
            event.add('transp', 'TRANSPARENT' if slot.get('transparent') else 'OPAQUE')
            if slot.get('mute'):
                event.add('X-MOZ-SOUND', 'None')
            cal.add_component(event)
        except Exception as e:
            print(f"⚠️ Erreur de slot : {e} ({slot})")

    with open(filepath, 'wb') as f:
        f.write(cal.to_ical())


def generate_prayer_ics_file(masjid_id: str, scope: str, timezone_str: str, padding_before: int, padding_after: int) -> str:
    BASE_URL = f"http://localhost:8000/api/v1/{masjid_id}"
    YEAR = datetime.now().year
    tz = ZoneInfo(timezone_str)
    cal = Calendar()
    now = datetime.now()

    def add_event(date_obj, times_dict):
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
                event.add('location', f"Mosquée {masjid_id.replace('-', ' ').title()}")
                event.add('description', f"Prière incluant {padding_before} min avant et {padding_after} min après")
                cal.add_component(event)
            except Exception as e:
                print(f"⚠️ Erreur pour {name} ({time_str}) le {date_obj} : {e}")

    if scope == "today":
        response = requests.get(f"{BASE_URL}/prayer-times")
        response.raise_for_status()
        prayer_times = response.json()
        today = now.date()
        filtered_times = {k: v for k, v in prayer_times.items() if k in PRAYERS_ORDER}
        add_event(today, filtered_times)
        filename = f"horaires_priere_{masjid_id}_{today}.ics"

    elif scope == "month":
        month = now.month
        response = requests.get(f"{BASE_URL}/calendar/{month}")
        response.raise_for_status()
        calendar_data = response.json()
        for i, daily_times in enumerate(calendar_data):
            try:
                date_obj = datetime(YEAR, month, i + 1)
                filtered_times = {k: v for k, v in daily_times.items() if k in PRAYERS_ORDER}
                add_event(date_obj, filtered_times)
            except Exception as e:
                print(f"⚠️ Erreur jour {i + 1}/{month} : {e}")
        filename = f"horaires_priere_{masjid_id}_{YEAR}_{month:02d}.ics"

    elif scope == "year":
        response = requests.get(f"{BASE_URL}/calendar")
        response.raise_for_status()
        calendar_data = response.json()["calendar"]

        for month_index, month_days in enumerate(calendar_data, start=1):
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
                    print(f"⚠️ Erreur {day_str}/{month_index} : {e}")
        filename = f"horaires_priere_{masjid_id}_{YEAR}.ics"

    else:
        raise ValueError("Scope must be 'today', 'month', or 'year'")

    output_path = Path("static/ics") / filename
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(cal.to_ical())
    return str(output_path)


def generate_empty_event_ics_file(slots: list[tuple[datetime, datetime]], filename: str, timezone_str: str):
    tz = ZoneInfo(timezone_str)
    cal = Calendar()

    for start, end in slots:
        start = start.replace(tzinfo=tz)
        end = end.replace(tzinfo=tz)

        event = Event()
        event.add("uid", str(uuid4()))
        event.add("summary", "⏳ Créneau disponible")
        event.add("dtstart", start)
        event.add("dtend", end)
        event.add("description", "Créneau libre entre deux prières")
        cal.add_component(event)

    with open(filename, "wb") as f:
        f.write(cal.to_ical())