def apply_silent_settings(slots):
    for slot in slots:
        slot['summary'] = 'Créneau disponible'
        slot['description'] = 'Temps disponible entre les prières'
        slot['transparent'] = True
        slot['mute'] = True
    return slots
