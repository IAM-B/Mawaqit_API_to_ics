import json
from pathlib import Path
from flask import render_template, abort
from modules.mawaqit_fetcher import fetch_mosques_data
from modules.prayer_generator import generate_prayer_ics_file
from modules.empty_generator import generate_empty_by_scope
from modules.slots_generator import generate_slots_by_scope
from modules.time_segmenter import segment_available_time
from modules.slot_utils import adjust_slots_rounding
from modules.mute_utils import apply_silent_settings

def safe_json_parse(obj):
    if isinstance(obj, str):
        try:
            return json.loads(obj)
        except Exception as e:
            print(f"⚠️ JSON parsing error: {e} ➤ contenu: {obj}")
            return None
    elif isinstance(obj, dict):
        return obj
    return None

def handle_planner_post(masjid_id, scope, padding_before, padding_after):
    try:
        prayer_times, tz_str = fetch_mosques_data(masjid_id, scope)

        ics_path = generate_prayer_ics_file(masjid_id, scope, tz_str, padding_before, padding_after)
        empty_path = generate_empty_by_scope(masjid_id, scope, tz_str, padding_before, padding_after)
        slots_path = generate_slots_by_scope(masjid_id, scope, tz_str, padding_before, padding_after)

        ics_url = f"/static/ics/{Path(ics_path).name}"
        empty_url = f"/{empty_path}"
        slots_url = f"/{slots_path}"

        segments = []

        # 🟢 TODAY ➤ dict avec les 6 prières
        if isinstance(prayer_times, dict):
            if set(prayer_times.keys()) == {"fajr", "sunset", "dohr", "asr", "maghreb", "icha"}:
                segments = segment_available_time(prayer_times, tz_str, padding_before, padding_after)
                segments = adjust_slots_rounding(segments)
                segments = apply_silent_settings(segments)
            else:
                segments = []
                for day_key, daily in prayer_times.items():
                    try:
                        slots = segment_available_time(daily, tz_str, padding_before, padding_after)
                        segments.append({"day": day_key, "slots": slots})
                    except Exception as e:
                        print(f"⚠️ Erreur jour {day_key} : {e}")

        else:
            print(f"⚠️ Type inattendu : {type(prayer_times)}")

        print("DEBUG >> type prayer_times:", type(prayer_times))
        print("DEBUG >> sample prayer_times:", prayer_times[:1] if isinstance(prayer_times, list) else prayer_times)

        return render_template(
            "planner.html",
            download_link=ics_url,
            empty_download_link=empty_url,
            slots_download_link=slots_url,
            segments=segments,
            timezone_str=tz_str
        )

    except Exception as e:
        print(f"❌ Erreur interne dans handle_planner_post : {e}")
        abort(500)
