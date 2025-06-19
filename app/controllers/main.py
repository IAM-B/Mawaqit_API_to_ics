"""
Main controller module for the Mawaqit to ICS application.
Handles all route definitions and request processing.
"""

from pathlib import Path
from datetime import datetime
from flask import Flask, request, abort, jsonify, render_template, Blueprint, send_file
from app.controllers.error_handlers import init_error_handlers
from app.views.planner_view import handle_planner_post
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

    @app.route("/<masjid_id>/", methods=["GET"])
    def get_raw_data(masjid_id: str):
        """
        Fetch raw prayer time data for a specific mosque.
        
        Args:
            masjid_id (str): The unique identifier of the mosque
        """
        r = fetch_mawaqit_data(masjid_id)
        return {"rawdata": r}

    @app.route("/<masjid_id>/today", methods=["GET"])
    def get_prayer_times(masjid_id: str):
        """
        Get today's prayer times for a specific mosque.
        
        Args:
            masjid_id (str): The unique identifier of the mosque
        """
        prayer_times = get_prayer_times_of_the_day(masjid_id)
        return prayer_times

    @app.route("/<masjid_id>/calendar", methods=["GET"])
    def get_year_calendar(masjid_id: str):
        """
        Get the entire year's calendar for a specific mosque.
        
        Args:
            masjid_id (str): The unique identifier of the mosque
        """
        r = get_calendar(masjid_id)
        return {"calendar": r}

    @app.route("/<masjid_id>/calendar/<int:month_number>", methods=["GET"])
    def get_month_calendar(masjid_id: str, month_number: int):
        """
        Get a specific month's calendar for a mosque.
        
        Args:
            masjid_id (str): The unique identifier of the mosque
            month_number (int): The month number (1-12)
        """
        month_dict = get_month(masjid_id, month_number)
        return jsonify(month_dict)

    @app.route('/planner', methods=['GET'])
    def redirect_planner():
        """Handle direct access to planner page (not allowed)."""
        return render_template("error.html", error_message="Direct access to /planner not allowed. Please submit the form.")

    @app.route('/planner', methods=['POST'])
    def planner():
        """
        Handle prayer time planning requests.
        Processes form data and generates ICS files.
        """
        masjid_id = request.form.get("masjid_id")
        scope = request.form.get("scope")
        padding_before = int(request.form.get('padding_before', 10))
        padding_after = int(request.form.get('padding_after', 35))
        return handle_planner_post(masjid_id, scope, padding_before, padding_after)

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

@main_bp.route('/generate-ics', methods=['POST'])
def generate_ics():
    """Endpoint pour générer un fichier ICS."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['masjid_id', 'scope', 'timezone', 'padding_before', 'padding_after', 'prayer_times']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate values
        if data['scope'] not in ['today', 'month', 'year']:
            return jsonify({'error': 'Invalid scope. Must be one of: today, month, year'}), 400
        
        if data['padding_before'] < 0 or data['padding_after'] < 0:
            return jsonify({'error': 'Padding values must be positive'}), 400
        
        # Generate ICS file
        output_path = generate_prayer_ics_file(
            masjid_id=data['masjid_id'],
            scope=data['scope'],
            timezone_str=data['timezone'],
            padding_before=data['padding_before'],
            padding_after=data['padding_after'],
            prayer_times=data['prayer_times']
        )
        
        # Send file
        return send_file(
            output_path,
            mimetype='text/calendar',
            as_attachment=True,
            download_name=f"prayer_times_{data['masjid_id']}.ics"
        )
        
    except Exception as e:
        import traceback
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 400
