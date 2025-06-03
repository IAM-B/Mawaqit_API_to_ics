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

        # Appliquer le padding utilisateur
        start = to_datetime(t1) + timedelta(minutes=padding_after)
        end = to_datetime(t2) - timedelta(minutes=padding_before)
        if start >= end:
            continue

        # Heure ronde suivante après le début
        next_hour = (start + timedelta(minutes=59)).replace(minute=0, second=0, microsecond=0)
        if next_hour > end:
            slots.append((start, end))
            continue

        # Étendre d'une heure si possible sans dépasser la fin
        first_slot_end = next_hour + timedelta(hours=1)
        if first_slot_end > end:
            first_slot_end = end
        slots.append((start, first_slot_end))
        current = first_slot_end

        # Slots pleins de 1h
        while current + full_hour <= end:
            slots.append((current, current + full_hour))
            current += full_hour

        # Dernier slot : absorbe les minutes restantes
        if current < end:
            last_start, last_end = slots[-1]
            slots[-1] = (last_start, end)

    # Génération des événements ICS
    for start, end in slots:
        event = Event()
        event.add("uid", str(uuid4()))
        event.add("dtstart", start)
        event.add("dtend", end)
        event.add("transp", "TRANSPARENT")
        event.add("categories", "Empty slot")
        event.add("summary", "Créneau disponible")
        event.add("description", "Créneau libre entre deux prières")
        calendar.add_component(event)

    with open(filename, "wb") as f:
        f.write(calendar.to_ical())

    return filename
