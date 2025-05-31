from ics import Calendar, Event
from datetime import datetime, timedelta
from pytz import timezone
import os

LOCAL_TZ = timezone("Africa/Algiers")
PRAYERS_ORDER = ["fajr", "dohr", "asr", "maghreb", "icha"]

def generate_ics_file(prayer_times: dict, masjid_id: str, period: str):
    cal = Calendar()
    today = datetime.now().date()

    for name in PRAYERS_ORDER:
        time_str = prayer_times.get(name)
        if not time_str:
            continue

        try:
            hour, minute = map(int, time_str.split(":"))
            local_dt = datetime.combine(today, datetime.min.time()) + timedelta(hours=hour, minutes=minute)
            dt_base = LOCAL_TZ.localize(local_dt)
            dt_start = dt_base - timedelta(minutes=15)
            dt_end = dt_base + timedelta(minutes=35)

            event = Event()
            event.name = f"{name.capitalize()} ({time_str})"
            event.begin = dt_start
            event.end = dt_end
            event.location = f"Mosquée {masjid_id.replace('-', ' ').title()}"
            cal.events.add(event)
        except Exception as e:
            print(f"Erreur lors de la création de l'événement {name}: {e}")

    filename = f"horaires_priere_{masjid_id}_{period}.ics"
    file_path = os.path.join("data", filename)
    with open(file_path, "w", encoding="utf-8") as f:
        f.writelines(cal)

    return f"/data/{filename}"