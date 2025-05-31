from datetime import datetime, timedelta
from config import config

def segment_available_time(prayer_times: dict):
    times = []
    padding_before = config.PADDING_BEFORE_MIN
    padding_after = config.PADDING_AFTER_MIN

    for key, time_str in prayer_times.items():
        try:
            hour, minute = map(int, time_str.split(":"))
            dt = datetime.combine(datetime.today(), datetime.min.time()) + timedelta(hours=hour, minutes=minute)
            times.append(dt)
        except Exception:
            continue

    times = sorted(times)
    segments = []

    for i in range(len(times) - 1):
        start = times[i] + timedelta(minutes=padding_before)
        end = times[i + 1] - timedelta(minutes=padding_after)
        if start < end:
            segments.append({"start": start.strftime("%H:%M"), "end": end.strftime("%H:%M")})

    return segments


def generate_empty_slots(start_time: str, end_time: str, date: datetime) -> list[tuple[datetime, datetime]]:
    slots = []
    fmt = "%H:%M"
    start_dt = datetime.combine(date, datetime.strptime(start_time, fmt).time())
    end_dt = datetime.combine(date, datetime.strptime(end_time, fmt).time())

    # Première tranche partielle
    rounded_start = (start_dt + timedelta(minutes=60)).replace(minute=0, second=0, microsecond=0)
    if rounded_start > end_dt:
        slots.append((start_dt, end_dt))
        return slots
    slots.append((start_dt, rounded_start))

    # Tranches horaires pleines
    current = rounded_start
    while current + timedelta(hours=1) <= end_dt:
        next_hour = current + timedelta(hours=1)
        slots.append((current, next_hour))
        current = next_hour

    # Dernière tranche partielle
    if current < end_dt:
        slots.append((current, end_dt))

    return slots
