import requests
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

def fetch_mosques(masjid_id: str, period: str = "day"):
    if period == "day":
        url = f"{BASE_URL}/{masjid_id}/prayer-times"
    elif period == "month":
        now = datetime.now()
        url = f"{BASE_URL}/{masjid_id}/calendar/{now.month}"
    elif period == "year":
        url = f"{BASE_URL}/{masjid_id}/calendar"
    else:
        raise ValueError("Période invalide")

    response = requests.get(url)
    response.raise_for_status()
    return response.json()