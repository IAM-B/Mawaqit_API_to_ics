from flask import Flask, render_template, request, abort
from modules.mawaqit_api import fetch_mosques
from modules.time_segmenter import segment_available_time
from modules.prayer_generator import generate_prayer_ics_file
from modules.empty_slots_generator import generate_empty_slots_by_scope
from modules.slots_generator import generate_slots_by_scope
from modules.slot_utils import adjust_slots_rounding
from modules.mute_utils import apply_silent_settings
from pathlib import Path
from datetime import datetime

app = Flask(__name__)

app.config['PROPAGATE_EXCEPTIONS'] = False
app.config['TRAP_HTTP_EXCEPTIONS'] = True

@app.route("/")
def index():
    return render_template("index.html")

@app.route('/planner', methods=['GET'])
def redirect_planner():
    return render_template("error.html", error_message="Accès direct à /planner non autorisé. Merci de soumettre le formulaire.")

@app.route('/planner', methods=['POST'])
def planner():
    masjid_id = request.form['masjid_id']
    period = request.form['scope']

    padding_before = int(request.form.get('padding_before', 10))
    padding_after = int(request.form.get('padding_after', 35))

    try:
        slots_download_link = None

        # 📥 Récupération des horaires de prière
        prayer_times, tz_str = fetch_mosques(masjid_id, period)

        # 🕌 Génération du fichier .ics des prières
        ics_path = generate_prayer_ics_file(masjid_id, period, tz_str, padding_before, padding_after)
        ics_url = f"/static/ics/{Path(ics_path).name}"

        # 🕳️ Créneaux vides (générés pour tous les scopes)
        empty_path = generate_empty_slots_by_scope(
            masjid_id=masjid_id,
            scope=period,
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
            scope=period,  # ou scope si tu renommes
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

@app.route("/debug/<masjid_id>")
def debug_masjid_data(masjid_id):
    import requests, json
    try:
        url = f"http://localhost:8000/api/v1/{masjid_id}"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        return f"<pre>{json.dumps(data, indent=2, ensure_ascii=False)}</pre>"
    except Exception as e:
        return f"❌ Erreur : {e}", 500

if __name__ == "__main__":
    try:
        print(">> Lancement du serveur Flask...")
        app.run(debug=False)
    except KeyboardInterrupt:
        print("🛑 Arrêt du serveur Flask.")
