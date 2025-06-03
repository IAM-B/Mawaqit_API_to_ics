import os
import json
from pathlib import Path

MOSQUE_DIR = Path(__file__).resolve().parent.parent / "data" / "mosques_by_country"

def list_countries():
    return [
        {"code": file.stem, "name": file.stem.upper()}
        for file in MOSQUE_DIR.glob("*.json")
    ]

def list_mosques_by_country(country_code: str):
    filepath = MOSQUE_DIR / f"{country_code}.json"
    if not filepath.exists():
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)
