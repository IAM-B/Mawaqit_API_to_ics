# 🕌 Islamic Features Integration

## 📋 **Currently Active Features**

### ✅ **1. Sacred Months**

- **Muharram** (1st Hijri month)
- **Rajab** (7th Hijri month)
- **Dhul Qadah** (11th Hijri month)
- **Dhul Hijjah** (12th Hijri month)

### ✅ **2. Daily Hijri Dates**

- Display of Hijri date for each day
- Integration of Islamic events in titles

### ✅ **3. Jummah (Friday)**

- "Jummah" prefix for Dohr prayer on Friday
- Enhanced description with "🕌 Jummah Prayer"

### ✅ **4. Voluntary Fasts**

- **Mondays and Thursdays**: Marked as "Fasting Day"
- **Ayyam al-Bid**: 13th, 14th, 15th of each Hijri month marked as "White Day"

### ✅ **5. Adhkar**

- **Fajr**: "- Morning Adhkar" in the title
- **Asr**: "- Evening Adhkar" in the title

## 🚫 **Temporarily Disabled Features**

### **Major Islamic Events**

The following events have been temporarily removed because their dates are not fixed:

- ❌ **Ramadan** (beginning and end)
- ❌ **Laylat al-Qadr**
- ❌ **Eid al-Fitr**
- ❌ **Eid al-Adha**

**Reason:** These dates vary according to lunar observations and require precise astronomical calculations.

**Future plan:** Reintegration with a precise lunar calculation system and/or astronomical observation API.

## 🎯 **ICS Files Structure**

### **prayer.ics** (Main file)

- ✅ Prayer times
- ✅ Hijri dates with integrated events
- ✅ Sacred months
- ✅ Integrated Jummah
- ✅ Adhkar in titles

### **empty.ics** and **slots.ics**

- ✅ Free and available time slots
- ❌ No Islamic events (optimization)

## 📊 **Event Examples**

### **Hijri Dates with Events:**

```
SUMMARY:7 Muharram 1447
SUMMARY:8 Muharram 1447 - Fasting Day
SUMMARY:9 Muharram 1447 - Jummah
SUMMARY:13 Muharram 1447 - White Day
SUMMARY:15 Muharram 1447 - Fasting Day, White Day
```

### **Prayers with Jummah:**

```
SUMMARY:Jummah - Dohr (13:08)
DESCRIPTION:🕌 Jummah Prayer
```

### **Prayers with Adhkar:**

```
SUMMARY:Fajr (06:42) - Morning Adhkar
SUMMARY:Asr (15:42) - Evening Adhkar
```

## 🔧 **Configuration**

### **Available Options:**

- `include_voluntary_fasts`: Voluntary fasts (enabled by default)
- `show_hijri_date`: Hijri dates (enabled by default)
- `include_adhkar`: Adhkar (enabled by default)

## 🚀 **Next Steps**

1. **Precise lunar calculation system** for major events
2. **Astronomical observation API** for exact dates
3. **Push notifications** for important events
4. **Personalization** of reminders per user

## 🏗️ Technical Architecture

### Main Module: `islamic_features.py`

```python
class IslamicFeatures:
    def __init__(self, timezone_str: str)
  
    # Date conversion
    def get_hijri_date(self, gregorian_date: date) -> Tuple[int, int, int]
  
    # Islamic events
    def get_hijri_date_events(self, start_date: date, end_date: date, islamic_options: Dict) -> List[Dict]
    def get_adhkar_info(self, prayer_name: str) -> str
  
    # Calendar integration
    def add_islamic_events_to_calendar(self, cal: Calendar, start_date: date, end_date: date, islamic_options: Dict)
    def _add_event_to_calendar(self, cal: Calendar, event_data: Dict)
```

**Note:** The `timezone_str` parameter is now **required** and should be provided from the mosque's data to ensure international compatibility.

### Integration in Generators

#### 1. **Prayer Generator** (`prayer_generator.py`)

- Addition of Hijri dates to prayer events
- Special marking of Friday prayers
- Integration of Islamic events

#### 2. **Empty Generator** (`empty_generator.py`)

- Addition of Islamic events to free time slots
- Reminders in availability ranges

#### 3. **Slots Generator** (`slots_generator.py`)

- Integration of Islamic features in available time slots
- Consistency with other generators

## 🎨 User Interface

### Configurable Options

```html
<!-- Islamic options in the interface -->
<div class="config-section">
  <h4><i class="fa-solid fa-options"></i> Options</h4>
  
  <!-- Sunset -->
  <div class="option-item">
    <input type="checkbox" name="include_sunset" id="include_sunset" checked />
    <label>Include sunset (shurooq)</label>
  </div>
  
  <!-- Voluntary fasts -->
  <div class="option-item">
    <input type="checkbox" name="include_voluntary_fasts" id="include_voluntary_fasts" checked />
    <label>Voluntary fast reminders</label>
  </div>
  
  <!-- Hijri date -->
  <div class="option-item">
    <input type="checkbox" name="show_hijri_date" id="show_hijri_date" checked />
    <label>Hijri date</label>
  </div>
  
  <!-- Adhkar -->
  <div class="option-item">
    <input type="checkbox" name="include_adhkar" id="include_adhkar" checked />
    <label>Adhkar reminders</label>
  </div>
</div>
```

### JavaScript Logic

```javascript
// Islamic options management
setupIslamicOptions() {
  const islamicOptions = [
    'include_voluntary_fasts',
    'show_hijri_date',
    'include_adhkar'
  ];

  islamicOptions.forEach(optionId => {
    const checkbox = document.getElementById(optionId);
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        // Islamic options don't trigger progress
      });
    }
  });
}
```

## 🔧 Backend Integration

### Options Processing

```python
# In planner_view.py
def handle_planner_ajax():
    # Get Islamic options (only active options)
    islamic_options = {
        'include_voluntary_fasts': request.form.get('include_voluntary_fasts') == 'on',
        'show_hijri_date': request.form.get('show_hijri_date') == 'on',
        'include_adhkar': request.form.get('include_adhkar') == 'on'
    }
  
    # Pass to generators
    ics_path = generate_prayer_ics_file(
        # ... other parameters ...
        islamic_options=islamic_options
    )
```

### Cache and Performance

- **Cache enabled** for Islamic features
- On-demand generation to ensure data freshness
- Future optimization possible with intelligent cache

## 📅 Generated Event Examples

### Prayer Event with Hijri Date

```
BEGIN:VEVENT
UID:12345678-1234-1234-1234-123456789012
DTSTART:20241201T060000Z
DTEND:20241201T063500Z
SUMMARY:Fajr (06:00)
DESCRIPTION:Prayer including 10 min before and 35 min after
LOCATION:Mosque Example
END:VEVENT
```

### Jummah Event

```
BEGIN:VEVENT
UID:87654321-4321-4321-4321-210987654321
DTSTART:20241206T120000Z
DTEND:20241206T123500Z
SUMMARY:Jummah - Dhuhr (12:00)
DESCRIPTION:Prayer including 10 min before and 35 min after
🕌 Jummah Prayer
LOCATION:Mosque Example
END:VEVENT
```

### Fasting Event

```
BEGIN:VEVENT
UID:11111111-1111-1111-1111-111111111111
DTSTART;VALUE=DATE:20241202
DTEND;VALUE=DATE:20241203
SUMMARY:Monday Fasting
DESCRIPTION:Recommended voluntary fast
CATEGORIES:voluntary_fast
END:VEVENT
```

## 🚀 Integration Benefits

### 1. **Enhanced User Experience**

- Culturally adapted interface
- Configurable options according to preferences
- Automatic reminders of Islamic obligations

### 2. **Complete Features**

- Coverage of major events
- Reminders of recommended practices
- Hijri calendar integration

### 3. **Technical Flexibility**

- Modular architecture
- Activable/deactivatable options
- Extensibility for new features

### 4. **Data Consistency**

- Integration in all ICS file types
- Standardized format
- Universal calendar compatibility

## ✨ Future Evolutions

### Planned Features

- **Precise Hijri date calculation** with specialized library
- **Push notifications** for important events
- **Advanced personalization** of reminders
- **API integration** for official holiday dates

### Technical Improvements

- **Intelligent cache** with option-based invalidation
- **Optimized performance** for large volumes
- **Automated tests** for Islamic features
- **Complete API documentation**

## 📝 Development Notes

### Points of Attention

- Islamic event dates are approximate
- Hijri conversion uses a simplified algorithm
- Cache is enabled for all features

### Best Practices

- All options are enabled by default
- Features are non-blocking
- Interface remains consistent with existing design
- Errors are handled gracefully

## 🧹 Recent Cleanup

### Cleaned Code

- Removed unused functions in `islamic_features.py`
- Simplified JavaScript logic in `planner_page.js`
- Updated backend processing in `planner_view.py`
- Streamlined HTML form options

### Current Active Options

- ✅ `include_voluntary_fasts`: Voluntary fast reminders
- ✅ `show_hijri_date`: Hijri date display
- ✅ `include_adhkar`: Adhkar reminders

---

*This integration transforms the application into a true Islamic planning assistant, respecting traditions while using modern technologies.*
