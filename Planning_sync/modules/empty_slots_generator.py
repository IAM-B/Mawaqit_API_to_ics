from datetime import datetime, timedelta
from icalendar import Calendar, Event
from zoneinfo import ZoneInfo
from uuid import uuid4

def generate_empty_slot_events(
    prayer_times: dict,
    base_date: datetime,
    filename: str,
    timezone_str: str,
    padding_before: int,
    padding_after: int
) -> str:
    PRAYERS_ORDER = ["fajr", "dohr", "asr", "maghreb", "icha"]
    tz = ZoneInfo(timezone_str)

    calendar = Calendar()
    calendar.add('prodid', '-//Planning Sync//Mawaqit//FR')
    calendar.add('version', '2.0')

    def to_datetime(time_str):
        try:
            t = datetime.strptime(time_str, "%H:%M").time()
            return datetime.combine(base_date.date(), t).replace(tzinfo=tz)
        except Exception as e:
            print(f"⛔ Erreur parsing {time_str}: {e}")
            return None

    slots = []
    for i in range(len(PRAYERS_ORDER) - 1):
        t1 = prayer_times.get(PRAYERS_ORDER[i])
        t2 = prayer_times.get(PRAYERS_ORDER[i + 1])
        if not t1 or not t2:
            continue

        start = to_datetime(t1)
        end = to_datetime(t2)
        if not start or not end or start >= end:
            continue

        # Appliquer le padding utilisateur
        start += timedelta(minutes=padding_after)
        end -= timedelta(minutes=padding_before)
        if start >= end:
            continue

        # Premier créneau : de `start` à prochaine heure pleine
        next_hour = (start + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)
        if next_hour < end:
            slots.append((start, next_hour))

        # Ne crée pas un slot partiel si trop court (< 30 min), mais l'absorbe dans le créneau suivant
        min_slot_duration = timedelta(minutes=30)
        full_hour = timedelta(hours=1)

        current = start
        while current + full_hour <= end:
            slots.append((current, current + full_hour))
            current += full_hour

        # S’il reste un petit créneau à la fin (> 0), l’ajoute à la dernière tranche
        if current < end:
            if slots:
                # Étend la fin du dernier slot
                last_start, last_end = slots[-1]
                if end - last_end < min_slot_duration:
                    slots[-1] = (last_start, end)
                else:
                    slots.append((current, end))
            else:
                slots.append((current, end))

    for start, end in slots:
        event = Event()
        event.add("uid", str(uuid4()))
        event.add("dtstart", start)
        event.add("dtend", end)
        event.add("summary", "Créneau disponible")
        event.add("description", "Créneau libre entre deux prières")
        calendar.add_component(event)

    with open(filename, "wb") as f:
        f.write(calendar.to_ical())

    return filename
