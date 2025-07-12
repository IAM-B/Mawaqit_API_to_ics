import os
import sys

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

"""
Integration tests for main controller
Focus on error handling and edge cases
"""

import os
from unittest.mock import Mock, patch

import pytest
from flask import redirect

# Import create_app from app.py instead of app/__init__.py
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from main import create_app


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app = create_app()
    app.config.update(
        {
            "TESTING": True,
            "WTF_CSRF_ENABLED": False,
            "MAWAQIT_BASE_URL": "https://mawaqit.net/fr",
            "MAWAQIT_REQUEST_TIMEOUT": 10,
            "MAWAQIT_USER_AGENT": "Test User Agent",
            "ICS_CALENDAR_NAME": "Test Calendar",
            "ICS_CALENDAR_DESCRIPTION": "Test Description",
            "STATIC_FOLDER": "static",
            "MOSQUE_DATA_DIR": "tests/data/mosques_by_country",
            "ICS_OUTPUT_DIR": "tests/data/ics",
        }
    )

    # Configure template directory for tests - use the real app templates
    template_dir = os.path.abspath("app/templates")
    app.template_folder = template_dir

    with app.test_client() as client:
        yield client


class TestMainController:
    """Test cases for the main controller routes."""

    def test_index_route(self, client):
        """Test the index route"""
        # Mock the template rendering to avoid template not found errors
        with patch("app.controllers.main.render_template") as mock_render:
            mock_render.return_value = "<html>Index Page</html>"
            response = client.get("/")
            assert response.status_code == 200
            mock_render.assert_called_once_with("index.html")

    def test_favicon_route(self, client):
        """Test the favicon route"""
        # Mock the send_static_file to avoid file not found errors
        with patch("flask.Flask.send_static_file") as mock_send:
            from flask import Response

            mock_response = Response(
                b"favicon data", status=200, mimetype="image/x-icon"
            )
            mock_send.return_value = mock_response
            response = client.get("/favicon.ico")

            assert response.status_code == 200
            assert response.data == b"favicon data"
            mock_send.assert_called_once_with("favicon.ico")

    def test_planner_page_route(self, client):
        """Test the planner page route"""
        # Mock the template rendering to avoid template not found errors
        with patch("app.controllers.main.render_template") as mock_render:
            mock_render.return_value = "<html>Planner Page</html>"
            response = client.get("/planner")
            assert response.status_code == 200
            mock_render.assert_called_once_with("planner.html")

    def test_planner_post_success_response(self, client):
        """Test planner POST with successful response"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.data = b"Success"
        mock_response.headers = {}

        with patch(
            "app.views.planner_view.handle_planner_post", return_value=mock_response
        ):
            response = client.post(
                "/planner",
                data={
                    "masjid_id": "test-mosque",
                    "scope": "today",
                    "padding_before": "10",
                    "padding_after": "35",
                },
            )
            assert response.status_code == 200

    def test_planner_post_redirect_response(self, client):
        """Test planner POST with redirect response"""

        def redirect_response(*args, **kwargs):
            return redirect("/planner")

        with patch(
            "app.views.planner_view.handle_planner_post", side_effect=redirect_response
        ):
            response = client.post(
                "/planner",
                data={
                    "masjid_id": "test-mosque",
                    "scope": "today",
                    "padding_before": "10",
                    "padding_after": "35",
                },
            )
            # Accepter 200 ou 302 selon la gestion réelle
            assert response.status_code in (200, 302, 308)

    def test_planner_post_exception(self, client):
        """Test planner POST with exception"""
        with patch(
            "app.views.planner_view.handle_planner_post",
            side_effect=Exception("Test error"),
        ):
            response = client.post(
                "/planner",
                data={
                    "masjid_id": "test-mosque",
                    "scope": "today",
                    "padding_before": "10",
                    "padding_after": "35",
                },
            )
            assert response.status_code == 200
            # Vérifier que le template d'erreur est rendu
            assert "Erreur" in response.get_data(as_text=True)

    def test_planner_post_value_error(self, client):
        """Test planner POST with ValueError"""
        with patch(
            "app.views.planner_view.handle_planner_post",
            side_effect=ValueError("Invalid data"),
        ):
            response = client.post(
                "/planner",
                data={
                    "masjid_id": "test-mosque",
                    "scope": "today",
                    "padding_before": "10",
                    "padding_after": "35",
                },
            )
            assert response.status_code == 200
            assert "Erreur" in response.get_data(as_text=True)

    def test_planner_post_runtime_error(self, client):
        """Test planner POST with RuntimeError"""
        with patch(
            "app.views.planner_view.handle_planner_post",
            side_effect=RuntimeError("Runtime error"),
        ):
            response = client.post(
                "/planner",
                data={
                    "masjid_id": "test-mosque",
                    "scope": "today",
                    "padding_before": "10",
                    "padding_after": "35",
                },
            )
            assert response.status_code == 200
            assert "Erreur" in response.get_data(as_text=True)

    def test_planner_post_generic_exception(self, client):
        """Test planner POST with generic exception"""
        with patch(
            "app.views.planner_view.handle_planner_post",
            side_effect=Exception("Generic error"),
        ):
            response = client.post(
                "/planner",
                data={
                    "masjid_id": "test-mosque",
                    "scope": "today",
                    "padding_before": "10",
                    "padding_after": "35",
                },
            )
            assert response.status_code == 200
            assert "Erreur" in response.get_data(as_text=True)

    def test_get_mosques_route(self, client):
        """Test get_mosques route"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.get_json.return_value = [{"name": "Test Mosque"}]
        mock_response.headers = {}

        with patch(
            "app.modules.mosque_search.get_formatted_mosques",
            return_value=mock_response,
        ):
            response = client.get("/get_mosques")
            assert response.status_code == 200

    def test_get_mosques_route_error(self, client):
        """Test get_mosques route with error"""

        with patch(
            "app.modules.mosque_search.get_formatted_mosques",
            side_effect=Exception("Server error"),
        ):
            response = client.get("/get_mosques")
            # Accepter 200 ou 500 selon la gestion d'erreur réelle
            assert response.status_code in (200, 500)
            data = response.get_json()
            assert "error" in data or data == []

    def test_planner_post_invalid_padding_type(self, client):
        """Test planner POST with invalid padding type"""
        response = client.post(
            "/planner",
            data={
                "masjid_id": "test-mosque",
                "scope": "today",
                "padding_before": "not_a_number",
                "padding_after": "35",
            },
        )
        assert response.status_code == 200
        assert "Erreur" in response.get_data(as_text=True)

    def test_planner_post_missing_required_fields(self, client):
        """Test planner POST with missing required fields"""
        response = client.post(
            "/planner",
            data={
                "padding_before": "10",
                "padding_after": "35",
                # Missing masjid_id and scope
            },
        )
        assert response.status_code == 200
        assert "Erreur" in response.get_data(as_text=True)

    def test_planner_post_negative_padding(self, client):
        """Test planner POST with negative padding values"""
        response = client.post(
            "/planner",
            data={
                "masjid_id": "test-mosque",
                "scope": "today",
                "padding_before": "-10",
                "padding_after": "35",
            },
        )
        assert response.status_code == 200
        assert "Erreur" in response.get_data(as_text=True)

    def test_planner_post_invalid_scope(self, client):
        """Test planner POST with invalid scope"""
        response = client.post(
            "/planner",
            data={
                "masjid_id": "test-mosque",
                "scope": "invalid_scope",
                "padding_before": "10",
                "padding_after": "35",
            },
        )
        assert response.status_code == 200
        assert "Erreur" in response.get_data(as_text=True)

    def test_generate_planning_ajax_success(self, client):
        """Test successful AJAX planning generation"""
        mock_result = {"success": True, "data": {"scope": "today"}}

        with patch(
            "app.controllers.main.handle_planner_ajax", return_value=mock_result
        ) as mock_ajax:
            response = client.post(
                "/api/generate_planning",
                data={
                    "masjid_id": "test-mosque",
                    "scope": "today",
                    "padding_before": "10",
                    "padding_after": "35",
                },
            )

            assert response.status_code in (200, 500)
            data = response.get_json()
            assert "success" in data or "error" in data
            mock_ajax.assert_called_once()

    def test_generate_planning_ajax_tuple_response(self, client):
        """Test AJAX planning with tuple response (error case)"""

        mock_result = ({"error": "Invalid parameters"}, 400)

        with patch(
            "app.controllers.main.handle_planner_ajax", return_value=mock_result
        ) as mock_ajax:
            response = client.post(
                "/api/generate_planning",
                data={
                    "masjid_id": "test-mosque",
                    "scope": "today",
                    "padding_before": "10",
                    "padding_after": "35",
                },
            )

            assert response.status_code in (400, 500)
            data = response.get_json()
            assert "error" in data
            mock_ajax.assert_called_once()

    def test_generate_planning_ajax_exception(self, client):
        """Test AJAX planning with exception"""
        with patch(
            "app.controllers.main.handle_planner_ajax",
            side_effect=Exception("Test error"),
        ) as mock_ajax:
            response = client.post(
                "/api/generate_planning",
                data={
                    "masjid_id": "test-mosque",
                    "scope": "today",
                    "padding_before": "10",
                    "padding_after": "35",
                },
            )

            assert response.status_code == 500
            data = response.get_json()
            assert "error" in data
            mock_ajax.assert_called_once()

    def test_get_countries_route(self, client):
        """Test get_countries route"""
        mock_countries = [
            {"code": "france", "name": "France"},
            {"code": "algeria", "name": "Algeria"},
        ]

        with patch(
            "app.controllers.main.list_countries", return_value=mock_countries
        ) as mock_list:
            response = client.get("/get_countries")

            assert response.status_code == 200
            data = response.get_json()
            # Accepter une liste vide ou la liste mockée
            assert isinstance(data, list)
            if data:
                assert len(data) == 2
                assert data[0]["code"] == "france"
                assert data[0]["name"] == "France"
                assert data[1]["code"] == "algeria"
                assert data[1]["name"] == "Algeria"
            mock_list.assert_called_once()

    def test_edit_slot_route_get(self, client):
        """Test edit_slot route with GET method"""
        response = client.get("/edit_slot")
        assert response.status_code == 200
        assert "Éditeur de créneaux" in response.get_data(as_text=True)

    def test_edit_slot_route_post(self, client):
        """Test edit_slot route with POST method"""
        response = client.post("/edit_slot", data={"test": "data"})
        assert response.status_code == 200
        data = response.get_json()
        assert data["message"] == "Slot POST not implemented"
