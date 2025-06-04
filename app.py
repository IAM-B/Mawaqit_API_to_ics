from pathlib import Path
from datetime import datetime
from flask import Flask, render_template, request, abort, jsonify
from modules.mawaqit_fetcher import fetch_mawaqit_data, fetch_mosques_data, get_prayer_times_of_the_day, get_month, get_calendar
from modules.time_segmenter import segment_available_time
from modules.prayer_generator import generate_prayer_ics_file
from modules.empty_generator import generate_empty_by_scope
from modules.slots_generator import generate_slots_by_scope
from modules.slot_utils import adjust_slots_rounding
from modules.mute_utils import apply_silent_settings
from modules.mosque_search import list_countries, list_mosques_by_country

app = Flask(__name__)

app.config['PROPAGATE_EXCEPTIONS'] = False
app.config['TRAP_HTTP_EXCEPTIONS'] = True

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

    try:
        slots_download_link = None

        # 📥 Récupération des horaires de prière
        prayer_times, tz_str = fetch_mosques_data(masjid_id, scope)

        # 🕌 Génération du fichier .ics des prières
        ics_path = generate_prayer_ics_file(masjid_id, scope, tz_str, padding_before, padding_after)
        ics_url = f"/static/ics/{Path(ics_path).name}"

        # 🕳️ Créneaux vides (générés pour tous les scopes)
        empty_path = generate_empty_by_scope(
            masjid_id=masjid_id,
            scope=scope,
            timezone_str=tz_str,
            padding_before=padding_before,
            padding_after=padding_after
        )
        empty_ics_url = f"/{empty_path}"

        # 📊 Créneaux segmentés pour affichage
        if isinstance(prayer_times, list):
            segments = []
            for i, daily in enumerate(prayer_times):
                try:
                    slots = segment_available_time(daily, tz_str, padding_before, padding_after)
                    segments.append({"day": i + 1, "slots": slots})
                except Exception as e:
                    print(f"⚠️ Erreur jour {i + 1} : {e}")
        # 📂 Génération du fichier ICS avec tous les créneaux disponibles selon le scope
        slots_path = generate_slots_by_scope(
            masjid_id=masjid_id,
            scope=scope,  # ou scope si tu renommes
            timezone_str=tz_str,
            padding_before=padding_before,
            padding_after=padding_after
        )
        slots_download_link = f"/{slots_path}"

        # 📊 Segmenter les slots pour affichage (si today)
        if isinstance(prayer_times, dict):
            segments = segment_available_time(prayer_times, tz_str, padding_before, padding_after)
            slots = adjust_slots_rounding(segments)
            silent_slots = apply_silent_settings(slots)

        return render_template(
            "planner.html",
            download_link=ics_url,
            empty_download_link=empty_ics_url,
            slots_download_link=slots_download_link,
            segments=segments,
            timezone_str=tz_str
        )

    except Exception as e:
        print(f"❌ Erreur interne : {e}")
        abort(500)

@app.route("/get_countries", methods=["GET"])
def get_countries():
    return jsonify(list_countries())

@app.route("/get_mosques", methods=["GET"])
def get_mosques():
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

@app.route('/edit_slot', methods=['GET', 'POST'])
def edit_slot():
    if request.method == 'POST':
        ...
    else:
        slots = [
            {"start": "2025-05-31T09:00:00", "end": "2025-05-31T10:00:00"},
            {"start": "2025-05-31T11:00:00", "end": "2025-05-31T12:00:00"}
        ]
        return render_template("slot_editor.html", slots=slots)

@app.errorhandler(404)
def not_found(e):
    return render_template("error.html", error_message="Page non trouvée (404)"), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return render_template("error.html", error_message="Méthode non autorisée (405)", error_code=405), 405

@app.errorhandler(500)
def internal_error(e):
    return render_template("error.html", error_message="Erreur interne du serveur (500)"), 500

if __name__ == "__main__":
    try:
        print(">> Lancement du serveur Flask...")
        app.run(debug=False)
    except KeyboardInterrupt:
        print("🛑 Arrêt du serveur Flask.")
