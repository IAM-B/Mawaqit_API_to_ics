"""
Planner view module for handling prayer time planning and ICS file generation.
This module processes prayer time data and generates various ICS calendar files.
"""

import json
from pathlib import Path
from flask import render_template, abort, request
from app.modules.mawaqit_fetcher import fetch_mosques_data
from app.modules.prayer_generator import generate_prayer_ics_file
from app.modules.empty_generator import generate_empty_by_scope
from app.modules.slots_generator import generate_slots_by_scope
from app.modules.time_segmenter import segment_available_time
from app.modules.slot_utils import adjust_slots_rounding
from app.modules.mute_utils import apply_silent_settings
from datetime import datetime


def normalize_month_data(prayer_times: dict) -> list[dict]:
    """
    Normalize prayer time data for a month.
    Converts various input formats into a standardized dictionary format.
    
    Args:
        prayer_times (dict): Raw prayer time data for a month
        
    Returns:
        list[dict]: List of normalized prayer time entries
    """
    PRAYERS_KEYS = ["fajr", "sunset", "dohr", "asr", "maghreb", "icha"]
    normalized = []
    current_year = datetime.now().year
    current_month = datetime.now().month

    for day in sorted(prayer_times.keys(), key=lambda x: int(x)):
        try:
            # Vérifier si la date est valide
            day_num = int(day)
            try:
                datetime(current_year, current_month, day_num)
            except ValueError as e:
                print(f"⚠️ Invalid date {day}/{current_month}: {e}")
                continue

            raw = prayer_times[day]

            if isinstance(raw, list) and len(raw) == 6:
                if all(isinstance(t, str) and ":" in t for t in raw):
                    normalized.append(dict(zip(PRAYERS_KEYS, raw)))
                else:
                    print(f"⚠️ Day {day} → Invalid time format: {raw}")
            elif isinstance(raw, str) and "," in raw:
                parts = raw.split(',')
                if len(parts) == 6 and all(":" in p for p in parts):
                    normalized.append(dict(zip(PRAYERS_KEYS, parts)))
                else:
                    print(f"⚠️ Day {day} → Invalid string format: {raw}")
            elif isinstance(raw, dict):
                normalized.append(raw)
            else:
                print(f"⚠️ Day {day} ignored: Unexpected format → {raw}")
        except Exception as e:
            print(f"⚠️ Error processing day {day}: {e}")
            continue

    return normalized

def normalize_year_data(prayer_times: list) -> list[dict]:
    """
    Normalize prayer time data for a year.
    Processes monthly data and ensures consistent format.
    
    Args:
        prayer_times (list): Raw prayer time data for a year
        
    Returns:
        list[dict]: List of normalized monthly prayer time entries
    """
    year_normalized = []
    current_year = datetime.now().year

    for month_index, month_days in enumerate(prayer_times, start=1):
        if not isinstance(month_days, dict):
            print(f"⚠️ Month {month_index} ignored (unexpected format)")
            continue

        normalized_month = {}
        for day_str, time_list in month_days.items():
            try:
                # Vérifier si la date est valide
                day_num = int(day_str)
                try:
                    datetime(current_year, month_index, day_num)
                except ValueError as e:
                    print(f"⚠️ Invalid date {day_str}/{month_index}: {e}")
                    continue

                if isinstance(time_list, list) and len(time_list) == 6:
                    if all(isinstance(t, str) and ":" in t for t in time_list):
                        normalized_month[day_str] = time_list
                    else:
                        print(f"⚠️ Invalid time format for {day_str}/{month_index}: {time_list}")
                else:
                    print(f"⚠️ Invalid time format for {day_str}/{month_index}: {time_list}")
            except Exception as e:
                print(f"⚠️ Error processing {day_str}/{month_index}: {e}")
                continue

        year_normalized.append(normalized_month)

    return year_normalized

def handle_planner_post(masjid_id, scope, padding_before, padding_after):
    """
    Handle prayer time planning requests and generate ICS files.
    Processes form data, normalizes prayer times, and generates three types of ICS files:
    1. Prayer times
    2. Empty slots
    3. Available slots
    
    Args:
        masjid_id (str): Mosque identifier
        scope (str): Time scope (today/month/year)
        padding_before (int): Minutes to add before prayer times
        padding_after (int): Minutes to add after prayer times
    """
    masjid_id = request.form.get("masjid_id")
    scope = request.form.get("scope")

    padding_before = int(request.form.get('padding_before', 10))
    padding_after = int(request.form.get('padding_after', 35))

    try:
        print(f"📥 Request received: masjid_id={masjid_id}, scope={scope}, padding_before={padding_before}, padding_after={padding_after}")

        # Fetch prayer times and timezone
        prayer_times, tz_str = fetch_mosques_data(masjid_id, scope)

        print(f"📦 Data retrieved from fetch_mosques_data()")
        print(f"⏰ Timezone: {tz_str}")
        print(f"📊 prayer_times type: {type(prayer_times)}")
        print(f"📊 Raw prayer_times preview: {str(prayer_times)[:500]}")

        # Normalize data for long scopes
        if scope == "month":
            print("🔧 Normalizing monthly data...")
            prayer_times = normalize_month_data(prayer_times)
        elif scope == "year":
            print("🔧 Normalizing yearly data...")
            prayer_times = normalize_year_data(prayer_times)

        # Generate prayer times ICS file
        ics_path = generate_prayer_ics_file(
            masjid_id=masjid_id,
            scope=scope,
            timezone_str=tz_str,
            padding_before=padding_before,
            padding_after=padding_after,
            prayer_times=prayer_times
        )
        ics_url = f"app/static/ics/{Path(ics_path).name}"
        print(f"✅ Prayer times ICS file generated: {ics_url}")

        # Generate empty slots ICS file
        empty_path = generate_empty_by_scope(
            masjid_id=masjid_id,
            scope=scope,
            timezone_str=tz_str,
            padding_before=padding_before,
            padding_after=padding_after,
            prayer_times=prayer_times
        )
        empty_ics_url = f"/{empty_path}"
        print(f"✅ Empty slots ICS file generated: {empty_ics_url}")

        # Process time segments
        segments = []
        if isinstance(prayer_times, list):
            print("📅 Processing month/year scope as list")
            for i, daily in enumerate(prayer_times):
                if not isinstance(daily, dict):
                    print(f"⚠️ Unexpected format for day {i+1}: {type(daily)} → {daily}")
                    continue
                try:
                    slots = segment_available_time(daily, tz_str, padding_before, padding_after)
                    segments.append({"day": i + 1, "slots": slots})
                except Exception as e:
                    print(f"⚠️ Error processing day {i + 1}: {e}")
        elif isinstance(prayer_times, dict):
            print("📅 Processing today scope as dictionary")
            segments = segment_available_time(prayer_times, tz_str, padding_before, padding_after)
            slots = adjust_slots_rounding(segments)
            silent_slots = apply_silent_settings(slots)
        else:
            print(f"⚠️ Unexpected prayer_times format: {type(prayer_times)}")

        # Generate available slots ICS file
        slots_path = generate_slots_by_scope(
            masjid_id=masjid_id,
            scope=scope,
            timezone_str=tz_str,
            padding_before=padding_before,
            padding_after=padding_after,
            prayer_times=prayer_times 
        )
        slots_download_link = f"/{slots_path}"
        print(f"✅ Available slots ICS file generated: {slots_download_link}")

        return render_template(
            "planner.html",
            download_link=ics_url,
            empty_download_link=empty_ics_url,
            slots_download_link=slots_download_link,
            segments=segments,
            timezone_str=tz_str
        )

    except Exception as e:
        print(f"❌ Internal error in handle_planner_post: {e}")
        abort(500)
