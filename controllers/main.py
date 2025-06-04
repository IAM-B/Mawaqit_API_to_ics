from pathlib import Path
from datetime import datetime
from flask import Flask, request, abort, jsonify, render_template
from controllers.error_handlers import init_error_handlers
from views.planner_view import handle_planner_post
from modules.mawaqit_fetcher import fetch_mawaqit_data, fetch_mosques_data, get_prayer_times_of_the_day, get_month, get_calendar
from modules.time_segmenter import segment_available_time
from modules.prayer_generator import generate_prayer_ics_file
from modules.empty_generator import generate_empty_by_scope
from modules.slots_generator import generate_slots_by_scope
from modules.slot_utils import adjust_slots_rounding
from modules.mute_utils import apply_silent_settings
from modules.slot_editor import render_slot_editor
from modules.mosque_search import list_countries, list_mosques_by_country, get_formatted_mosques

app = Flask(__name__)

app.config['PROPAGATE_EXCEPTIONS'] = False
app.config['TRAP_HTTP_EXCEPTIONS'] = True

def init_routes(app):

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route('/favicon.ico')
    def favicon():
        return app.send_static_file('favicon.ico')

    @app.route("/<masjid_id>/", methods=["GET"])
    def get_raw_data(masjid_id: str):
        r = fetch_mawaqit_data(masjid_id)
        return {"rawdata": r}

    @app.route("/<masjid_id>/today", methods=["GET"])
    def get_prayer_times(masjid_id: str):
        prayer_times = get_prayer_times_of_the_day(masjid_id)
        return prayer_times


    @app.route("/<masjid_id>/calendar", methods=["GET"])
    def get_year_calendar(masjid_id: str):
        r = get_calendar(masjid_id)
        return {"calendar": r}


    @app.route("/<masjid_id>/calendar/<int:month_number>", methods=["GET"])
    def get_month_calendar(masjid_id: str, month_number: int):
        month_dict = get_month(masjid_id, month_number)
        return jsonify(month_dict)

    @app.route('/planner', methods=['GET'])
    def redirect_planner():
        return render_template("error.html", error_message="Accès direct à /planner non autorisé. Merci de soumettre le formulaire.")

    @app.route('/planner', methods=['POST'])
    def planner():
        masjid_id = request.form.get("masjid_id")
        scope = request.form.get("scope")
        padding_before = int(request.form.get('padding_before', 10))
        padding_after = int(request.form.get('padding_after', 35))
        return handle_planner_post(masjid_id, scope, padding_before, padding_after)

    @app.route("/get_countries", methods=["GET"])
    def get_countries():
        return jsonify(list_countries())

    @app.route("/get_mosques", methods=["GET"])
    def get_mosques():
        return get_formatted_mosques()

    @app.route("/edit_slot", methods=["GET", "POST"])
    def edit_slot():
        return render_slot_editor(request)
