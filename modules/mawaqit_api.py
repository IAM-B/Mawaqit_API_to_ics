import requests
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

def fetch_mosques(masjid_id: str, scope: str = "today"):
    # ⏱️ Récupération des horaires de prière
    if scope == "today":
        url = f"{BASE_URL}/{masjid_id}/prayer-times"
    elif scope == "month":
        now = datetime.now()
        url = f"{BASE_URL}/{masjid_id}/calendar/{now.month}"
    elif scope == "year":
        url = f"{BASE_URL}/{masjid_id}/calendar"
    else:
        raise ValueError("Période invalide")

    prayer_response = requests.get(url)
    prayer_response.raise_for_status()
    prayer_data = prayer_response.json()

    # 🌍 Récupération du fuseau horaire (appel supplémentaire)
    info_url = f"{BASE_URL}/{masjid_id}"
    info_response = requests.get(info_url)
    info_response.raise_for_status()
    info_data = info_response.json()

    timezone_str = info_data.get("rawdata", {}).get("timezone", "UTC")

    return prayer_data, timezone_str
