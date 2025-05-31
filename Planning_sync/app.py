from flask import Flask, render_template, request
from modules.mawaqit_api import fetch_mosques
from modules.time_segmenter import segment_available_time, generate_empty_slots
from modules.ics_generator import generate_ics_file
from modules.empty_slots_generator import generate_empty_slot_events
from pathlib import Path
from datetime import datetime

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route('/planner', methods=['POST'])
def planner():
    masjid_id = request.form['masjid_id']
    period = request.form['scope']
    
    try:
        # 📥 Données de prière
        prayer_times = fetch_mosques(masjid_id, period)

        # 📁 Génération fichier ICS standard
        ics_path = generate_ics_file(masjid_id, period)
        ics_url = f"/static/ics/{Path(ics_path).name}"

        # 📁 Génération ICS créneaux vides (seulement si scope = today)
        empty_ics_url = None
        if not isinstance(prayer_times, list):  # today
            filename = f"static/ics/empty_slots_{masjid_id}.ics"
            empty_path = generate_empty_slot_events(prayer_times, datetime.now(), filename)
            empty_ics_url = f"/{empty_path}"

        # 📊 Segments pour affichage HTML
        if isinstance(prayer_times, list):
            segments = []
            for i, daily in enumerate(prayer_times):
                try:
                    slots = segment_available_time(daily)
                    segments.append({"day": i + 1, "slots": slots})
                except Exception as e:
                    print(f"⚠️ Erreur jour {i+1} : {e}")
        else:
            segments = segment_available_time(prayer_times)

        return render_template(
            "planner.html",
            download_link=ics_url,
            empty_slots_link=empty_ics_url,
            segments=segments
        )

    except Exception as e:
        return f"<h2>❌ Erreur : {e}</h2>", 500

if __name__ == "__main__":
    try:
        print(">> Lancement du serveur Flask...")
        app.run(debug=True)
    except KeyboardInterrupt:
        print("🛑 Arrêt du serveur Flask.")

