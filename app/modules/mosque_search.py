"""
Mosque Search Module

This module handles mosque data retrieval and formatting for the application.
It provides functions to list countries, search mosques by country, and format
mosque data for display in the frontend.

Key functionalities:
- Country listing from JSON files
- Mosque search by country code
- Data formatting for TomSelect dropdowns
- GPS coordinates validation
"""

import os
import re
import json
from pathlib import Path
from flask import request, jsonify, current_app

def get_mosque_dir():
    """
    Get the directory path where mosque JSON files are stored.
    
    Returns:
        Path: Directory path for mosque data files
    """
    return Path(current_app.config.get('MOSQUE_DATA_DIR', Path(__file__).resolve().parents[2] / "data" / "mosques_by_country"))

def get_formatted_mosques():
    """
    Get formatted mosque data for a specific country.
    
    This function retrieves mosque data for the requested country and formats it
    for use in TomSelect dropdowns. It ensures GPS coordinates are present and
    creates a display text combining name, city, address, zipcode, and slug.
    
    Returns:
        JSON response: Formatted mosque data with text field for display
    """
    country = request.args.get("country")
    mosques = list_mosques_by_country(country)

    # Format each mosque for display
    for m in mosques:
        # Create display text by combining relevant fields
        m["text"] = " - ".join(filter(None, [
            m.get("name", ""),
            m.get("city", ""),
            m.get("address", ""),
            m.get("zipcode", ""),
            m.get("slug", "")
        ]))
        
        # Ensure GPS coordinates are present (set to None if missing)
        if "lat" not in m:
            m["lat"] = None
        if "lng" not in m:
            m["lng"] = None

    return jsonify(mosques)
    
def format_country_display(filename):
    """
    Format country filename for display.
    
    Converts filename to a human-readable country name by:
    - Removing file extension
    - Removing trailing numbers
    - Converting underscores to spaces
    - Converting to uppercase
    
    Args:
        filename (str): Country filename (e.g., "france_2023.json")
        
    Returns:
        str: Formatted country name (e.g., "FRANCE")
    """
    if not filename:
        return ""
    name = Path(filename).stem
    name = re.sub(r"\d+$", "", name)  # Remove trailing numbers
    return name.replace("_", " ").upper()

def list_countries():
    """
    Get list of available countries with mosque data.
    
    Scans the mosque data directory for JSON files and returns
    a list of countries with their codes and display names.
    
    Returns:
        list: List of dictionaries with country code and name
    """
    return [
        {
            "code": file.stem,
            "name": format_country_display(file.name)
        }
        for file in get_mosque_dir().glob("*.json")
    ]

def list_mosques_by_country(country_code: str):
    """
    Get all mosques for a specific country.
    
    Reads the JSON file for the given country code and returns
    the list of mosques with their details.
    
    Args:
        country_code (str): Country code (e.g., "france", "belgium")
        
    Returns:
        list: List of mosque dictionaries, empty list if file not found
    """
    filepath = get_mosque_dir() / f"{country_code}.json"
    if not filepath.exists():
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)
