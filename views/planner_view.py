import json
from pathlib import Path
from flask import render_template, abort, request
from modules.mawaqit_fetcher import fetch_mosques_data
from modules.prayer_generator import generate_prayer_ics_file
from modules.empty_generator import generate_empty_by_scope
from modules.slots_generator import generate_slots_by_scope
from modules.time_segmenter import segment_available_time
from modules.slot_utils import adjust_slots_rounding
from modules.mute_utils import apply_silent_settings


def normalize_month_data(prayer_times: dict) -> list[dict]:
    PRAYERS_KEYS = ["fajr", "sunset", "dohr", "asr", "maghreb", "icha"]
    normalized = []

    for day in sorted(prayer_times.keys(), key=lambda x: int(x)):
        raw = prayer_times[day]

        if isinstance(raw, list) and len(raw) == 6:
            if all(isinstance(t, str) and ":" in t for t in raw):
                normalized.append(dict(zip(PRAYERS_KEYS, raw)))
            else:
                print(f"⚠️ Jour {day} → horaire mal formé : {raw}")
        elif isinstance(raw, str) and "," in raw:
            parts = raw.split(',')
            if len(parts) == 6 and all(":" in p for p in parts):
                normalized.append(dict(zip(PRAYERS_KEYS, parts)))
            else:
                print(f"⚠️ Jour {day} → chaîne invalide : {raw}")
        elif isinstance(raw, dict):
            normalized.append(raw)
        else:
            print(f"⚠️ Jour {day} ignoré : format inattendu → {raw}")

    return normalized

def normalize_year_data(prayer_times: list) -> list[dict]:
    PRAYERS_KEYS = ["fajr", "sunset", "dohr", "asr", "maghreb", "icha"]
    year_normalized = []

    for month_index, month_days in enumerate(prayer_times, start=1):
        if not isinstance(month_days, dict):
            print(f"⚠️ Mois {month_index} ignoré (format inattendu)")
            continue

        normalized_month = {}
        for day_str, raw in month_days.items():
            if isinstance(raw, list) and len(raw) == 6:
                normalized_month[day_str] = dict(zip(PRAYERS_KEYS, raw))
            elif isinstance(raw, str) and "," in raw:
                parts = raw.split(',')
                if len(parts) == 6:
                    normalized_month[day_str] = dict(zip(PRAYERS_KEYS, parts))
            elif isinstance(raw, dict):
                normalized_month[day_str] = raw
            else:
                print(f"⚠️ {day_str}/{month_index} ignoré : {raw}")
        year_normalized.append(normalized_month)

    return year_normalized

def handle_planner_post(masjid_id, scope, padding_before, padding_after):
    masjid_id = request.form.get("masjid_id")
    scope = request.form.get("scope")

    padding_before = int(request.form.get('padding_before', 10))
    padding_after = int(request.form.get('padding_after', 35))

    try:
        print(f"📥 Requête reçue : masjid_id={masjid_id}, scope={scope}, padding_before={padding_before}, padding_after={padding_after}")

        prayer_times, tz_str = fetch_mosques_data(masjid_id, scope)

        print(f"📦 Données récupérées depuis fetch_mosques_data()")
        print(f"⏰ Fuseau horaire : {tz_str}")
        print(f"📊 Type de prayer_times : {type(prayer_times)}")
        print(f"📊 Aperçu brut prayer_times : {str(prayer_times)[:500]}")

        # 🔧 Normalisation des données pour les scopes long
        if scope == "month":
            print("🔧 Normalisation des données mensuelles...")
            prayer_times = normalize_month_data(prayer_times)
        elif scope == "year":
            print("🔧 Normalisation des données annuelles...")
            prayer_times = normalize_year_data(prayer_times)

        # 🕌 Fichier ICS prières
        ics_path = generate_prayer_ics_file(
            masjid_id=masjid_id,
            scope=scope,
            timezone_str=tz_str,
            padding_before=padding_before,
            padding_after=padding_after,
            prayer_times=prayer_times
        )
        ics_url = f"/static/ics/{Path(ics_path).name}"
        print(f"✅ Fichier ICS prières généré : {ics_url}")

        # 🕳️ Créneaux vides
        empty_path = generate_empty_by_scope(
            masjid_id=masjid_id,
            scope=scope,
            timezone_str=tz_str,
            padding_before=padding_before,
            padding_after=padding_after,
            prayer_times=prayer_times
        )
        empty_ics_url = f"/{empty_path}"
        print(f"✅ Fichier ICS créneaux vides généré : {empty_ics_url}")

        # 📊 Segment des créneaux
        segments = []
        if isinstance(prayer_times, list):
            print("📅 Traitement scope month/year sous forme de liste")
            for i, daily in enumerate(prayer_times):
                if not isinstance(daily, dict):
                    print(f"⚠️ Format inattendu jour {i+1}: {type(daily)} → {daily}")
                    continue
                try:
                    slots = segment_available_time(daily, tz_str, padding_before, padding_after)
                    segments.append({"day": i + 1, "slots": slots})
                except Exception as e:
                    print(f"⚠️ Erreur jour {i + 1} : {e}")
        elif isinstance(prayer_times, dict):
            print("📅 Traitement scope today sous forme de dictionnaire")
            segments = segment_available_time(prayer_times, tz_str, padding_before, padding_after)
            slots = adjust_slots_rounding(segments)
            silent_slots = apply_silent_settings(slots)
        else:
            print(f"⚠️ Format inattendu de prayer_times : {type(prayer_times)}")

        # 📂 Fichier ICS des créneaux disponibles
        slots_path = generate_slots_by_scope(
            masjid_id=masjid_id,
            scope=scope,
            timezone_str=tz_str,
            padding_before=padding_before,
            padding_after=padding_after,
            prayer_times=prayer_times 
        )
        slots_download_link = f"/{slots_path}"
        print(f"✅ Fichier ICS créneaux disponibles généré : {slots_download_link}")

        return render_template(
            "planner.html",
            download_link=ics_url,
            empty_download_link=empty_ics_url,
            slots_download_link=slots_download_link,
            segments=segments,
            timezone_str=tz_str
        )

    except Exception as e:
        print(f"❌ Erreur interne dans handle_planner_post : {e}")
        abort(500)
