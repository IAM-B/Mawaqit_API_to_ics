import os
from datetime import datetime
from icalendar import Calendar


def parse_ics_events(ics_path, category_key=None):
    """
    Parse un fichier ICS et retourne une liste d'événements avec leurs champs utiles.
    Si category_key est fourni, filtre sur cette catégorie.
    """
    events = []
    if not os.path.exists(ics_path):
        return events
    with open(ics_path, 'rb') as f:
        cal = Calendar.from_ical(f.read())
        for component in cal.walk():
            if component.name == "VEVENT":
                summary = str(component.get('summary', ''))
                dtstart = component.get('dtstart')
                dtend = component.get('dtend')
                if not dtstart or not dtend:
                    print(f"⚠️ Événement ignoré (pas de DTSTART/DTEND) : {summary}")
                    continue
                start = dtstart.dt
                end = dtend.dt
                category = str(component.get('categories', ''))
                description = str(component.get('description', ''))
                uid = str(component.get('uid', ''))
                # On ne garde que la date (pour regrouper par jour)
                if isinstance(start, datetime):
                    date_str = start.strftime('%Y-%m-%d')
                    start_str = start.strftime('%H:%M')
                    end_str = end.strftime('%H:%M')
                else:
                    continue
                if category_key and category_key not in category:
                    continue
                events.append({
                    'summary': summary,
                    'start': start_str,
                    'end': end_str,
                    'date': date_str,
                    'category': category,
                    'description': description,
                    'uid': uid
                })
    return events


def parse_year_ics(prayers_ics, slots_ics, empty_ics):
    """
    Parse les trois ICS annuels et retourne une structure JSON par jour.
    """
    prayers = parse_ics_events(prayers_ics)
    slots = parse_ics_events(slots_ics, category_key="Empty slots")
    empty = parse_ics_events(empty_ics, category_key="Empty slot")

    # Regrouper par date
    days = {}
    for ev in prayers:
        days.setdefault(ev['date'], {'prayers': [], 'slots': [], 'empty': []})
        days[ev['date']]['prayers'].append(ev)
    for ev in slots:
        days.setdefault(ev['date'], {'prayers': [], 'slots': [], 'empty': []})
        days[ev['date']]['slots'].append(ev)
    for ev in empty:
        days.setdefault(ev['date'], {'prayers': [], 'slots': [], 'empty': []})
        days[ev['date']]['empty'].append(ev)

    # Générer la liste triée par date
    result = []
    for date in sorted(days.keys()):
        result.append({
            'date': date,
            'prayers': days[date]['prayers'],
            'slots': days[date]['slots'],
            'empty': days[date]['empty']
        })
    return result 