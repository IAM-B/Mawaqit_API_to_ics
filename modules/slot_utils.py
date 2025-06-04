from datetime import datetime, timedelta, time

def round_up_to_hour(dt):
    return (dt.replace(second=0, microsecond=0, minute=0) + timedelta(hours=1)) if dt.minute > 0 else dt

def round_down_to_hour(dt):
    return dt.replace(second=0, microsecond=0, minute=0)

def parse_time_str(s: str) -> datetime:
    """Convertit une chaîne ISO ou une heure seule ('HH:MM') en datetime"""
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        # si format 'HH:MM' uniquement
        if ":" in s and "-" not in s:
            h, m = map(int, s.strip().split(":"))
            return datetime.combine(datetime.today().date(), time(h, m))
        raise ValueError(f"Format non pris en charge : {s}")

def adjust_slots_rounding(slots):
    adjusted = []
    for slot in slots:
        start = slot['start']
        end = slot['end']

        if isinstance(start, str):
            start = parse_time_str(start)
        if isinstance(end, str):
            end = parse_time_str(end)

        start = round_up_to_hour(start)
        end = round_down_to_hour(end)

        if end > start:
            adjusted.append({'start': start, 'end': end})
    return adjusted
