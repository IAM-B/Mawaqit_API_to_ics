import re
import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime

# Fonction principale : récupère les données confData du site Mawaqit
def fetch_mawaqit_data(masjid_id: str) -> dict:
    url = f"https://mawaqit.net/fr/{masjid_id}"
    r = requests.get(url)

    if r.status_code == 404:
        raise ValueError(f"Mosquée introuvable pour le masjid_id : {masjid_id}")
    elif r.status_code != 200:
        raise RuntimeError(f"Erreur HTTP {r.status_code} lors de la requête pour {masjid_id}")

    soup = BeautifulSoup(r.text, 'html.parser')
    script = soup.find('script', string=re.compile(r'var\s+confData\s*=\s*{'))

    if not script:
        raise ValueError(f"Aucune balise <script> contenant confData pour {masjid_id}")

    match = re.search(r'var\s+confData\s*=\s*({.*?});\s*', script.string, re.DOTALL)
    if not match:
        raise ValueError(f"Impossible d’extraire le JSON confData pour {masjid_id}")

    try:
        conf_data = json.loads(match.group(1))
        return conf_data
    except json.JSONDecodeError as e:
        raise ValueError(f"Erreur JSON dans confData : {e}")

def fetch_mosques_data(masjid_id: str, scope: str):
    data = fetch_mawaqit_data(masjid_id)
    tz_str = data.get("timezone", "Europe/Paris")

    if scope == "today":
        return get_prayer_times_of_the_day(masjid_id), tz_str
    elif scope == "month":
        month_number = datetime.now().month
        return get_month(masjid_id, month_number), tz_str
    elif scope == "year":
        return get_calendar(masjid_id), tz_str
    else:
        raise ValueError(f"Scope inconnu : {scope}")
        
# Données du jour
def get_prayer_times_of_the_day(masjid_id: str) -> dict:
    conf_data = fetch_mawaqit_data(masjid_id)
    times = conf_data.get("times", [])
    sunset = conf_data.get("shuruq", "")

    if len(times) < 5:
        raise ValueError("Données incomplètes pour les horaires de prière.")

    return {
        "fajr": times[0],
        "sunset": sunset,
        "dohr": times[1],
        "asr": times[2],
        "maghreb": times[3],
        "icha": times[4]
    }

# Données mensuelles
def get_month(masjid_id: str, month_number: int):
    if not 1 <= month_number <= 12:
        raise ValueError("Le mois doit être compris entre 1 et 12.")

    conf_data = fetch_mawaqit_data(masjid_id)
    calendar = conf_data.get("calendar", [])

    if len(calendar) < month_number:
        raise ValueError("Ce mois n'est pas disponible dans le calendrier.")

    return calendar[month_number - 1]

# Données annuelles
def get_calendar(masjid_id: str):
    conf_data = fetch_mawaqit_data(masjid_id)
    calendar = conf_data.get("calendar", [])
    return calendar
