from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

def segment_available_time(prayer_times: dict, tz_str: str, padding_before: int, padding_after: int):
    times = []
    tz = ZoneInfo(tz_str)

    if not isinstance(prayer_times, dict):
        print(f"⛔ segment_available_time reçu mauvais type : {type(prayer_times)} → {prayer_times}")
        return []
        
    for name, time_str in prayer_times.items():
        try:
            hour, minute = map(int, time_str.strip().split(":"))
            dt = datetime.now(tz).replace(hour=hour, minute=minute, second=0, microsecond=0)
            times.append(dt)
        except Exception as e:
            print(f"⚠️ Ignoré : {name} → '{time_str}' ({e})")

    if len(times) < 2:
        print("⚠️ Pas assez d'horaires valides pour générer des segments.")
        return []

    times = sorted(times)
    segments = []

    for i in range(len(times) - 1):
        start = times[i] + timedelta(minutes=padding_before)
        end = times[i + 1] - timedelta(minutes=padding_after)
        if start < end:
            segments.append({"start": start.strftime("%H:%M"), "end": end.strftime("%H:%M")})
        else:
            print(f"⛔ Créneau invalide ignoré entre {times[i]} et {times[i+1]}")

    return segments


def generate_empty_slots(start_time: str, end_time: str, date: datetime) -> list[tuple[datetime, datetime]]:

    fmt = "%H:%M"
    slots = []

    start_dt = datetime.combine(date, datetime.strptime(start_time, fmt).time())
    end_dt = datetime.combine(date, datetime.strptime(end_time, fmt).time())

    if start_dt >= end_dt:
        print(f"⚠️ Créneau vide ignoré : {start_time} >= {end_time}")
        return []

    # Tranche partielle au début
    next_hour = (start_dt + timedelta(minutes=60)).replace(minute=0, second=0, microsecond=0)
    if next_hour > end_dt:
        slots.append((start_dt, end_dt))
        return slots

    slots.append((start_dt, next_hour))

    # Tranches horaires pleines
    current = next_hour
    while current + timedelta(hours=1) <= end_dt:
        next_slot = current + timedelta(hours=1)
        slots.append((current, next_slot))
        current = next_slot

    # Dernière tranche partielle
    if current < end_dt:
        slots.append((current, end_dt))

    return slots
