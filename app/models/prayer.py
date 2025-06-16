from dataclasses import dataclass
from datetime import datetime

@dataclass
class Prayer:
    name: str
    time: datetime
    mosque_id: str
    mosque_name: str

    def to_dict(self) -> dict:
        return {
            'name': self.name,
            'time': self.time.isoformat(),
            'mosque_id': self.mosque_id,
            'mosque_name': self.mosque_name
        }

@dataclass
class PrayerSchedule:
    prayers: list[Prayer]
    date: datetime

    def to_dict(self) -> dict:
        return {
            'date': self.date.isoformat(),
            'prayers': [prayer.to_dict() for prayer in self.prayers]
        } 