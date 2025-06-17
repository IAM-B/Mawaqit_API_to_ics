"""
Integration tests for planner_view module.
Tests the normalization and handling of prayer time data.
"""

import pytest
from flask import current_app
from app.views.planner_view import handle_planner_post, normalize_month_data, normalize_year_data

@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    from app import create_app
    test_config = {
        'TESTING': True,
        'DEBUG': True,
        'MAWAQIT_BASE_URL': 'https://mawaqit.net',
        'ICS_CALENDAR_NAME': 'Test Calendar',
        'ICS_CALENDAR_DESCRIPTION': 'Test Description',
        'STATIC_FOLDER': 'app/static'
    }
    app = create_app(test_config)
    return app

def test_normalize_month_data_valid():
    """Test normalize_month_data with valid data."""
    prayer_times = {
        "1": ["05:00", "13:00", "16:00", "19:00", "21:00", "22:00"],
        "2": ["05:01", "13:01", "16:01", "19:01", "21:01", "22:01"]
    }
    result = normalize_month_data(prayer_times)
    assert len(result) == 2
    assert result[0]["fajr"] == "05:00"
    assert result[1]["fajr"] == "05:01"

def test_normalize_month_data_invalid():
    """Test normalize_month_data with invalid data."""
    prayer_times = {
        "32": ["05:00", "13:00", "16:00", "19:00", "21:00", "22:00"],  # Invalid date
        "1": ["invalid", "13:00", "16:00", "19:00", "21:00", "22:00"],  # Invalid time format
        "2": "invalid,format",  # Invalid string format
        "3": {"invalid": "format"},  # Invalid dict format
        "4": None  # Invalid type
    }
    result = normalize_month_data(prayer_times)
    assert len(result) == 0

def test_normalize_year_data_valid():
    """Test normalize_year_data with valid data."""
    prayer_times = [
        {
            "1": ["05:00", "13:00", "16:00", "19:00", "21:00", "22:00"],
            "2": ["05:01", "13:01", "16:01", "19:01", "21:01", "22:01"]
        },
        {
            "1": ["05:02", "13:02", "16:02", "19:02", "21:02", "22:02"],
            "2": ["05:03", "13:03", "16:03", "19:03", "21:03", "22:03"]
        }
    ]
    result = normalize_year_data(prayer_times)
    assert len(result) == 2  # 2 months
    assert len(result[0]) == 2  # 2 days in the first month
    assert len(result[1]) == 2  # 2 days in the second month
    assert result[0]["1"][0] == "05:00"  # First day, first month
    assert result[1]["1"][0] == "05:02"  # First day, second month

def test_normalize_year_data_invalid():
    """Test normalize_year_data with invalid data."""
    prayer_times = [
        {
            "32": ["05:00", "13:00", "16:00", "19:00", "21:00", "22:00"],  # Invalid date
            "1": ["invalid", "13:00", "16:00", "19:00", "21:00", "22:00"],  # Invalid time format
        },
        {
            "1": "invalid,format",  # Invalid string format
            "2": {"invalid": "format"},  # Invalid dict format
            "3": None  # Invalid type
        }
    ]
    result = normalize_year_data(prayer_times)
    assert len(result) == 2  # 2 months
    assert len(result[0]) == 0  # First month is empty because all data is invalid
    assert len(result[1]) == 0  # Second month is empty because all data is invalid

def test_handle_planner_post_today(app):
    """Test handle_planner_post with today scope."""
    with app.test_request_context(
        data={
            "masjid_id": "123",
            "scope": "today",
            "padding_before": "10",
            "padding_after": "35"
        },
        method='POST'
    ):
        mock_data = {
            "fajr": "05:00",
            "sunset": "13:00",
            "dohr": "16:00",
            "asr": "19:00",
            "maghreb": "21:00",
            "icha": "22:00"
        }
        with pytest.MonkeyPatch.context() as m:
            m.setattr('app.views.planner_view.fetch_mosques_data', lambda x, y: (mock_data, "Europe/Paris"))
            m.setattr('app.views.planner_view.generate_prayer_ics_file', lambda **kwargs: "prayer.ics")
            m.setattr('app.views.planner_view.generate_empty_by_scope', lambda **kwargs: "empty.ics")
            m.setattr('app.views.planner_view.generate_slots_by_scope', lambda **kwargs: "slots.ics")
            m.setattr('app.views.planner_view.render_template', lambda template, **kwargs: "rendered_template")
            result = handle_planner_post("123", "today", 10, 35)
            assert result == "rendered_template"

def test_handle_planner_post_month(app):
    """Test handle_planner_post with month scope."""
    with app.test_request_context(
        data={
            "masjid_id": "123",
            "scope": "month",
            "padding_before": "10",
            "padding_after": "35"
        },
        method='POST'
    ):
        mock_data = {
            "1": ["05:00", "13:00", "16:00", "19:00", "21:00", "22:00"],
            "2": ["05:01", "13:01", "16:01", "19:01", "21:01", "22:01"]
        }
        with pytest.MonkeyPatch.context() as m:
            m.setattr('app.views.planner_view.fetch_mosques_data', lambda x, y: (mock_data, "Europe/Paris"))
            m.setattr('app.views.planner_view.generate_prayer_ics_file', lambda **kwargs: "prayer.ics")
            m.setattr('app.views.planner_view.generate_empty_by_scope', lambda **kwargs: "empty.ics")
            m.setattr('app.views.planner_view.generate_slots_by_scope', lambda **kwargs: "slots.ics")
            m.setattr('app.views.planner_view.render_template', lambda template, **kwargs: "rendered_template")
            result = handle_planner_post("123", "month", 10, 35)
            assert result == "rendered_template"

def test_handle_planner_post_year(app):
    """Test handle_planner_post with year scope."""
    with app.test_request_context(
        data={
            "masjid_id": "123",
            "scope": "year",
            "padding_before": "10",
            "padding_after": "35"
        },
        method='POST'
    ):
        mock_data = [
            {
                "1": ["05:00", "13:00", "16:00", "19:00", "21:00", "22:00"],
                "2": ["05:01", "13:01", "16:01", "19:01", "21:01", "22:01"]
            },
            {
                "1": ["05:02", "13:02", "16:02", "19:02", "21:02", "22:02"],
                "2": ["05:03", "13:03", "16:03", "19:03", "21:03", "22:03"]
            }
        ]
        with pytest.MonkeyPatch.context() as m:
            m.setattr('app.views.planner_view.fetch_mosques_data', lambda x, y: (mock_data, "Europe/Paris"))
            m.setattr('app.views.planner_view.generate_prayer_ics_file', lambda **kwargs: "prayer.ics")
            m.setattr('app.views.planner_view.generate_empty_by_scope', lambda **kwargs: "empty.ics")
            m.setattr('app.views.planner_view.generate_slots_by_scope', lambda **kwargs: "slots.ics")
            m.setattr('app.views.planner_view.render_template', lambda template, **kwargs: "rendered_template")
            result = handle_planner_post("123", "year", 10, 35)
            assert result == "rendered_template"

def test_handle_planner_post_invalid_scope(app):
    """Test handle_planner_post with invalid scope."""
    with app.test_request_context(
        data={
            "masjid_id": "123",
            "scope": "invalid",
            "padding_before": "10",
            "padding_after": "35"
        },
        method='POST'
    ):
        with pytest.MonkeyPatch.context() as m:
            m.setattr('app.views.planner_view.fetch_mosques_data', lambda x, y: (None, "Europe/Paris"))
            with pytest.raises(ValueError, match="Scope must be 'today', 'month', or 'year'"):
                handle_planner_post("123", "invalid", 10, 35)

def test_handle_planner_post_invalid_padding(app):
    """Test handle_planner_post with invalid padding values."""
    with app.test_request_context(
        data={
            "masjid_id": "123",
            "scope": "today",
            "padding_before": "invalid",
            "padding_after": "invalid"
        },
        method='POST'
    ):
        with pytest.raises(ValueError, match="Invalid padding values"):
            handle_planner_post("123", "today", "invalid", "invalid") 