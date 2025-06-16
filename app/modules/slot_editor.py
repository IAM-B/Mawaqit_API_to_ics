from flask import request, render_template
from datetime import datetime

# Édite un créneau dans la liste en fonction du formulaire reçu
def apply_slot_edits(slots, form_data):
    index = int(form_data.get("index", -1))
    start = form_data.get("start")
    end = form_data.get("end")

    if 0 <= index < len(slots) and start and end:
        slots[index] = {"start": start, "end": end}
    return slots

# Fonction principale appelée depuis app.py
def render_slot_editor(req):
    if req.method == 'POST':
        return handle_post(req)
    else:
        return render_get()

# Pour GET : retourne une interface d’édition avec quelques créneaux factices
def render_get():
    slots = [
        {"start": "2025-05-31T09:00:00", "end": "2025-05-31T10:00:00"},
        {"start": "2025-05-31T11:00:00", "end": "2025-05-31T12:00:00"}
    ]
    return render_template("slot_editor.html", slots=slots)

# Pour POST : à implémenter selon ton besoin (modification, validation, export...)
def handle_post(req):
    # Exemple minimal de retour JSON
    return {"message": "Slot POST not implemented"}, 200