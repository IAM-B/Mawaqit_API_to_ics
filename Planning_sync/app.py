from flask import Flask, render_template, request
from modules.mawaqit_api import fetch_mosques
from modules.time_segmenter import segment_available_time
from modules.ics_generator import generate_ics_file

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/planner", methods=["POST"])
def planner():
    # Exemple de récupération des paramètres du formulaire
    masjid_id = request.form.get("masjid_id")
    period = request.form.get("period")  # jour/mois/annee

    # Appels aux modules
    prayer_times = fetch_mosques(masjid_id, period)
    segments = segment_available_time(prayer_times)
    ics_path = generate_ics_file(prayer_times, masjid_id, period)

    return render_template("planner.html", segments=segments, ics_file=ics_path)

if __name__ == "__main__":
    app.run(debug=True)
