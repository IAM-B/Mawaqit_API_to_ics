"""
Planner view module for handling prayer time planning and ICS file generation.
This module processes prayer time data and generates various ICS calendar files.
"""

import json
from pathlib import Path
from flask import render_template, abort, request, jsonify, Blueprint
from app.modules.mawaqit_fetcher import fetch_mosques_data, fetch_mawaqit_data
from app.modules.prayer_generator import generate_prayer_ics_file
from app.modules.empty_generator import generate_empty_by_scope
from app.modules.slots_generator import generate_slots_by_scope
from app.modules.time_segmenter import segment_available_time, generate_empty_slots_for_timeline
from app.modules.slot_utils import adjust_slots_rounding
from datetime import datetime, timedelta
import re
from app.modules.ics_parser import parse_year_ics
from app.modules.cache_manager import cache_manager

planner_api = Blueprint('planner_api', __name__)

def normalize_month_data(prayer_times: dict, include_sunset: bool = True) -> list:
    """
    Normalize prayer times data for a month.
    Filters out invalid data and formats it consistently.

    Args:
        prayer_times (dict): Raw prayer times data for a month
        include_sunset (bool): Whether to include sunset in the data

    Returns:
        list: List of normalized prayer times dictionaries
    """
    normalized_data = []
    current_year = datetime.now().year
    current_month = datetime.now().month
    
    # Get the number of days in this month
    try:
        if current_month == 12:
            last_day = datetime(current_year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = datetime(current_year, current_month + 1, 1) - timedelta(days=1)
        days_in_month = last_day.day
    except Exception as e:
        print(f"⚠️ Error calculating days for month {current_month}: {e}")
        days_in_month = 31  # Fallback to 31 days
    
    # Process existing days from the data
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
                    
                    if include_sunset:
                        normalized_data.append({
                            "fajr": times[0],
                            "sunset": times[1],
                            "dohr": times[2],
                            "asr": times[3],
                            "maghreb": times[4],
                            "icha": times[5]
                        })
                    else:
                        normalized_data.append({
                            "fajr": times[0],
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
    
    # Fill missing days with the last available day's data
    if normalized_data:
        # Get the last available day's data as template
        template_data = normalized_data[-1]
        
        # Fill missing days
        for day_num in range(1, days_in_month + 1):
            if day_num > len(normalized_data):
                # Use template data for missing days
                normalized_data.append(template_data.copy())
                print(f"📅 Generated data for day {day_num}/{current_month} using template")

    return normalized_data

def normalize_year_data(prayer_times: list, include_sunset: bool = True) -> list[dict]:
    """
    Normalize prayer time data for a year.
    Processes monthly data and ensures consistent format.
    
    Args:
        prayer_times (list): Raw prayer time data for a year
        include_sunset (bool): Whether to include sunset in the data
        
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
        
        # Get the number of days in this month
        try:
            if month_index == 12:
                last_day = datetime(current_year + 1, 1, 1) - timedelta(days=1)
            else:
                last_day = datetime(current_year, month_index + 1, 1) - timedelta(days=1)
            days_in_month = last_day.day
        except Exception as e:
            print(f"⚠️ Error calculating days for month {month_index}: {e}")
            days_in_month = 31  # Fallback to 31 days
        
        # Process existing days from the data
        for day_str, time_list in month_days.items():
            try:
                # Check if date is valid
                day_num = int(day_str)
                try:
                    datetime(current_year, month_index, day_num)
                except ValueError as e:
                    print(f"⚠️ Invalid date {day_str}/{month_index}: {e}")
                    continue

                if isinstance(time_list, list) and len(time_list) == 6:
                    if all(isinstance(t, str) and ":" in t for t in time_list):
                        # Convert list to dictionary with prayer names
                        if include_sunset:
                            times_dict = {
                                "fajr": time_list[0],
                                "sunset": time_list[1],
                                "dohr": time_list[2],
                                "asr": time_list[3],
                                "maghreb": time_list[4],
                                "icha": time_list[5]
                            }
                        else:
                            times_dict = {
                                "fajr": time_list[0],
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
        
        # Fill missing days with the last available day's data
        if normalized_month:
            # Get the last available day's data as template
            last_available_day = max(normalized_month.keys(), key=int)
            template_data = normalized_month[last_available_day]
            
            # Fill missing days
            for day_num in range(1, days_in_month + 1):
                day_str = str(day_num)
                if day_str not in normalized_month:
                    # Use template data for missing days
                    normalized_month[day_str] = template_data.copy()
                    print(f"📅 Generated data for day {day_str}/{month_index} using template")
        
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
        include_sunset = request.form.get('include_sunset') == 'on'
    except ValueError:
        raise ValueError("Invalid padding values: padding_before and padding_after must be integers")

    if padding_before < 0 or padding_after < 0:
        raise ValueError("Invalid padding values: padding_before and padding_after must be positive integers")

    if scope not in ("today", "month", "year"):
        raise ValueError("Scope must be 'today', 'month', or 'year'")

    try:
        print(f"📥 Request received: masjid_id={masjid_id}, scope={scope}, padding_before={padding_before}, padding_after={padding_after}")

        # Get coordinates from form
        mosque_lat = request.form.get("mosque_lat")
        mosque_lng = request.form.get("mosque_lng")
        mosque_name = request.form.get("mosque_name")
        mosque_address = request.form.get("mosque_address")
        
        print(f"📍 Coordinates from form: lat={mosque_lat}, lng={mosque_lng}")
        print(f"🕌 Mosque info from form: name={mosque_name}, address={mosque_address}")

        # Fetch prayer times and timezone
        prayer_times, tz_str = fetch_mosques_data(masjid_id, scope)

        print(f"📦 Data retrieved from fetch_mosques_data()")
        print(f"⏰ Timezone: {tz_str}")
        print(f"📊 prayer_times type: {type(prayer_times)}")
        print(f"📊 Raw prayer_times preview: {str(prayer_times)[:500]}")

        # Use form coordinates if available, otherwise retrieve from JSON
        if mosque_lat and mosque_lng and mosque_name:
            lat = float(mosque_lat)
            lng = float(mosque_lng)
            mosque_slug = masjid_id
            print(f"🕌 Using coordinates from form: lat={lat}, lng={lng}")
        else:
            # Fallback: retrieve from JSON files
            mosque_info = get_mosque_info_from_json(masjid_id)
            
            if mosque_info:
                mosque_name = mosque_info["name"]
                mosque_address = mosque_info["address"]
                lat = mosque_info["lat"]
                lng = mosque_info["lng"]
                mosque_slug = mosque_info["slug"]
                
                print(f"🕌 Mosque info from JSON: name={mosque_name}, lat={lat}, lng={lng}")
            else:
                # Fallback to web scraping if not found in JSON
                mosque_data = fetch_mawaqit_data(masjid_id)
                mosque_name = mosque_data.get("name", "Unknown Mosque")
                mosque_address = mosque_data.get("address", "")
                lat = mosque_data.get("lat")
                lng = mosque_data.get("lng")
                mosque_slug = mosque_data.get("slug", masjid_id)
                
                print(f"🕌 Mosque info from web: name={mosque_name}, lat={lat}, lng={lng}")
        
        # Use GPS coordinates if address is not available
        if not mosque_address and lat and lng:
            mosque_address = f"GPS Coordinates: {lat}, {lng}"
        elif not mosque_address:
            mosque_address = "Adresse non disponible"
        
        # Create map links
        google_maps_url = ""
        osm_url = ""
        if lat and lng:
            google_maps_url = f"https://www.google.com/maps?q={lat},{lng}"
            osm_url = f"https://www.openstreetmap.org/?mlat={lat}&mlon={lng}&zoom=15"
        
        # Build Mawaqit link with correct format
        mawaqit_url = f"https://mawaqit.net/fr/{mosque_slug}"

        # Format scope display
        scope_display_map = {
            "today": "Aujourd'hui",
            "month": "Ce mois",
            "year": "Cette année"
        }
        scope_display = scope_display_map.get(scope, scope)

        # Format dates
        today = datetime.now()
        start_date = today.strftime("%d/%m/%Y")
        
        if scope == "month":
            # From beginning to end of month
            start_date = today.replace(day=1).strftime("%d/%m/%Y")
            # Find last day of month
            if today.month == 12:
                end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
            end_date = end_date.strftime("%d/%m/%Y")
        elif scope == "year":
            # From beginning to end of year
            start_date = today.replace(month=1, day=1).strftime("%d/%m/%Y")
            end_date = today.replace(month=12, day=31).strftime("%d/%m/%Y")
        else:
            # For today, same date
            end_date = start_date

        # Normalize data for long scopes
        if scope == "month":
            print("🔧 Normalizing monthly data...")
            prayer_times = normalize_month_data(prayer_times, include_sunset=include_sunset)
        elif scope == "year":
            print("🔧 Normalizing yearly data...")
            prayer_times = normalize_year_data(prayer_times, include_sunset=include_sunset)

        # Generate prayer times ICS file
        ics_path = generate_prayer_ics_file(
            masjid_id=masjid_id,
            scope=scope,
            timezone_str=tz_str,
            padding_before=padding_before,
            padding_after=padding_after,
            prayer_times=prayer_times,
            include_sunset=include_sunset
        )

        # Generate empty slots ICS file
        empty_slots_path = generate_empty_by_scope(
            masjid_id=masjid_id,
            scope=scope,
            timezone_str=tz_str,
            padding_before=padding_before,
            padding_after=padding_after,
            prayer_times=prayer_times,
            include_sunset=include_sunset
        )

        # Generate available slots ICS file
        available_slots_path = generate_slots_by_scope(
            masjid_id=masjid_id,
            scope=scope,
            timezone_str=tz_str,
            padding_before=padding_before,
            padding_after=padding_after,
            prayer_times=prayer_times,
            include_sunset=include_sunset
        )

        # Process time segments for display
        segments = []
        if scope == "today":
            print("📅 Processing today scope")
            if isinstance(prayer_times, dict):
                slots = segment_available_time(prayer_times, tz_str, padding_before, padding_after)
                empty_slots = generate_empty_slots_for_timeline(slots)
                segments.append({
                    "day": datetime.now().day,
                    "date": datetime.now().strftime("%d/%m/%Y"),
                    "slots": slots,
                    "empty_slots": empty_slots,
                    "prayer_times": prayer_times
                })
        elif isinstance(prayer_times, list):
            print("📅 Processing month/year scope as list")
            if scope == "month":
                # Use target month/year if provided, otherwise use current
                if target_month and target_year:
                    month = int(target_month)
                    year = int(target_year)
                else:
                    month = datetime.now().month
                    year = datetime.now().year
                    
                for i, daily in enumerate(prayer_times):
                    if not isinstance(daily, dict):
                        print(f"⚠️ Unexpected format for day {i+1}: {type(daily)} → {daily}")
                        continue
                    try:
                        date = datetime(year, month, i + 1)
                        slots = segment_available_time(daily, tz_str, padding_before, padding_after)
                        empty_slots = generate_empty_slots_for_timeline(slots)
                        segments.append({
                            "day": i + 1,
                            "date": date.strftime("%d/%m/%Y"),
                            "slots": slots,
                            "empty_slots": empty_slots,
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
                            empty_slots = generate_empty_slots_for_timeline(slots)
                            month_segments.append({
                                "day": day_num,
                                "date": date.strftime("%d/%m/%Y"),
                                "slots": slots,
                                "empty_slots": empty_slots,
                                "prayer_times": times_dict
                            })
                        except Exception as e:
                            print(f"⚠️ Error processing day {day_str} in month {month_index}: {e}")
                    segments.append({
                        "month": month_index,
                        "date": month_date.strftime("%B %Y"),
                        "days": month_segments
                    })

        return render_template(
            "planner.html",
            masjid_id=masjid_id,
            scope=scope,
            segments=segments,
            padding_before=padding_before,
            padding_after=padding_after,
            ics_path=ics_path,
            empty_slots_path=empty_slots_path,
            available_slots_path=available_slots_path,
            timezone_str=tz_str,
            mosque_name=mosque_name,
            mosque_address=mosque_address,
            mawaqit_url=mawaqit_url,
            scope_display=scope_display,
            start_date=start_date,
            end_date=end_date,
            google_maps_url=google_maps_url,
            osm_url=osm_url,
            mosque_lat=lat,
            mosque_lng=lng
        )

    except Exception as e:
        print(f"❌ Error in handle_planner_post: {e}")
        if isinstance(e, ValueError):
            raise
        return render_template("error.html", error_message=str(e))

def get_mosque_info_from_json(masjid_id):
    """
    Retrieve mosque information from local JSON files
    """
    data_dir = Path("data/mosques_by_country")
    
    for json_file in data_dir.glob("*.json"):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                mosques = json.load(f)
                
            for mosque in mosques:
                if mosque.get("slug") == masjid_id:
                    return {
                        "name": mosque.get("name", "Unknown Mosque"),
                        "address": mosque.get("address", ""),
                        "city": mosque.get("city", ""),
                        "zipcode": mosque.get("zipcode", ""),
                        "lat": mosque.get("lat"),
                        "lng": mosque.get("lng"),
                        "slug": mosque.get("slug")
                    }
        except Exception as e:
            print(f"⚠️ Error reading {json_file}: {e}")
            continue
    
    return None

def handle_planner_ajax():
    """
    Handle AJAX prayer time planning requests and return JSON response.
    """
    try:
        # Get form data
        masjid_id = request.form.get("masjid_id")
        scope = request.form.get("scope")
        padding_before = int(request.form.get('padding_before', 10))
        padding_after = int(request.form.get('padding_after', 35))
        include_sunset = request.form.get('include_sunset') == 'on'
        
        # Get target month/year for navigation (optional)
        target_month = request.form.get("target_month")
        target_year = request.form.get("target_year")

        if not masjid_id or not scope:
            return {"error": "Missing required parameters"}, 400

        if padding_before < 0 or padding_after < 0:
            return {"error": "Invalid padding values"}, 400

        if scope not in ("today", "month", "year"):
            return {"error": "Invalid scope"}, 400

        print(f"📥 AJAX Request received: masjid_id={masjid_id}, scope={scope}, padding_before={padding_before}, padding_after={padding_after}")

        # Get coordinates from form
        mosque_lat = request.form.get("mosque_lat")
        mosque_lng = request.form.get("mosque_lng")
        mosque_name = request.form.get("mosque_name")
        mosque_address = request.form.get("mosque_address")

        # Fetch prayer times and timezone
        prayer_times, tz_str = fetch_mosques_data(masjid_id, scope)

        # Use form coordinates if available, otherwise retrieve from JSON
        if mosque_lat and mosque_lng and mosque_name:
            lat = float(mosque_lat)
            lng = float(mosque_lng)
            mosque_slug = masjid_id
        else:
            # Fallback: retrieve from JSON files
            mosque_info = get_mosque_info_from_json(masjid_id)
            
            if mosque_info:
                mosque_name = mosque_info["name"]
                mosque_address = mosque_info["address"]
                lat = mosque_info["lat"]
                lng = mosque_info["lng"]
                mosque_slug = mosque_info["slug"]
            else:
                # Fallback to web scraping if not found in JSON
                mosque_data = fetch_mawaqit_data(masjid_id)
                mosque_name = mosque_data.get("name", "Unknown Mosque")
                mosque_address = mosque_data.get("address", "")
                lat = mosque_data.get("lat")
                lng = mosque_data.get("lng")
                mosque_slug = mosque_data.get("slug", masjid_id)

        # Use GPS coordinates if address is not available
        if not mosque_address and lat and lng:
            mosque_address = f"GPS Coordinates: {lat}, {lng}"
        elif not mosque_address:
            mosque_address = "Adresse non disponible"

        # Create map links
        google_maps_url = ""
        osm_url = ""
        if lat and lng:
            google_maps_url = f"https://www.google.com/maps?q={lat},{lng}"
            osm_url = f"https://www.openstreetmap.org/?mlat={lat}&mlon={lng}&zoom=15"

        # Build Mawaqit link
        mawaqit_url = f"https://mawaqit.net/fr/{mosque_slug}"

        # Format scope display
        scope_display_map = {
            "today": "Aujourd'hui",
            "month": "Ce mois",
            "year": "Cette année"
        }
        scope_display = scope_display_map.get(scope, scope)

        # Format dates
        today = datetime.now()
        start_date = today.strftime("%d/%m/%Y")
        
        if scope == "month":
            start_date = today.replace(day=1).strftime("%d/%m/%Y")
            if today.month == 12:
                end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
            end_date = end_date.strftime("%d/%m/%Y")
        elif scope == "year":
            start_date = today.replace(month=1, day=1).strftime("%d/%m/%Y")
            end_date = today.replace(month=12, day=31).strftime("%d/%m/%Y")
        else:
            end_date = start_date

        # Normalize data for long scopes
        if scope == "month":
            prayer_times = normalize_month_data(prayer_times, include_sunset=include_sunset)
        elif scope == "year":
            prayer_times = normalize_year_data(prayer_times, include_sunset=include_sunset)

        # Generate ICS files
        ics_path = generate_prayer_ics_file(
            masjid_id=masjid_id,
            scope=scope,
            timezone_str=tz_str,
            padding_before=padding_before,
            padding_after=padding_after,
            prayer_times=prayer_times,
            include_sunset=include_sunset
        )

        empty_slots_path = generate_empty_by_scope(
            masjid_id=masjid_id,
            scope=scope,
            timezone_str=tz_str,
            padding_before=padding_before,
            padding_after=padding_after,
            prayer_times=prayer_times,
            include_sunset=include_sunset
        )

        available_slots_path = generate_slots_by_scope(
            masjid_id=masjid_id,
            scope=scope,
            timezone_str=tz_str,
            padding_before=padding_before,
            padding_after=padding_after,
            prayer_times=prayer_times,
            include_sunset=include_sunset
        )

        # Process time segments for display
        segments = []
        if scope == "today":
            if isinstance(prayer_times, dict):
                slots = segment_available_time(prayer_times, tz_str, padding_before, padding_after)
                empty_slots = generate_empty_slots_for_timeline(slots)
                segments.append({
                    "day": datetime.now().day,
                    "date": datetime.now().strftime("%d/%m/%Y"),
                    "slots": slots,
                    "empty_slots": empty_slots,
                    "prayer_times": prayer_times
                })
        elif isinstance(prayer_times, list):
            if scope == "month":
                # Use target month/year if provided, otherwise use current
                if target_month and target_year:
                    month = int(target_month)
                    year = int(target_year)
                else:
                    month = datetime.now().month
                    year = datetime.now().year
                    
                for i, daily in enumerate(prayer_times):
                    if not isinstance(daily, dict):
                        continue
                    try:
                        date = datetime(year, month, i + 1)
                        slots = segment_available_time(daily, tz_str, padding_before, padding_after)
                        empty_slots = generate_empty_slots_for_timeline(slots)
                        segments.append({
                            "day": i + 1,
                            "date": date.strftime("%d/%m/%Y"),
                            "slots": slots,
                            "empty_slots": empty_slots,
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
                            empty_slots = generate_empty_slots_for_timeline(slots)
                            month_segments.append({
                                "day": day_num,
                                "date": date.strftime("%d/%m/%Y"),
                                "slots": slots,
                                "empty_slots": empty_slots,
                                "prayer_times": times_dict
                            })
                        except Exception as e:
                            print(f"⚠️ Error processing day {day_str} in month {month_index}: {e}")
                    segments.append({
                        "month": month_index,
                        "date": month_date.strftime("%B %Y"),
                        "days": month_segments
                    })

        # Return JSON response
        return {
            "success": True,
            "data": {
                "segments": segments,
                "ics_path": ics_path,
                "empty_slots_path": empty_slots_path,
                "available_slots_path": available_slots_path,
                "timezone_str": tz_str,
                "mosque_name": mosque_name,
                "mosque_address": mosque_address,
                "mawaqit_url": mawaqit_url,
                "scope_display": scope_display,
                "start_date": start_date,
                "end_date": end_date,
                "padding_before": padding_before,
                "padding_after": padding_after,
                "scope": scope,
                "mosque_lat": lat,
                "mosque_lng": lng,
                "masjid_id": masjid_id,
                "google_maps_url": google_maps_url,
                "osm_url": osm_url
            }
        }

    except Exception as e:
        print(f"❌ Error in handle_planner_ajax: {e}")
        return {"error": str(e)}, 500

def handle_generate_ics():
    """
    Handle AJAX requests to generate ICS files for specific scopes.
    """
    try:
        # Get JSON data
        data = request.get_json()
        
        if not data:
            return {"error": "No data provided"}, 400
            
        masjid_id = data.get("masjid_id")
        scope = data.get("scope")
        padding_before = int(data.get('padding_before', 10))
        padding_after = int(data.get('padding_after', 35))

        if not masjid_id or not scope:
            return {"error": "Missing required parameters"}, 400

        if padding_before < 0 or padding_after < 0:
            return {"error": "Invalid padding values"}, 400

        if scope not in ("today", "month"):
            return {"error": "Invalid scope. Only 'today' and 'month' are supported for ICS generation"}, 400

        print(f"📥 ICS Generation Request: masjid_id={masjid_id}, scope={scope}, padding_before={padding_before}, padding_after={padding_after}")

        # Fetch prayer times and timezone
        prayer_times, tz_str = fetch_mosques_data(masjid_id, scope)

        # Normalize data for month scope
        if scope == "month":
            prayer_times = normalize_month_data(prayer_times)

        # Generate ICS file
        ics_path = generate_prayer_ics_file(
            masjid_id=masjid_id,
            scope=scope,
            timezone_str=tz_str,
            padding_before=padding_before,
            padding_after=padding_after,
            prayer_times=prayer_times,
            include_sunset=include_sunset
        )

        # Return JSON response
        return {
            "success": True,
            "ics_path": ics_path,
            "scope": scope
        }

    except Exception as e:
        print(f"❌ Error in handle_generate_ics: {e}")
        return {"error": str(e)}, 500

@planner_api.route('/api/timeline_ics', methods=['GET'])
def api_timeline_ics():
    """
    API qui retourne la structure JSON de la timeline à partir des ICS annuels.
    Reçoit en paramètre masjid_id, year, month (optionnel pour filtrer).
    """
    import os
    masjid_id = request.args.get('masjid_id')
    year = request.args.get('year')
    month = request.args.get('month')  # optionnel
    if not masjid_id or not year:
        return jsonify({'error': 'masjid_id and year are required'}), 400
    ics_dir = os.path.join('app', 'static', 'ics')
    prayers_ics = os.path.join(ics_dir, f'prayer_times_{masjid_id}_{year}.ics')
    slots_ics = os.path.join(ics_dir, f'slots_{masjid_id}_{year}.ics')
    empty_ics = os.path.join(ics_dir, f'empty_slots_{masjid_id}_{year}.ics')
    data = parse_year_ics(prayers_ics, slots_ics, empty_ics)
    if month:
        # Filtrer sur le mois demandé (format MM ou M)
        month = int(month)
        data = [d for d in data if int(d['date'][5:7]) == month]
    return jsonify({'timeline': data})

@planner_api.route('/api/cache/stats', methods=['GET'])
def api_cache_stats():
    """
    API for getting cache statistics.
    """
    try:
        stats = cache_manager.get_cache_stats()
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@planner_api.route('/api/cache/clear', methods=['POST'])
def api_cache_clear():
    """
    API for clearing the cache.
    Accepts an optional max_age_hours parameter.
    """
    try:
        data = request.get_json() or {}
        max_age_hours = data.get('max_age_hours')
        
        if max_age_hours is not None:
            max_age_hours = int(max_age_hours)
        
        cache_manager.clear_cache(max_age_hours)
        
        return jsonify({
            'success': True,
            'message': f'Cache cleared successfully (max_age_hours: {max_age_hours})'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@planner_api.route('/api/cache/check', methods=['GET'])
def api_cache_check():
    """
    API for checking if a file is in cache.
    Parameters: masjid_id, scope, padding_before, padding_after, include_sunset, file_type
    """
    try:
        masjid_id = request.args.get('masjid_id')
        scope = request.args.get('scope')
        padding_before = int(request.args.get('padding_before', 10))
        padding_after = int(request.args.get('padding_after', 35))
        include_sunset = request.args.get('include_sunset', 'false').lower() == 'true'
        file_type = request.args.get('file_type')
        
        if not all([masjid_id, scope, file_type]):
            return jsonify({'error': 'Missing required parameters'}), 400
        
        is_valid = cache_manager.is_cache_valid(
            masjid_id, scope, padding_before, padding_after, include_sunset, file_type
        )
        
        cached_path = None
        if is_valid:
            cached_path = cache_manager.get_cached_file_path(
                masjid_id, scope, padding_before, padding_after, include_sunset, file_type
            )
        
        return jsonify({
            'success': True,
            'is_valid': is_valid,
            'cached_path': cached_path,
            'parameters': {
                'masjid_id': masjid_id,
                'scope': scope,
                'padding_before': padding_before,
                'padding_after': padding_after,
                'include_sunset': include_sunset,
                'file_type': file_type
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
