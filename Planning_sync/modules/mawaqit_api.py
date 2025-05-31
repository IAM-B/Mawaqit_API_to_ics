import requests
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

def fetch_mosques(masjid_id: str, scope: str = "today"):
    if scope == "today":
        url = f"{BASE_URL}/{masjid_id}/prayer-times"
    elif scope == "month":
        now = datetime.now()
        url = f"{BASE_URL}/{masjid_id}/calendar/{now.month}"
    elif scope == "year":
        url = f"{BASE_URL}/{masjid_id}/calendar"
    else:
        raise ValueError("Période invalide")

    response = requests.get(url)
    response.raise_for_status()
    return response.json()