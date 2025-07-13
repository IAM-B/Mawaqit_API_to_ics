"""
options features module for prayer planning application.
This module handles options events, voluntary fasts, Jummah prayers, Hijri dates, and adhkar reminders.
"""

from datetime import date, datetime, timedelta
from typing import Optional
from uuid import uuid4

from icalendar import Calendar, Event


class OptionFeatures:
    """Class to handle options calendar features and events."""

    def __init__(self, timezone_str: str):
        """
        Initialize OptionFeatures with the mosque's timezone.

        Args:
            timezone_str (str): Timezone string from the mosque data (e.g., "Europe/Paris", "America/New_York", "Asia/Dubai")
        """
        self.timezone_str = timezone_str

    def get_hijri_date(self, gregorian_date) -> tuple[int, int, int]:
        """
        Convert Gregorian date to Hijri date.
        Uses a simplified algorithm for approximate conversion.

        Args:
            gregorian_date: Gregorian date to convert (date or datetime)

        Returns:
            Tuple[int, int, int]: (year, month, day) in Hijri calendar
        """
        # Convert to date if it's a datetime
        if isinstance(gregorian_date, datetime):
            gregorian_date = gregorian_date.date()

        # Simplified Hijri conversion (approximate)
        # This is a basic implementation - for production, consider using a library like hijri-converter

        # Reference date: 1 Muharram 1445 AH = 19 July 2023 CE
        reference_date = date(2023, 7, 19)
        reference_hijri = (1445, 1, 1)

        days_diff = (gregorian_date - reference_date).days

        # Approximate Hijri year length (354.37 days)
        hijri_year = reference_hijri[0] + (days_diff // 354)
        remaining_days = days_diff % 354

        # Simplified month calculation
        hijri_months = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29]
        hijri_month = 1
        hijri_day = 1

        for month_days in hijri_months:
            if remaining_days >= month_days:
                remaining_days -= month_days
                hijri_month += 1
            else:
                hijri_day += remaining_days
                break

        return (hijri_year, hijri_month, hijri_day)

    def get_hijri_date_string(self, gregorian_date) -> str:
        """
        Get Hijri date as a formatted string.

        Args:
            gregorian_date: Gregorian date to convert (date or datetime)

        Returns:
            str: Formatted Hijri date string
        """
        # Convert to date if it's a datetime
        if isinstance(gregorian_date, datetime):
            gregorian_date = gregorian_date.date()

        hijri_year, hijri_month, hijri_day = self.get_hijri_date(gregorian_date)

        # Hijri month names
        hijri_months = [
            "Muharram",
            "Safar",
            "Rabi al-Awwal",
            "Rabi al-Thani",
            "Jumada al-Awwal",
            "Jumada al-Thani",
            "Rajab",
            "Sha'ban",
            "Ramadan",
            "Shawwal",
            "Dhul Qadah",
            "Dhul Hijjah",
        ]

        return f"{hijri_day} {hijri_months[hijri_month - 1]} {hijri_year}"

    def get_hijri_date_events(
        self, start_date: date, end_date: date, features_options: Optional[dict] = None
    ) -> list[dict]:
        """
        Get Hijri date events for each day with options information integrated.

        Args:
            start_date (date): Start date
            end_date (date): End date
            features_options (Dict): options options to include additional info

        Returns:
            List[Dict]: List of Hijri date events with options info
        """
        hijri_events = []
        current_date = start_date

        while current_date <= end_date:
            hijri_year, hijri_month, hijri_day = self.get_hijri_date(current_date)
            hijri_date_str = self.get_hijri_date_string(current_date)

            # Check if it's a sacred month
            is_sacred_month = hijri_month in [1, 7, 11, 12]
            sacred_month_name = None
            if is_sacred_month:
                if hijri_month == 1:
                    sacred_month_name = "Muharram"
                elif hijri_month == 7:
                    sacred_month_name = "Rajab"
                elif hijri_month == 11:
                    sacred_month_name = "Dhul Qadah"
                elif hijri_month == 12:
                    sacred_month_name = "Dhul Hijjah"

            # Get voluntary fasts info
            voluntary_fasts_info = []
            if features_options and features_options.get(
                "include_voluntary_fasts", False
            ):
                # Monday and Thursday fasts
                if current_date.weekday() in [0, 3]:
                    voluntary_fasts_info.append("Jour de jeûne")

                # Ayyam al-Bid (13-15 Hijri)
                if hijri_day in [13, 14, 15]:
                    voluntary_fasts_info.append("Jour blanc")

            # Get Jummah info
            jummah_info = []
            if features_options and current_date.weekday() == 4:
                jummah_info.append("Jummah")

            # Combine all info
            all_info = voluntary_fasts_info + jummah_info

            # Create events based on options
            show_hijri = features_options and features_options.get(
                "show_hijri_date", False
            )
            show_voluntary_fasts = features_options and features_options.get(
                "include_voluntary_fasts", False
            )

            if show_hijri:
                # Create Hijri date event (with or without voluntary fasts)
                if is_sacred_month:
                    title = f"🌟 {hijri_date_str}"
                    description = f"Date Hijri :🌟 {hijri_date_str}"
                    if sacred_month_name:
                        description += f"\nRappel : Mois sacré de {sacred_month_name}"
                else:
                    title = f"{hijri_date_str}"
                    description = f"Date Hijri : {hijri_date_str}"

                # Add voluntary fasts and Jummah to Hijri event if they exist
                if all_info:
                    title += f" - {', '.join(all_info)}"
                    description += f"\nÉvénements religieux : {', '.join(all_info)}"

                # Set category based on sacred month
                category = "hijri_date"
                if is_sacred_month:
                    category = "hijri_date,sacred_month"

                hijri_events.append(
                    {
                        "date": current_date,
                        "name": title,
                        "description": description,
                        "type": category,
                    }
                )

            # Create separate voluntary fasts events ONLY if Hijri dates are disabled
            elif show_voluntary_fasts and voluntary_fasts_info:
                # Create separate voluntary fasts event
                title = f"{', '.join(voluntary_fasts_info)}"
                description = (
                    f"Jeûnes surérogatoires : {', '.join(voluntary_fasts_info)}"
                )

                # Add Jummah info if it's Friday
                if jummah_info:
                    title += f" - {', '.join(jummah_info)}"
                    description += f"\nÉvénements religieux : {', '.join(jummah_info)}"

                hijri_events.append(
                    {
                        "date": current_date,
                        "name": title,
                        "description": description,
                        "type": "voluntary_fasts",
                    }
                )

            current_date += timedelta(days=1)

        return hijri_events

    def get_adhkar_info(self, prayer_name: str) -> str:
        """
        Get adhkar information for specific prayers.

        Args:
            prayer_name (str): Name of the prayer (fajr, asr)

        Returns:
            str: Adhkar information to append to prayer title
        """
        if prayer_name.lower() == "fajr":
            return "- Adhkar du matin"
        elif prayer_name.lower() == "asr":
            return "- Adhkar du soir"
        return ""

    def add_options_events_to_calendar(
        self, cal: Calendar, start_date, end_date, features_options: dict
    ) -> None:
        """
        Add options events to the calendar based on options.

        Args:
            cal (Calendar): iCalendar object to add events to
            start_date: Start date for events (date or datetime)
            end_date: End date for events (date or datetime)
            features_options (Dict): Dictionary of options options
        """
        # Convert to date if they are datetime objects
        if isinstance(start_date, datetime):
            start_date = start_date.date()
        if isinstance(end_date, datetime):
            end_date = end_date.date()

        if not features_options:
            return

        # Add Hijri dates with integrated options information
        if features_options.get("show_hijri_date", False):
            hijri_events = self.get_hijri_date_events(
                start_date, end_date, features_options
            )
            for hijri_event in hijri_events:
                self._add_event_to_calendar(cal, hijri_event)

        # Add voluntary fasts events ONLY if Hijri dates are disabled
        elif features_options.get("include_voluntary_fasts", False):
            hijri_events = self.get_hijri_date_events(
                start_date, end_date, features_options
            )
            for hijri_event in hijri_events:
                # Only add voluntary fasts events, not Hijri date events
                if hijri_event["type"] == "voluntary_fasts":
                    self._add_event_to_calendar(cal, hijri_event)

    def _add_event_to_calendar(self, cal: Calendar, event_data: dict) -> None:
        """
        Add a single event to the calendar.

        Args:
            cal (Calendar): iCalendar object
            event_data (Dict): Event data dictionary
        """
        event = Event()
        event.add("uid", str(uuid4()))

        # Set event time
        if "time" in event_data:
            # Event with specific time
            event_time = datetime.strptime(event_data["time"], "%H:%M").time()
            event_datetime = datetime.combine(event_data["date"], event_time)
            event.add("dtstart", event_datetime)
            event.add("dtend", event_datetime + timedelta(minutes=30))
        else:
            # All-day event
            event.add("dtstart", event_data["date"])
            event.add("dtend", event_data["date"] + timedelta(days=1))

        event.add("summary", event_data["name"])
        event.add("description", event_data["description"])

        # Add category based on event type
        event.add("categories", [event_data["type"]])

        cal.add_component(event)
