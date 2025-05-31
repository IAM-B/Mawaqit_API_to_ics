from datetime import datetime

def apply_slot_edits(slots, form_data):
    index = int(form_data.get("index", -1))
    start = form_data.get("start")
    end = form_data.get("end")

    if 0 <= index < len(slots) and start and end:
        slots[index] = {"start": start, "end": end}
    return slots
