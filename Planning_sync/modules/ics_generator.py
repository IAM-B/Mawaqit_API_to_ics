import os
import requests
import pandas as pd
import pytz
from pathlib import Path
from datetime import datetime, timedelta
from icalendar import Calendar, Event
from ics import Calendar, Event
from pytz import timezone


def generate_ics_file(masjid_id: str, scope: str) -> str:
    BASE_URL = f"http://localhost:8000/api/v1/{masjid_id}"
    YEAR = datetime.now().year
    PRAYERS_ORDER = ["fajr", "dohr", "asr", "maghreb", "icha"]
    LOCAL_TZ = timezone("Africa/Algiers")
    PADDING_BEFORE_MIN = 15
    PADDING_AFTER_MIN = 35
    cal = Calendar()
    now = datetime.now()

    def add_event(date_obj, times_dict):
        for name in PRAYERS_ORDER:
            time_str = times_dict.get(name)
            if not time_str:
                continue
            try:
                hour, minute = map(int, time_str.split(":"))
                local_dt = datetime.combine(date_obj, datetime.min.time()) + timedelta(hours=hour, minutes=minute)
                dt_base = LOCAL_TZ.localize(local_dt)
                dt_start = dt_base - timedelta(minutes=PADDING_BEFORE_MIN)
                dt_end = dt_base + timedelta(minutes=PADDING_AFTER_MIN)
                event = Event()
                event.name = f"{name.capitalize()} ({time_str})"
                event.begin = dt_start
                event.end = dt_end
                event.location = f"Mosquée {masjid_id.replace('-', ' ').title()}"
                event.description = f"Plage incluant préparation et prière ({PADDING_BEFORE_MIN} min avant / {PADDING_AFTER_MIN} min après)"
                cal.events.add(event)
            except Exception as e:
                print(f"⚠️ Erreur pour {name} ({time_str}) le {date_obj} : {e}")

    if scope == "today":
        response = requests.get(f"{BASE_URL}/prayer-times")
        response.raise_for_status()
        prayer_times = response.json()
        today = now.date()
        filtered_times = {k: v for k, v in prayer_times.items() if k in PRAYERS_ORDER}
        times_dict = {name: filtered_times[name] for name in PRAYERS_ORDER if name in filtered_times}
        add_event(today, times_dict)
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
                times_dict = {name: filtered_times[name] for name in PRAYERS_ORDER if name in filtered_times}
                add_event(date_obj, times_dict)
            except Exception as e:
                print(f"⚠️ Erreur jour {i + 1}/{month} : {e}")
        filename = f"horaires_priere_{masjid_id}_{YEAR}_{month:02d}.ics"

    elif scope == "year":
        response = requests.get(f"{BASE_URL}/calendar")
        response.raise_for_status()
        calendar_data = response.json()["calendar"]

        for month_index, month_days in enumerate(calendar_data, start=1):
            if not isinstance(month_days, dict):
                print(f"⚠️ Format inattendu pour le mois {month_index}: {month_days}")
                continue
            for day_str, time_list in month_days.items():
                try:
                    date_obj = datetime(YEAR, month_index, int(day_str))
                    if isinstance(time_list, list) and len(time_list) >= 6:
                        cleaned_list = [v for i, v in enumerate(time_list) if i != 1]  # on enlève "sunrise"
                        times_dict = dict(zip(PRAYERS_ORDER, cleaned_list[:len(PRAYERS_ORDER)]))
                        add_event(date_obj, times_dict)
                    else:
                        print(f"⚠️ Format invalide jour {day_str}/{month_index} : {time_list}")
                except Exception as e:
                    print(f"⚠️ Erreur {day_str}/{month_index} : {e}")

        filename = f"horaires_priere_{masjid_id}_{YEAR}.ics"

    else:
        raise ValueError("Scope must be 'today', 'month', or 'year'")

    output_path = Path("static/ics") / filename
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.writelines(cal)
    return str(output_path)

def generate_empty_event_ics_file(slots: list[tuple[datetime, datetime]], filename: str):
    cal = Calendar()
    timezone = pytz.timezone("Africa/Algiers")

    for start, end in slots:
        event = Event()
        event.add("summary", "⏳ Créneau disponible")
        event.add("dtstart", timezone.localize(start))
        event.add("dtend", timezone.localize(end))
        event.add("description", "Créneau libre entre deux prières")
        cal.add_component(event)

    with open(filename, "wb") as f:
        f.write(cal.to_ical())