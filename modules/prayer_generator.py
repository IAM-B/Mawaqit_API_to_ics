from uuid import uuid4
from pathlib import Path
from zoneinfo import ZoneInfo
from icalendar import Calendar, Event
from datetime import datetime, timedelta, time
from modules.mawaqit_fetcher import fetch_mosques_data

PRAYERS_ORDER = ["fajr", "dohr", "asr", "maghreb", "icha"]

def parse_time_str(time_str: str, date_ref=None) -> datetime:
    if not date_ref:
        date_ref = datetime.today().date()
    h, m = map(int, time_str.strip().split(":"))
    return datetime.combine(date_ref, time(h, m))


def generate_prayer_ics_file(masjid_id: str, scope: str, timezone_str: str, padding_before: int, padding_after: int) -> str:
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

                alarm = Event()
                alarm.add('action', 'AUDIO')
                alarm.add('trigger', timedelta(minutes=0))
                alarm.add('description', f"🔊 Appel à la prière {name.capitalize()}")

                event.add_component(alarm)
                cal.add_component(event) 

            except Exception as e:
                print(f"⚠️ Erreur pour {name} ({time_str}) le {date_obj} : {e}")

    prayer_data, _tz = fetch_mosques_data(masjid_id, scope)

    if scope == "today":
        today = now.date()
        filtered_times = {k: v for k, v in prayer_data.items() if k in PRAYERS_ORDER}
        add_event(today, filtered_times)
        filename = f"horaires_priere_{masjid_id}_{today}.ics"

    elif scope == "month":
        month = now.month
        for i, daily_times in enumerate(prayer_data):
            try:
                date_obj = datetime(YEAR, month, i + 1)
                filtered_times = {k: v for k, v in daily_times.items() if k in PRAYERS_ORDER}
                add_event(date_obj, filtered_times)
            except Exception as e:
                print(f"⚠️ Erreur jour {i + 1}/{month} : {e}")
        filename = f"horaires_priere_{masjid_id}_{YEAR}_{month:02d}.ics"

    elif scope == "year":
        for month_index, month_days in enumerate(prayer_data, start=1):
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
