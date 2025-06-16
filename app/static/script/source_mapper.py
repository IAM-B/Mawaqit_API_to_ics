import json
import re
import time
import requests
import logging
from pathlib import Path
from bs4 import BeautifulSoup
from datetime import datetime, timezone
from unidecode import unidecode
from flask import current_app

# === CONFIG ===
BASE_URL = current_app.config['MAWAQIT_BASE_URL']
HTML_MAIN = BASE_URL
API_URL_TEMPLATE = f"{BASE_URL}/api/2.0/mosque/map/{{code}}"
DATA_DIR = Path("data/mosques_by_country")
META_FILE = Path("data/metadata.json")
LOG_FILE = Path(current_app.config['LOG_FILE'])
DATA_DIR.mkdir(parents=True, exist_ok=True)

# === LOGGING SETUP ===
logging.basicConfig(
    filename=LOG_FILE,
    filemode="a",
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=getattr(logging, current_app.config['LOG_LEVEL'])
)

def log(msg, level="info"):
    print(msg)
    getattr(logging, level)(msg)

# === SANITIZE COUNTRY NAME ===
def sanitize_country_name(name: str) -> str:
    name = unidecode(name)
    name = name.lower()
    name = re.sub(r"[’'‘]", "", name)
    name = re.sub(r"\s+", "_", name)
    name = re.sub(r"[^\w\-]", "", name)
    return name

# === GET COUNTRY CODES FROM MAIN PAGE ===
def get_country_codes() -> dict:
    try:
        res = requests.get(HTML_MAIN, timeout=10)
        res.raise_for_status()
    except Exception as e:
        log(f"[✘] Erreur récupération pays : {e}", "error")
        return {}

    soup = BeautifulSoup(res.text, "html.parser")
    buttons = soup.select("button.country")
    if not buttons:
        log("[✘] Aucun bouton de pays trouvé. La structure HTML a peut-être changé.", "error")
        return {}

    countries = {}
    for btn in buttons:
        try:
            data = json.loads(btn.get("data-data"))
            countries[data["country"]] = {
                "count": data["nb"],
                "name": btn.get_text(strip=True).split("\n")[0]
            }
        except Exception as e:
            log(f"[!] Erreur parsing bouton pays : {e}", "warning")
            continue
    return countries

# === LOAD EXISTING METADATA ===
def load_existing_metadata():
    if META_FILE.exists():
        try:
            with open(META_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
                else:
                    # ⚠️ Si le fichier contenait un ancien format (dict), on le convertit dans une liste
                    return [data]
        except Exception as e:
            log(f"[!] Erreur lecture metadata : {e}", "warning")
    return []

# === SAVE METADATA APPEND ===
def append_metadata(entry):
    metadata_log = load_existing_metadata()
    metadata_log.insert(0, entry)
    with open(META_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata_log, f, indent=2, ensure_ascii=False)


# === MAIN SCRAPER ===
def main():
    log("[🌍] Début du scraping depuis la page principale...")
    countries = get_country_codes()
    if not countries:
        log("[✘] Aucun pays valide récupéré. Arrêt du script.", "error")
        return

    total_mosques = 0
    updated_countries = 0
    for code, info in countries.items():
        country_name = sanitize_country_name(info['name'])
        api_url = API_URL_TEMPLATE.format(code=code)
        output_file = DATA_DIR / f"{country_name}.json"

        current_count = 0
        if output_file.exists():
            try:
                with open(output_file, "r", encoding="utf-8") as f:
                    existing_data = json.load(f)
                    current_count = len(existing_data)
            except Exception as e:
                log(f"[!] Erreur lecture {output_file.name} : {e}", "warning")

        if current_count >= info["count"] * 0.98:
            log(f"[✓] Aucun changement pour {country_name} ({current_count} mosquées)")
            total_mosques += current_count
            continue

        try:
            r = requests.get(api_url, timeout=10)
            r.raise_for_status()
            mosques = r.json()
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(mosques, f, indent=2, ensure_ascii=False)
            log(f"[⬆] Mise à jour : {country_name}.json ({len(mosques)} mosquées)")
            total_mosques += len(mosques)
            updated_countries += 1
        except Exception as e:
            log(f"[✘] Échec du scraping pour {code} : {e}", "error")

    metadata_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_countries": len(countries),
        "updated_countries": updated_countries,
        "total_mosques": total_mosques
    }
    append_metadata(metadata_entry)

    log(f"[✔] Terminé : {updated_countries} pays mis à jour / {len(countries)} total, {total_mosques} mosquées")

if __name__ == "__main__":
    main()
