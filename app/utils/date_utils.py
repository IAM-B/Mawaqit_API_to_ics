from datetime import datetime, timedelta
from typing import List, Tuple

def get_date_range(start_date: datetime, end_date: datetime) -> List[datetime]:
    """Génère une liste de dates entre start_date et end_date inclus."""
    date_list = []
    current_date = start_date
    while current_date <= end_date:
        date_list.append(current_date)
        current_date += timedelta(days=1)
    return date_list

def calculate_time_slots(start_time: datetime, end_time: datetime, 
                        padding_minutes: int = 0) -> Tuple[datetime, datetime]:
    """Calcule les créneaux horaires avec un padding optionnel."""
    if padding_minutes > 0:
        start_time = start_time + timedelta(minutes=padding_minutes)
        end_time = end_time - timedelta(minutes=padding_minutes)
    return start_time, end_time

def format_time_for_display(dt: datetime) -> str:
    """Formate une date pour l'affichage."""
    return dt.strftime("%H:%M") 