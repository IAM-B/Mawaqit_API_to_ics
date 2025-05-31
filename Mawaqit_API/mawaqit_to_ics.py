import requests
from datetime import datetime, timedelta
from ics import Calendar, Event
from pytz import timezone

# 📍 Configuration globale
masjid_id = input("🕌 Entrez l'ID de la mosquée (ex: assalam-argenteuil) : ").strip()
BASE_URL = f"http://localhost:8000/api/v1/{masjid_id}"
YEAR = datetime.now().year
PRAYERS_ORDER = ["fajr", "dohr", "asr", "maghreb", "icha"]
LOCAL_TZ = timezone("Africa/Algiers")
cal = Calendar()

PADDING_BEFORE_MIN = 15
PADDING_AFTER_MIN = 35

# ✅ Fonction de création d'événements (prend un dict de type {"fajr": "06:43", ...})
def add_event(date_obj, times_dict):
    for name in PRAYERS_ORDER:
        time_str = times_dict.get(name)
        if not time_str:
            continue

        try:
            hour, minute = map(int, time_str.split(":"))
            local_dt = datetime.combine(date_obj, datetime.min.time()) + timedelta(hours=hour, minutes=minute)

            dt_base = LOCAL_TZ.localize(local_dt)
            dt_start = dt_base - timedelta(minutes=PADDING_BEFORE_MIN)
            dt_end = dt_base + timedelta(minutes=PADDING_AFTER_MIN)

            event = Event()
            event.name = f"{name.capitalize()} ({time_str})"
            event.begin = dt_start
            event.end = dt_end
            event.location = f"Mosquée {masjid_id.replace('-', ' ').title()}"
            event.description = f"Plage incluant préparation et prière ({PADDING_BEFORE_MIN} min avant / {PADDING_AFTER_MIN} min après)"
            cal.events.add(event)
        except Exception as e:
            print(f"⚠️ Erreur pour {name} ({time_str}) le {date_obj} : {e}")

# 🔘 Sélection utilisateur
print("\n📅 Quelle plage veux-tu exporter ?")
print("1. Aujourd'hui")
print("2. Mois au choix")
print("3. Année complète")
choice = input("Ton choix (1/2/3) : ").strip()
now = datetime.now()

if choice == "1":
    response = requests.get(f"{BASE_URL}/prayer-times")
    response.raise_for_status()
    prayer_times = response.json()
    today = now.date()
    filtered_times = {k: v for k, v in prayer_times.items() if k in PRAYERS_ORDER}
    times_dict = {name: filtered_times[name] for name in PRAYERS_ORDER if name in filtered_times}
    add_event(today, times_dict)

    output_file = f"horaires_priere_{masjid_id}_{today}.ics"
    with open(output_file, "w", encoding="utf-8") as f:
        f.writelines(cal)
    print(f"\n✅ Fichier généré : {output_file}")

elif choice == "2":
    month = int(input("🗓️ Numéro du mois à exporter (1-12) : "))
    if not 1 <= month <= 12:
        print("❌ Mois invalide.")
        exit(1)

    response = requests.get(f"{BASE_URL}/calendar/{month}")
    response.raise_for_status()
    calendar_data = response.json()

    for i, daily_times in enumerate(calendar_data):
        try:
            date_obj = datetime(YEAR, month, i + 1)
            filtered_times = {k: v for k, v in daily_times.items() if k in PRAYERS_ORDER}
            times_dict = {name: filtered_times[name] for name in PRAYERS_ORDER if name in filtered_times}
            add_event(date_obj, times_dict)
        except Exception as e:
            print(f"⚠️ Erreur jour {i+1}/{month} : {e}")

    output_file = f"horaires_priere_{masjid_id}_{YEAR}_{month:02d}.ics"
    with open(output_file, "w", encoding="utf-8") as f:
        f.writelines(cal)
    print(f"\n✅ Fichier généré : {output_file}")

elif choice == "3":
    response = requests.get(f"{BASE_URL}/calendar")
    response.raise_for_status()
    calendar_data = response.json()["calendar"]

    for month_index, month_dict in enumerate(calendar_data, start=1):
        for day_str, time_list in month_dict.items():
            try:
                date_obj = datetime(YEAR, month_index, int(day_str))
                if isinstance(time_list, list) and len(time_list) >= 6:
                    cleaned_list = [v for i, v in enumerate(time_list) if i != 1]
                    times_dict = dict(zip(PRAYERS_ORDER, cleaned_list[:len(PRAYERS_ORDER)]))
                    add_event(date_obj, times_dict)
                else:
                    print(f"⚠️ Format invalide jour {day_str}/{month_index} : {time_list}")
            except Exception as e:
                print(f"⚠️ Erreur {day_str}/{month_index} : {e}")

    output_file = f"horaires_priere_{masjid_id}_{YEAR}.ics"
    with open(output_file, "w", encoding="utf-8") as f:
        f.writelines(cal)
    print(f"\n✅ Fichier généré : {output_file}")
