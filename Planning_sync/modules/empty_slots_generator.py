from datetime import datetime, timedelta
from ics import Calendar, Event

def generate_empty_slot_events(prayer_times: dict, date: datetime, filename: str = "empty_slots.ics"):
    PRAYERS_ORDER = ["fajr", "dohr", "asr", "maghreb", "icha"]
    calendar = Calendar()

    # Convertir en datetime les horaires
    def to_datetime(time_str): return datetime.combine(date, datetime.strptime(time_str, "%H:%M").time())

    slots = []
    for i in range(len(PRAYERS_ORDER) - 1):
        start = to_datetime(prayer_times[PRAYERS_ORDER[i]])
        end = to_datetime(prayer_times[PRAYERS_ORDER[i + 1]])

        # Premier créneau : de `start` à prochaine heure pleine
        next_hour = (start + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)
        if next_hour < end:
            slots.append((start, next_hour))

        # Créneaux horaires pleins
        current = next_hour
        while current + timedelta(hours=1) < end:
            slots.append((current, current + timedelta(hours=1)))
            current += timedelta(hours=1)

        # Dernier créneau
        if current < end:
            slots.append((current, end))

    # Ajout au calendrier
    for slot in slots:
        if not isinstance(slot, tuple) or len(slot) != 2:
            print(f"❌ Slot invalide détecté : {slot}")
            continue

        start, end = slot
        e = Event()
        e.name = "Créneau disponible"
        e.begin = start
        e.end = end
        calendar.events.add(e)


    # Sauvegarde
    with open(filename, "w") as f:
        f.write(calendar.serialize())

    return filename
