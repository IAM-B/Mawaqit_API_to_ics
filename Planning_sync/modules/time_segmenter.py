from datetime import datetime, timedelta

def segment_available_time(prayer_times: dict, padding=15):
    times = []

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
        start = times[i] + timedelta(minutes=padding)
        end = times[i + 1] - timedelta(minutes=padding)
        if start < end:
            segments.append({"start": start.strftime("%H:%M"), "end": end.strftime("%H:%M")})

    return segments