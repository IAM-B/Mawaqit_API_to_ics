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
import re


def normalize_month_data(prayer_times: dict) -> list:
    """
    Normalize prayer times data for a month.
    Filters out invalid data and formats it consistently.

    Args:
        prayer_times (dict): Raw prayer times data for a month

    Returns:
        list: List of normalized prayer times dictionaries
    """
    normalized_data = []
    
    for day, times in prayer_times.items():
        try:
            # Validate day number
            day_num = int(day)
            if not 1 <= day_num <= 31:
                print(f"⚠️ Invalid date {day}/6: day is out of range for month")
                continue

            # Handle different input formats
            if isinstance(times, list):
                if len(times) != 6:
                    print(f"⚠️ Day {day} → Invalid time format: {times}")
                    continue
                try:
                    # Validate time format
                    for time in times:
                        if not isinstance(time, str) or not time.strip():
                            raise ValueError("Invalid time format")
                        # Basic time format validation
                        if not re.match(r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', time):
                            raise ValueError("Invalid time format")
                    
                    normalized_data.append({
                        "fajr": times[0],
                        "sunset": times[1],
                        "dohr": times[2],
                        "asr": times[3],
                        "maghreb": times[4],
                        "icha": times[5]
                    })
                except Exception as e:
                    print(f"⚠️ Day {day} → Invalid time format: {times}")
            elif isinstance(times, str):
                print(f"⚠️ Day {day} → Invalid string format: {times}")
            elif isinstance(times, dict):
                print(f"⚠️ Day {day} → Invalid dict format: {times}")
            else:
                print(f"⚠️ Day {day} ignored: Unexpected format → {times}")
        except ValueError as e:
            print(f"⚠️ Error processing day {day}: {e}")
            continue

    return normalized_data

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
                        # Convertir la liste en dictionnaire avec les noms des prières
                        times_dict = {
                            "fajr": time_list[0],
                            "sunset": time_list[1],
                            "dohr": time_list[2],
                            "asr": time_list[3],
                            "maghreb": time_list[4],
                            "icha": time_list[5]
                        }
                        normalized_month[day_str] = times_dict
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

    try:
        padding_before = int(request.form.get('padding_before', 10))
        padding_after = int(request.form.get('padding_after', 35))
    except ValueError:
        raise ValueError("Invalid padding values: padding_before and padding_after must be integers")

    if padding_before < 0 or padding_after < 0:
        raise ValueError("Invalid padding values: padding_before and padding_after must be positive integers")

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

        # Generate empty slots ICS file
        empty_slots_path = generate_empty_by_scope(
            masjid_id=masjid_id,
            scope=scope,
            timezone_str=tz_str,
            padding_before=padding_before,
            padding_after=padding_after,
            prayer_times=prayer_times
        )

        # Generate available slots ICS file
        available_slots_path = generate_slots_by_scope(
            masjid_id=masjid_id,
            scope=scope,
            timezone_str=tz_str,
            padding_before=padding_before,
            padding_after=padding_after,
            prayer_times=prayer_times
        )

        # Process time segments for display
        segments = []
        if isinstance(prayer_times, list):
            print("📅 Processing month/year scope as list")
            if scope == "month":
                month = datetime.now().month
                year = datetime.now().year
                for i, daily in enumerate(prayer_times):
                    if not isinstance(daily, dict):
                        print(f"⚠️ Unexpected format for day {i+1}: {type(daily)} → {daily}")
                        continue
                    try:
                        date = datetime(year, month, i + 1)
                        slots = segment_available_time(daily, tz_str, padding_before, padding_after)
                        segments.append({
                            "day": i + 1,
                            "date": date.strftime("%d/%m/%Y"),
                            "slots": slots,
                            "prayer_times": daily
                        })
                    except Exception as e:
                        print(f"⚠️ Error processing day {i + 1}: {e}")
            elif scope == "year":
                year = datetime.now().year
                for month_index, month_days in enumerate(prayer_times, start=1):
                    month_segments = []
                    month_date = datetime(year, month_index, 1)
                    for day_str, times_dict in month_days.items():
                        try:
                            day_num = int(day_str)
                            date = datetime(year, month_index, day_num)
                            slots = segment_available_time(times_dict, tz_str, padding_before, padding_after)
                            month_segments.append({
                                "day": day_num,
                                "date": date.strftime("%d/%m/%Y"),
                                "slots": slots,
                                "prayer_times": times_dict
                            })
                        except Exception as e:
                            print(f"⚠️ Error processing day {day_str} in month {month_index}: {e}")
                    segments.append({
                        "month": month_index,
                        "date": month_date.strftime("%B %Y"),
                        "days": month_segments
                    })
        elif isinstance(prayer_times, dict):
            print("📅 Processing today scope as dictionary")
            today = datetime.now()
            slots = segment_available_time(prayer_times, tz_str, padding_before, padding_after)
            segments = {
                "date": today.strftime("%d/%m/%Y"),
                "slots": slots,
                "prayer_times": prayer_times
            }
        else:
            print(f"⚠️ Unexpected prayer_times format: {type(prayer_times)}")

        return render_template(
            'planner.html',
            masjid_id=masjid_id,
            scope=scope,
            padding_before=padding_before,
            padding_after=padding_after,
            ics_path=ics_path,
            empty_slots_path=empty_slots_path,
            available_slots_path=available_slots_path,
            timezone_str=tz_str,
            segments=segments
        )

    except ValueError as e:
        print(f"❌ Validation error in handle_planner_post: {e}")
        raise
    except Exception as e:
        print(f"❌ Internal error in handle_planner_post: {e}")
        raise
