# API Documentation

## Endpoints

### Get Raw Mosque Data
```
GET /<masjid_id>/
```
Returns raw prayer time data for a specific mosque.

**Response:**
```json
{
    "rawdata": {
        "times": ["05:30", "13:00", "16:30", "19:00", "20:30"],
        "timezone": "Europe/Paris",
        "calendar": [...]
    }
}
```

### Get Today's Prayer Times
```
GET /<masjid_id>/today
```
Returns prayer times for the current day.

**Response:**
```json
{
    "fajr": "05:30",
    "sunset": "06:45",
    "dohr": "13:00",
    "asr": "16:30",
    "maghreb": "19:00",
    "icha": "20:30"
}
```

### Get Year Calendar
```
GET /<masjid_id>/calendar
```
Returns the entire year's calendar for a mosque.

**Response:**
```json
{
    "calendar": [
        {
            "1": ["05:30", "06:45", "13:00", "16:30", "19:00", "20:30"],
            "2": ["05:31", "06:46", "13:00", "16:31", "19:01", "20:31"],
            ...
        },
        ...
    ]
}
```

### Get Month Calendar
```
GET /<masjid_id>/calendar/<month_number>
```
Returns a specific month's calendar for a mosque.

**Response:**
```json
{
    "1": ["05:30", "06:45", "13:00", "16:30", "19:00", "20:30"],
    "2": ["05:31", "06:46", "13:00", "16:31", "19:01", "20:31"],
    ...
}
```

## Error Handling

The API uses standard HTTP status codes:

- `200 OK`: Request successful
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Mosque not found
- `500 Internal Server Error`: Server error

Error responses include a message:
```json
{
    "error": "Error message description"
}
```

## Data Formats

### Prayer Times
Prayer times are returned in 24-hour format (HH:MM).

### Calendar Data
Calendar data is structured as a list of months, where each month is a dictionary of days with prayer times.

### ICS Files
Generated ICS files follow the iCalendar specification and include:
- Prayer times with padding
- Available slots between prayers
- Empty slots for planning 