from flask import Flask, render_template, request
from modules.mawaqit_api import fetch_mosques
from modules.time_segmenter import segment_available_time
from modules.ics_generator import generate_ics_file

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route('/planner', methods=['POST'])
def planner():
    masjid_id = request.form['masjid_id']
    period = request.form['scope']
    
    try:
        prayer_times = fetch_mosques(masjid_id, period)
        
        # Génération du fichier ICS
        ics_path = generate_ics_file(masjid_id, period)
        
        # Gestion des segments
        if isinstance(prayer_times, list):
            segments = []
            for i, daily in enumerate(prayer_times):
                try:
                    day_segments = segment_available_time(daily)
                    segments.append({
                        "day": i + 1,
                        "slots": day_segments
                    })
                except Exception as e:
                    print(f"⚠️ Erreur jour {i+1} : {e}")
        else:
            segments = segment_available_time(prayer_times)

        return render_template("planner.html", segments=segments, file_path=ics_path)
    
    except Exception as e:
        return f"<h2>❌ Erreur : {e}</h2>", 500

if __name__ == "__main__":
    try:
        print(">> Lancement du serveur Flask...")
        app.run(debug=True)
    except KeyboardInterrupt:
        print("🛑 Arrêt du serveur Flask.")

