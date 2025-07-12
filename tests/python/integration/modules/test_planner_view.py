import os
import sys

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

"""
Integration tests for planner_view module.
Tests the normalization and handling of prayer time data.
"""

import pytest

# Import create_app from app.py instead of app/__init__.py
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from main import create_app
from app.views.planner_view import (
    handle_planner_post,
    normalize_month_data,
    normalize_year_data,
)


@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    test_config = {
        "TESTING": True,
        "DEBUG": True,
        "MAWAQIT_BASE_URL": "https://mawaqit.net",
        "ICS_CALENDAR_NAME": "Test Calendar",
        "ICS_CALENDAR_DESCRIPTION": "Test Description",
        "STATIC_FOLDER": "app/static",
    }
    app = create_app("testing", test_config)
    return app


def test_normalize_month_data_valid():
    """Test normalize_month_data with valid data."""
    prayer_times = {
        "1": ["05:00", "13:00", "16:00", "19:00", "21:00", "22:00"],
        "2": ["05:01", "13:01", "16:01", "19:01", "21:01", "22:01"],
    }
    result = normalize_month_data(prayer_times)
    # On attend 30 ou 31 jours selon le mois courant (on ne connaît pas le mois ici, donc on accepte 28 à 31)
    assert 28 <= len(result) <= 31
    # Les deux premiers jours doivent correspondre aux données d'entrée
    assert result[0]["fajr"] == "05:00"
    assert result[1]["fajr"] == "05:01"
    # Les jours suivants doivent être des duplications du dernier jour connu
    for day in result[2:]:
        assert day["fajr"] == "05:01"


def test_normalize_month_data_invalid():
    """Test normalize_month_data with invalid data."""
    prayer_times = {
        "32": ["05:00", "13:00", "16:00", "19:00", "21:00", "22:00"],  # Invalid date
        "1": [
            "invalid",
            "13:00",
            "16:00",
            "19:00",
            "21:00",
            "22:00",
        ],  # Invalid time format
        "2": "invalid,format",  # Invalid string format
        "3": {"invalid": "format"},  # Invalid dict format
        "4": None,  # Invalid type
    }
    result = normalize_month_data(prayer_times)
    # Aucun jour valide, donc aucun jour généré
    assert result == []


def test_normalize_year_data_valid():
    """Test normalize_year_data with valid data."""
    prayer_times = [
        {
            "1": ["05:00", "13:00", "16:00", "19:00", "21:00", "22:00"],
            "2": ["05:01", "13:01", "16:01", "19:01", "21:01", "22:01"],
        },
        {
            "1": ["05:02", "13:02", "16:02", "19:02", "21:02", "22:02"],
            "2": ["05:03", "13:03", "16:03", "19:03", "21:03", "22:03"],
        },
    ]
    result = normalize_year_data(prayer_times)
    # On attend 2 mois
    assert len(result) == 2
    # Pour chaque mois, on attend 28 à 31 jours
    for month, expected_first, expected_second in zip(
        result, ["05:00", "05:02"], ["05:01", "05:03"]
    ):
        assert 28 <= len(month) <= 31
        # Les deux premiers jours doivent correspondre aux données d'entrée
        days = list(month.keys())
        assert month[days[0]]["fajr"] == expected_first
        assert month[days[1]]["fajr"] == expected_second
        # Les jours suivants doivent être des duplications du dernier jour connu
        for d in days[2:]:
            assert month[d]["fajr"] == expected_second


def test_normalize_year_data_invalid():
    """Test normalize_year_data with invalid data."""
    prayer_times = [
        {
            "32": [
                "05:00",
                "13:00",
                "16:00",
                "19:00",
                "21:00",
                "22:00",
            ],  # Invalid date
            "1": [
                "invalid",
                "13:00",
                "16:00",
                "19:00",
                "21:00",
                "22:00",
            ],  # Invalid time format
        },
        {
            "1": "invalid,format",  # Invalid string format
            "2": {"invalid": "format"},  # Invalid dict format
            "3": None,  # Invalid type
        },
    ]
    result = normalize_year_data(prayer_times)
    # Les deux mois sont invalides, donc chaque dict doit être vide
    assert len(result) == 2
    assert all(len(month) == 0 for month in result)


def test_handle_planner_post_today(app):
    """Test handle_planner_post with today scope."""
    with app.test_request_context(
        data={
            "masjid_id": "123",
            "scope": "today",
            "padding_before": "10",
            "padding_after": "35",
        },
        method="POST",
    ):
        mock_data = {
            "fajr": "05:00",
            "sunset": "13:00",
            "dohr": "16:00",
            "asr": "19:00",
            "maghreb": "21:00",
            "icha": "22:00",
        }
        with pytest.MonkeyPatch.context() as m:
            m.setattr(
                "app.views.planner_view.fetch_mawaqit_data",
                lambda x: {"name": "Test Mosque", "address": "Test Address"},
            )
            m.setattr(
                "app.views.planner_view.fetch_mosques_data",
                lambda x, y: (mock_data, "Europe/Paris"),
            )
            m.setattr(
                "app.views.planner_view.generate_prayer_ics_file",
                lambda **kwargs: "prayer.ics",
            )
            m.setattr(
                "app.views.planner_view.generate_empty_by_scope",
                lambda **kwargs: "empty.ics",
            )
            m.setattr(
                "app.views.planner_view.generate_slots_by_scope",
                lambda **kwargs: "slots.ics",
            )
            m.setattr(
                "app.views.planner_view.render_template",
                lambda template, **kwargs: "rendered_template",
            )
            result = handle_planner_post("123", "today", 10, 35)
            assert result == "rendered_template"


def test_handle_planner_post_month(app):
    """Test handle_planner_post with month scope."""
    with app.test_request_context(
        data={
            "masjid_id": "123",
            "scope": "month",
            "padding_before": "10",
            "padding_after": "35",
        },
        method="POST",
    ):
        mock_data = {
            "1": ["05:00", "13:00", "16:00", "19:00", "21:00", "22:00"],
            "2": ["05:01", "13:01", "16:01", "19:01", "21:01", "22:01"],
        }
        with pytest.MonkeyPatch.context() as m:
            m.setattr(
                "app.views.planner_view.fetch_mawaqit_data",
                lambda x: {"name": "Test Mosque", "address": "Test Address"},
            )
            m.setattr(
                "app.views.planner_view.fetch_mosques_data",
                lambda x, y: (mock_data, "Europe/Paris"),
            )
            m.setattr(
                "app.views.planner_view.generate_prayer_ics_file",
                lambda **kwargs: "prayer.ics",
            )
            m.setattr(
                "app.views.planner_view.generate_empty_by_scope",
                lambda **kwargs: "empty.ics",
            )
            m.setattr(
                "app.views.planner_view.generate_slots_by_scope",
                lambda **kwargs: "slots.ics",
            )
            m.setattr(
                "app.views.planner_view.render_template",
                lambda template, **kwargs: "rendered_template",
            )
            result = handle_planner_post("123", "month", 10, 35)
            assert result == "rendered_template"


def test_handle_planner_post_year(app):
    """Test handle_planner_post with year scope."""
    with app.test_request_context(
        data={
            "masjid_id": "123",
            "scope": "year",
            "padding_before": "10",
            "padding_after": "35",
        },
        method="POST",
    ):
        mock_data = [
            {
                "1": ["05:00", "13:00", "16:00", "19:00", "21:00", "22:00"],
                "2": ["05:01", "13:01", "16:01", "19:01", "21:01", "22:01"],
            },
            {
                "1": ["05:02", "13:02", "16:02", "19:02", "21:02", "22:02"],
                "2": ["05:03", "13:03", "16:03", "19:03", "21:03", "22:03"],
            },
        ]
        with pytest.MonkeyPatch.context() as m:
            m.setattr(
                "app.views.planner_view.fetch_mawaqit_data",
                lambda x: {"name": "Test Mosque", "address": "Test Address"},
            )
            m.setattr(
                "app.views.planner_view.fetch_mosques_data",
                lambda x, y: (mock_data, "Europe/Paris"),
            )
            m.setattr(
                "app.views.planner_view.generate_prayer_ics_file",
                lambda **kwargs: "prayer.ics",
            )
            m.setattr(
                "app.views.planner_view.generate_empty_by_scope",
                lambda **kwargs: "empty.ics",
            )
            m.setattr(
                "app.views.planner_view.generate_slots_by_scope",
                lambda **kwargs: "slots.ics",
            )
            m.setattr(
                "app.views.planner_view.render_template",
                lambda template, **kwargs: "rendered_template",
            )
            result = handle_planner_post("123", "year", 10, 35)
            assert result == "rendered_template"


def test_handle_planner_post_invalid_scope(app):
    """Test handle_planner_post with invalid scope."""
    with app.test_request_context(
        data={
            "masjid_id": "123",
            "scope": "invalid",
            "padding_before": "10",
            "padding_after": "35",
        },
        method="POST",
    ):
        with pytest.MonkeyPatch.context() as m:
            m.setattr(
                "app.views.planner_view.fetch_mosques_data",
                lambda x, y: (None, "Europe/Paris"),
            )
            with pytest.raises(
                ValueError, match="Scope must be 'today', 'month', or 'year'"
            ):
                handle_planner_post("123", "invalid", 10, 35)


def test_handle_planner_post_invalid_padding(app):
    """Test handle_planner_post with invalid padding values."""
    with app.test_request_context(
        data={
            "masjid_id": "123",
            "scope": "today",
            "padding_before": "invalid",
            "padding_after": "invalid",
        },
        method="POST",
    ):
        # La fonction retourne un tuple (error_dict, status_code) au lieu de lever une exception
        result = handle_planner_post("123", "today", "invalid", "invalid")
        assert isinstance(result, tuple)
        assert len(result) == 2
        error_dict, status_code = result
        assert "error" in error_dict
        assert "Invalid padding values" in error_dict["error"]
        assert status_code == 400
