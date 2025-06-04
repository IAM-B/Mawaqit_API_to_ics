import os
import re
import json
from pathlib import Path
from flask import request, jsonify

MOSQUE_DIR = Path(__file__).resolve().parent.parent / "data" / "mosques_by_country"

def get_formatted_mosques():
    country = request.args.get("country")
    mosques = list_mosques_by_country(country)

    for m in mosques:
        m["text"] = " - ".join(filter(None, [
            m.get("name", ""),
            m.get("city", ""),
            m.get("address", ""),
            m.get("zipcode", ""),
            m.get("slug", "")
        ]))

    return jsonify(mosques)
    
def format_country_display(filename):
    name = Path(filename).stem
    name = re.sub(r"\d+$", "", name)
    return name.replace("_", " ").upper()

def list_countries():
    return [
        {
            "code": file.stem,
            "name": format_country_display(file.name)
        }
        for file in MOSQUE_DIR.glob("*.json")
    ]

def list_mosques_by_country(country_code: str):
    filepath = MOSQUE_DIR / f"{country_code}.json"
    if not filepath.exists():
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)
