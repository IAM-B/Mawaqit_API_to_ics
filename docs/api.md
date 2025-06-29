# API Documentation

## Overview

The Mawaqit API provides endpoints to fetch prayer times and generate ICS calendar files. The API is designed to be simple and RESTful, returning JSON responses for data endpoints and ICS files for calendar exports.

## Base URL

```
http://localhost:5000
```

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

## Endpoints

### 1. Get Raw Mosque Data

Returns raw prayer time data for a specific mosque.

```
GET /<masjid_id>/
```

**Parameters:**
- `masjid_id` (string, required): The unique identifier for the mosque

**Response:**
```json
{
    "rawdata": {
        "times": ["05:30", "13:00", "16:30", "19:00", "20:30"],
        "timezone": "Europe/Paris",
        "calendar": [
            {
                "1": ["05:30", "06:45", "13:00", "16:30", "19:00", "20:30"],
                "2": ["05:31", "06:46", "13:00", "16:31", "19:01", "20:31"]
            }
        ]
    }
}
```

**Error Response:**
```json
{
    "error": "Mosque not found",
    "status": 404
}
```

### 2. Get Today's Prayer Times

Returns prayer times for the current day.

```
GET /<masjid_id>/today
```

**Parameters:**
- `masjid_id` (string, required): The unique identifier for the mosque

**Response:**
```json
{
    "fajr": "05:30",
    "sunset": "06:45",
    "dohr": "13:00",
    "asr": "16:30",
    "maghreb": "19:00",
    "icha": "20:30",
    "date": "2025-01-15",
    "timezone": "Europe/Paris"
}
```

### 3. Get Year Calendar

Returns the entire year's calendar for a mosque.

```
GET /<masjid_id>/calendar
```

**Parameters:**
- `masjid_id` (string, required): The unique identifier for the mosque

**Response:**
```json
{
    "calendar": [
        {
            "1": ["05:30", "06:45", "13:00", "16:30", "19:00", "20:30"],
            "2": ["05:31", "06:46", "13:00", "16:31", "19:01", "20:31"],
            "3": ["05:32", "06:47", "13:00", "16:32", "19:02", "20:32"]
        }
    ],
    "year": 2025,
    "timezone": "Europe/Paris"
}
```

### 4. Get Month Calendar

Returns a specific month's calendar for a mosque.

```
GET /<masjid_id>/calendar/<month_number>
```

**Parameters:**
- `masjid_id` (string, required): The unique identifier for the mosque
- `month_number` (integer, required): Month number (1-12)

**Response:**
```json
{
    "1": ["05:30", "06:45", "13:00", "16:30", "19:00", "20:30"],
    "2": ["05:31", "06:46", "13:00", "16:31", "19:01", "20:31"],
    "3": ["05:32", "06:47", "13:00", "16:32", "19:02", "20:32"],
    "month": 1,
    "year": 2025,
    "timezone": "Europe/Paris"
}
```

### 5. Generate ICS File

Generates an ICS calendar file for prayer times and slots.

```
GET /<masjid_id>/ics
```

**Parameters:**
- `masjid_id` (string, required): The unique identifier for the mosque
- `scope` (string, optional): Time scope - "day", "month", or "year" (default: "day")
- `type` (string, optional): ICS type - "prayers", "slots", or "empty" (default: "prayers")
- `padding_before` (integer, optional): Minutes before prayer (default: 0)
- `padding_after` (integer, optional): Minutes after prayer (default: 20)

**Response:**
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Mawaqit API//ICS Generator//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:20250115T053000Z@mawaqit
DTSTAMP:20250115T000000Z
DTSTART:20250115T053000Z
DTEND:20250115T060000Z
SUMMARY:Fajr Prayer
DESCRIPTION:Prayer time with padding
END:VEVENT
END:VCALENDAR
```

**Headers:**
```
Content-Type: text/calendar
Content-Disposition: attachment; filename="prayer_times.ics"
```

### 6. Search Mosques

Search for mosques by location or name.

```
GET /search
```

**Query Parameters:**
- `q` (string, required): Search query (city, country, or mosque name)
- `limit` (integer, optional): Maximum number of results (default: 10)

**Response:**
```json
{
    "results": [
        {
            "id": "12345",
            "name": "Grand Mosque of Paris",
            "city": "Paris",
            "country": "France",
            "address": "2bis Place du Puits de l'Ermite, 75005 Paris"
        }
    ],
    "total": 1,
    "query": "Paris"
}
```

## Error Handling

The API uses standard HTTP status codes:

- `200 OK`: Request successful
- `400 Bad Request`: Invalid parameters or request format
- `404 Not Found`: Mosque not found or endpoint doesn't exist
- `500 Internal Server Error`: Server error or processing failure

### Error Response Format

All error responses follow this format:

```json
{
    "error": "Error message description",
    "status": 404,
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_123456"
}
```

## Data Formats

### Prayer Times

Prayer times are returned in 24-hour format (HH:MM) and include:

- **fajr**: Dawn prayer
- **sunset**: Sunrise
- **dohr**: Noon prayer
- **asr**: Afternoon prayer
- **maghreb**: Sunset prayer
- **icha**: Night prayer

### Calendar Data

Calendar data is structured as a list of months, where each month is a dictionary of days with prayer times:

```json
{
    "day_number": ["fajr", "sunset", "dohr", "asr", "maghreb", "icha"]
}
```

### ICS Files

Generated ICS files follow the iCalendar specification (RFC 5545) and include:

- **Prayer times**: With configurable padding before/after
- **Available slots**: Free time between prayers
- **Empty slots**: Planning time slots

#### ICS File Types

1. **Prayers** (`type=prayers`): Only prayer times
2. **Slots** (`type=slots`): Available time slots between prayers
3. **Empty** (`type=empty`): Empty slots for planning

## Rate Limiting

Currently, there are no rate limits implemented. However, it's recommended to:

- Cache responses when possible
- Use appropriate timeouts
- Implement retry logic with exponential backoff

## Caching

The API implements intelligent caching:

- **Prayer times**: Cached for 24 hours
- **Mosque data**: Cached for 7 days
- **Search results**: Cached for 1 hour

Cache headers are included in responses:

```
Cache-Control: public, max-age=86400
ETag: "abc123def456"
```

## Examples

### Complete Workflow

1. **Search for a mosque:**
```bash
curl "http://localhost:5000/search?q=Paris&limit=5"
```

2. **Get today's prayer times:**
```bash
curl "http://localhost:5000/12345/today"
```

3. **Generate ICS file:**
```bash
curl "http://localhost:5000/12345/ics?scope=month&type=prayers&padding_before=10&padding_after=30" \
  -o prayer_times.ics
```

### JavaScript Example

```javascript
// Search for mosques
const searchResponse = await fetch('/search?q=London');
const searchData = await searchResponse.json();

// Get prayer times
const prayerResponse = await fetch(`/${searchData.results[0].id}/today`);
const prayerData = await prayerResponse.json();

// Download ICS file
const icsResponse = await fetch(`/${searchData.results[0].id}/ics?scope=week`);
const icsBlob = await icsResponse.blob();
const url = window.URL.createObjectURL(icsBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'prayer_times.ics';
a.click();
```

## Versioning

The current API version is v1. Future versions will be available at `/api/v2/`, `/api/v3/`, etc.

## Support

For API support:
- Check the response status codes and error messages
- Review the request parameters
- Ensure the mosque ID is valid
- Check the server logs for detailed error information 