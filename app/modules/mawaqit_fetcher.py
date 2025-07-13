"""
Mawaqit data fetcher module for retrieving prayer times from the Mawaqit website.
This module handles web scraping and data extraction from the Mawaqit platform.
"""

import json
import re
import time
from datetime import datetime

import requests
from bs4 import BeautifulSoup
from flask import current_app

# Cache to store retrieved data
_data_cache = {}


def clear_mawaqit_cache():
    """
    Vide le cache interne utilisé par fetch_mawaqit_data.
    À utiliser dans les tests pour garantir un comportement sans cache.
    """
    _data_cache.clear()


def fetch_mawaqit_data(
    masjid_id: str, max_retries: int = 2, retry_delay: float = 2.0
) -> dict:
    """
    Main function to fetch confData from the Mawaqit website.
    Scrapes the mosque's page and extracts the configuration data containing prayer times.

    Args:
        masjid_id (str): Mosque identifier from Mawaqit
        max_retries (int): Maximum number of retry attempts (default: 1)
        retry_delay (float): Delay in seconds between retries (default: 2.0)

    Returns:
        dict: Configuration data containing prayer times and mosque information

    Raises:
        ValueError: If mosque not found or data extraction fails
        RuntimeError: If HTTP request fails after all retries
    """
    # Check if data is in cache
    if masjid_id in _data_cache:
        return _data_cache[masjid_id]

    base_url = current_app.config["MAWAQIT_BASE_URL"]
    timeout = current_app.config["MAWAQIT_REQUEST_TIMEOUT"]
    user_agent = current_app.config["MAWAQIT_USER_AGENT"]

    url = f"{base_url}/{masjid_id}"
    headers = {"User-Agent": user_agent}

    last_exception = None

    for attempt in range(max_retries + 1):
        try:
            print(f"🔄 Tentative {attempt + 1}/{max_retries + 1} pour {masjid_id}")

            r = requests.get(url, headers=headers, timeout=timeout)

            if r.status_code == 404:
                raise ValueError(f"Mosque not found for masjid_id: {masjid_id}")
            elif r.status_code != 200:
                raise RuntimeError(
                    f"HTTP error {r.status_code} when requesting {masjid_id}"
                )

            soup = BeautifulSoup(r.text, "html.parser")
            script = soup.find("script", string=re.compile(r"var\s+confData\s*=\s*{"))

            if not script:
                raise ValueError(f"No <script> tag containing confData for {masjid_id}")

            match = re.search(
                r"var\s+confData\s*=\s*({.*?});\s*", script.string, re.DOTALL
            )
            if not match:
                raise ValueError(f"Unable to extract confData JSON for {masjid_id}")

            try:
                conf_data = json.loads(match.group(1))
                # Cache the data
                _data_cache[masjid_id] = conf_data
                print(f"✅ Données récupérées avec succès pour {masjid_id}")
                return conf_data
            except json.JSONDecodeError as e:
                raise ValueError(f"JSON error in confData: {e}") from e

        except (requests.RequestException, RuntimeError, ValueError) as e:
            last_exception = e
            if attempt < max_retries:
                print(f"⚠️ Tentative {attempt + 1} échouée pour {masjid_id}: {e}")
                print(
                    f"⏳ Attente de {retry_delay} secondes avant la prochaine tentative..."
                )
                time.sleep(retry_delay)
            else:
                print(f"❌ Toutes les tentatives ont échoué pour {masjid_id}")
                break

    # If we reach here, all attempts have failed
    if last_exception:
        raise last_exception
    else:
        raise RuntimeError(
            f"Unknown error occurred while fetching data for {masjid_id}"
        )


def fetch_mosques_data(masjid_id: str, scope: str):
    """
    Fetch prayer times data for a specific mosque and time scope.

    Args:
        masjid_id (str): Mosque identifier
        scope (str): Time scope (today/month/year)

    Returns:
        tuple: (prayer times data, timezone string)

    Raises:
        ValueError: If scope is invalid
    """
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
        raise ValueError(f"Unknown scope: {scope}")


# Daily data
def get_prayer_times_of_the_day(masjid_id: str) -> dict:
    """
    Get prayer times for the current day.

    Args:
        masjid_id (str): Mosque identifier

    Returns:
        dict: Dictionary containing prayer times for the day

    Raises:
        ValueError: If prayer time data is incomplete
    """
    # Use cached data if available
    if masjid_id in _data_cache:
        data = _data_cache[masjid_id]
    else:
        data = fetch_mawaqit_data(masjid_id)

    times = data.get("times", [])
    sunset = data.get("shuruq", "")

    if len(times) < 5:
        raise ValueError("Incomplete prayer time data.")

    return {
        "fajr": times[0],
        "sunset": sunset,
        "dohr": times[1],
        "asr": times[2],
        "maghreb": times[3],
        "icha": times[4],
    }


# Monthly data
def get_month(masjid_id: str, month_number: int):
    """
    Get prayer times for a specific month.

    Args:
        masjid_id (str): Mosque identifier
        month_number (int): Month number (1-12)

    Returns:
        list: List of prayer times for each day of the month

    Raises:
        ValueError: If month number is invalid or data unavailable
    """
    if not 1 <= month_number <= 12:
        raise ValueError("Month must be between 1 and 12.")

    # Use cached data if available
    if masjid_id in _data_cache:
        data = _data_cache[masjid_id]
    else:
        data = fetch_mawaqit_data(masjid_id)

    calendar = data.get("calendar", [])

    if len(calendar) < month_number:
        raise ValueError("This month is not available in the calendar.")

    return calendar[month_number - 1]


# Yearly data
def get_calendar(masjid_id: str):
    """
    Get prayer times for the entire year.

    Args:
        masjid_id (str): Mosque identifier

    Returns:
        list: List of monthly prayer times for the year
    """
    # Use cached data if available
    if masjid_id in _data_cache:
        data = _data_cache[masjid_id]
    else:
        data = fetch_mawaqit_data(masjid_id)

    calendar = data.get("calendar", [])
    return calendar
