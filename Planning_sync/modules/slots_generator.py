from datetime import datetime
from icalendar import Calendar, Event
from zoneinfo import ZoneInfo
from uuid import uuid4

def generate_slot_ics_file(slots: list[dict], filepath: str, timezone_str: str):
    tz = ZoneInfo(timezone_str)
    cal = Calendar()

    for slot in slots:
        try:
            start = slot["start"]
            end = slot["end"]

            if isinstance(start, str):
                start = datetime.fromisoformat(start)
            if isinstance(end, str):
                end = datetime.fromisoformat(end)

            if start.tzinfo is None:
                start = start.replace(tzinfo=tz)
            if end.tzinfo is None:
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
