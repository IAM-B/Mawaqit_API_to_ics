import os
import sys

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from unittest.mock import MagicMock, patch

import pytest

# Import create_app from app.py instead of app/__init__.py
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from main import create_app
from app.modules.mawaqit_fetcher import (
    clear_mawaqit_cache,
    fetch_mawaqit_data,
    fetch_mosques_data,
    get_calendar,
    get_month,
    get_prayer_times_of_the_day,
)


@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    test_config = {
        "TESTING": True,
        "DEBUG": True,
        "ICS_CALENDAR_NAME": "Prayer Times",
        "ICS_CALENDAR_DESCRIPTION": "Prayer times from Mawaqit",
        "STATIC_FOLDER": "static",
            "MAWAQIT_BASE_URL": "https://mawaqit.net",
            "MAWAQIT_REQUEST_TIMEOUT": 5,
            "MAWAQIT_USER_AGENT": "Mozilla/5.0 (Test)",
        }
    app = create_app("testing", test_config)
    return app


def test_fetch_mawaqit_data_success(app):
    """Test successful fetch of mawaqit data"""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = '<script>var confData = {"times": ["05:00", "13:00", "16:00", "19:00", "21:00"], "shuruq": "06:00", "timezone": "Europe/Paris"};</script>'

    with app.app_context():
        with patch("requests.get", return_value=mock_response):
            data = fetch_mawaqit_data("123")
            assert data["times"] == ["05:00", "13:00", "16:00", "19:00", "21:00"]
            assert data["shuruq"] == "06:00"
            assert data["timezone"] == "Europe/Paris"


def test_fetch_mawaqit_data_404(app):
    """Test fetch_mawaqit_data with 404 response"""
    clear_mawaqit_cache()
    mock_response = MagicMock()
    mock_response.status_code = 404

    with app.app_context():
        with patch("requests.get", return_value=mock_response):
            with pytest.raises(ValueError, match="Mosque not found"):
                fetch_mawaqit_data("123")


def test_fetch_mawaqit_data_http_error(app):
    """Test fetch_mawaqit_data with non-200 response"""
    clear_mawaqit_cache()
    mock_response = MagicMock()
    mock_response.status_code = 500

    with app.app_context():
        with patch("requests.get", return_value=mock_response):
            with pytest.raises(RuntimeError, match="HTTP error 500"):
                fetch_mawaqit_data("123")


def test_fetch_mawaqit_data_no_script(app):
    """Test fetch_mawaqit_data when no script tag is found"""
    clear_mawaqit_cache()
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = "<html><body>No script here</body></html>"

    with app.app_context():
        with patch("requests.get", return_value=mock_response):
            with pytest.raises(ValueError, match="No <script> tag containing confData"):
                fetch_mawaqit_data("123")


def test_fetch_mawaqit_data_invalid_json(app):
    """Test fetch_mawaqit_data with invalid JSON in confData"""
    clear_mawaqit_cache()
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = "<script>var confData = {invalid json};</script>"

    with app.app_context():
        with patch("requests.get", return_value=mock_response):
            with pytest.raises(ValueError, match="JSON error in confData"):
                fetch_mawaqit_data("123")


def test_fetch_mosques_data_today(app):
    """Test fetch_mosques_data with scope 'today'"""
    mock_data = {
        "times": ["05:00", "13:00", "16:00", "19:00", "21:00"],
        "shuruq": "06:00",
        "timezone": "Europe/Paris",
    }

    with app.app_context():
        with patch(
            "app.modules.mawaqit_fetcher.fetch_mawaqit_data", return_value=mock_data
        ):
            data, tz = fetch_mosques_data("123", "today")
            assert data["fajr"] == "05:00"
            assert data["dohr"] == "13:00"
            assert tz == "Europe/Paris"


def test_fetch_mosques_data_month(app):
    """Test fetch_mosques_data with scope 'month'"""
    # Créer des données pour 12 mois (année complète)
    calendar_data = []
    for month in range(12):
        month_data = []
        for day in range(31):  # 31 jours par mois
            month_data.append(
                [
                    f"05:{day:02d}",
                    f"13:{day:02d}",
                    f"16:{day:02d}",
                    f"19:{day:02d}",
                    f"21:{day:02d}",
                ]
            )
        calendar_data.append(month_data)

    mock_data = {"calendar": calendar_data, "timezone": "Europe/Paris"}

    with app.app_context():
        with patch(
            "app.modules.mawaqit_fetcher.fetch_mawaqit_data", return_value=mock_data
        ):
            data, tz = fetch_mosques_data("123", "month")
            # Vérifier que nous avons bien les données du mois actuel (31 jours)
            assert len(data) == 31
            assert data[0] == [
                "05:00",
                "13:00",
                "16:00",
                "19:00",
                "21:00",
            ]  # Premier jour
            assert data[30] == [
                "05:30",
                "13:30",
                "16:30",
                "19:30",
                "21:30",
            ]  # Dernier jour
            assert tz == "Europe/Paris"


def test_fetch_mosques_data_year(app):
    """Test fetch_mosques_data with scope 'year'"""
    mock_data = {
        "calendar": [["05:00", "13:00", "16:00", "19:00", "21:00"]],
        "timezone": "Europe/Paris",
    }

    with app.app_context():
        with patch(
            "app.modules.mawaqit_fetcher.fetch_mawaqit_data", return_value=mock_data
        ):
            data, tz = fetch_mosques_data("123", "year")
            assert data == [["05:00", "13:00", "16:00", "19:00", "21:00"]]
            assert tz == "Europe/Paris"


def test_fetch_mosques_data_invalid_scope(app):
    """Test fetch_mosques_data with invalid scope"""
    mock_data = {
        "calendar": [["05:00", "13:00", "16:00", "19:00", "21:00"]],
        "timezone": "Europe/Paris",
    }

    with app.app_context():
        with patch(
            "app.modules.mawaqit_fetcher.fetch_mawaqit_data", return_value=mock_data
        ):
            with pytest.raises(ValueError, match="Unknown scope"):
                fetch_mosques_data("123", "invalid")


def test_get_prayer_times_of_the_day_success(app):
    """Test get_prayer_times_of_the_day with valid data"""
    mock_data = {
        "times": ["05:00", "13:00", "16:00", "19:00", "21:00"],
        "shuruq": "06:00",
    }

    with app.app_context():
        with patch(
            "app.modules.mawaqit_fetcher.fetch_mawaqit_data", return_value=mock_data
        ):
            data = get_prayer_times_of_the_day("123")
            assert data["fajr"] == "05:00"
            assert data["dohr"] == "13:00"
            assert data["asr"] == "16:00"
            assert data["maghreb"] == "19:00"
            assert data["icha"] == "21:00"
            assert data["sunset"] == "06:00"


def test_get_prayer_times_of_the_day_incomplete(app):
    """Test get_prayer_times_of_the_day with incomplete data"""
    clear_mawaqit_cache()
    mock_data = {"times": ["05:00", "13:00"], "shuruq": "06:00"}

    with app.app_context():
        with patch(
            "app.modules.mawaqit_fetcher.fetch_mawaqit_data", return_value=mock_data
        ):
            with pytest.raises(ValueError, match="Incomplete prayer time data"):
                get_prayer_times_of_the_day("123")


def test_get_month_success(app):
    """Test get_month with valid month number"""
    mock_data = {"calendar": [["05:00", "13:00", "16:00", "19:00", "21:00"]]}

    with app.app_context():
        with patch(
            "app.modules.mawaqit_fetcher.fetch_mawaqit_data", return_value=mock_data
        ):
            data = get_month("123", 1)
            assert data == ["05:00", "13:00", "16:00", "19:00", "21:00"]


def test_get_month_invalid_month(app):
    """Test get_month with invalid month number"""
    with app.app_context():
        with pytest.raises(ValueError, match="Month must be between 1 and 12"):
            get_month("123", 13)


def test_get_month_unavailable(app):
    """Test get_month with unavailable month"""
    mock_data = {"calendar": []}

    with app.app_context():
        with patch(
            "app.modules.mawaqit_fetcher.fetch_mawaqit_data", return_value=mock_data
        ):
            with pytest.raises(
                ValueError, match="This month is not available in the calendar"
            ):
                get_month("123", 1)


def test_get_calendar_success(app):
    """Test get_calendar with valid data"""
    mock_data = {"calendar": [["05:00", "13:00", "16:00", "19:00", "21:00"]]}

    with app.app_context():
        with patch(
            "app.modules.mawaqit_fetcher.fetch_mawaqit_data", return_value=mock_data
        ):
            data = get_calendar("123")
            assert data == [["05:00", "13:00", "16:00", "19:00", "21:00"]]
