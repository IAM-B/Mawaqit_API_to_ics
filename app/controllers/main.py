"""
Main controller module for the Mawaqit to ICS application.
Handles all route definitions and request processing.
"""

from pathlib import Path
from datetime import datetime
from flask import Flask, request, abort, jsonify, render_template, Blueprint, send_file
from app.controllers.error_handlers import init_error_handlers
from app.views.planner_view import handle_planner_post, handle_planner_ajax
from app.modules.mawaqit_fetcher import fetch_mawaqit_data, fetch_mosques_data, get_prayer_times_of_the_day, get_month, get_calendar
from app.modules.time_segmenter import segment_available_time
from app.modules.prayer_generator import generate_prayer_ics_file
from app.modules.empty_generator import generate_empty_by_scope
from app.modules.slots_generator import generate_slots_by_scope
from app.modules.slot_utils import adjust_slots_rounding
from app.modules.slot_editor import render_slot_editor
from app.modules.mosque_search import list_countries, list_mosques_by_country, get_formatted_mosques

app = Flask(__name__)

# Configure Flask to handle exceptions
app.config['PROPAGATE_EXCEPTIONS'] = False
app.config['TRAP_HTTP_EXCEPTIONS'] = True

main_bp = Blueprint('main', __name__)

def init_routes(app):
    """
    Initialize all application routes.
    
    Args:
        app (Flask): The Flask application instance
    """
    app.register_blueprint(main_bp)

    @app.route("/")
    def index():
        """Render the main application page."""
        return render_template("index.html")

    @app.route('/favicon.ico')
    def favicon():
        """Serve the application favicon."""
        return app.send_static_file('favicon.ico')

    @app.route('/planner', methods=['GET'])
    def planner_page():
        """Display the planner page with configuration form."""
        return render_template("planner.html")

    @app.route('/planner', methods=['POST'])
    def planner():
        """
        Handle prayer time planning requests.
        Processes form data and generates ICS files.
        """
        try:
            masjid_id = request.form.get("masjid_id")
            scope = request.form.get("scope")
            padding_before = int(request.form.get('padding_before', 10))
            padding_after = int(request.form.get('padding_after', 35))
            
            # Get mosque details from hidden fields
            mosque_name = request.form.get("mosque_name", "")
            mosque_address = request.form.get("mosque_address", "")
            mosque_lat = request.form.get("mosque_lat", "")
            mosque_lng = request.form.get("mosque_lng", "")
            
            # Generate planning data using the existing function
            result = handle_planner_post(masjid_id, scope, padding_before, padding_after)
            
            # If result is a response (redirect), follow it
            if hasattr(result, 'status_code') and result.status_code == 302:
                return result
            
            # If result is a string (HTML), return it
            if isinstance(result, str):
                return result
            
            # Otherwise, return the result as is
            return result
            
        except Exception as e:
            return render_template("error.html", error_message=str(e))

    @app.route('/api/generate_planning', methods=['POST'])
    def generate_planning_ajax():
        """
        Handle AJAX prayer time planning requests.
        Returns JSON response with planning data.
        """
        try:
            result = handle_planner_ajax()
            
            # If result is a tuple (response, status_code), return it
            if isinstance(result, tuple):
                return jsonify(result[0]), result[1]
            
            # Otherwise, return the result as JSON
            return jsonify(result)
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/get_countries", methods=["GET"])
    def get_countries():
        """Get list of available countries with mosques."""
        return jsonify(list_countries())

    @app.route("/get_mosques", methods=["GET"])
    def get_mosques():
        """Get formatted list of all available mosques."""
        return get_formatted_mosques()

    @app.route("/edit_slot", methods=["GET", "POST"])
    def edit_slot():
        """Handle slot editing interface."""
        return render_slot_editor(request)
