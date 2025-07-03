# 🕌 Features Integration

## 📋 **Currently Active Features**

### ✅ **1. Sacred Months**

- **Muharram** (1st Hijri month) - 🌟 Sacred month
- **Rajab** (7th Hijri month) - 🌟 Sacred month  
- **Dhul Qadah** (11th Hijri month) - 🌟 Sacred month
- **Dhul Hijjah** (12th Hijri month) - 🌟 Sacred month

### ✅ **2. Daily Hijri Dates**

- Display of Hijri date for each day
- Integration events in titles
- Sacred months marked with 🌟 emoji

### ✅ **3. Jummah (Friday)**

- "Jummah" prefix for Friday events
- Enhanced description with "🕌 Jummah Prayer"

### ✅ **4. Voluntary Fasts**

- **Mondays and Thursdays**: Marked as "Jour de jeûne"
- **Ayyam al-Bid**: 13th, 14th, 15th of each Hijri month marked as "Jour blanc"

### ✅ **5. Adhkar**

- **Fajr**: "- Adhkar du matin" in the title
- **Asr**: "- Adhkar du soir" in the title

## 🚫 **Temporarily Disabled Features**

### **Major Religious Events**

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
- ❌ No religious events (optimization)

## 📊 **Event Examples**

### **Hijri Dates with Events:**

```
SUMMARY:🌟 7 Muharram 1447
SUMMARY:8 Muharram 1447 - Jour de jeûne
SUMMARY:9 Muharram 1447 - Jummah
SUMMARY:13 Muharram 1447 - Jour blanc
SUMMARY:15 Muharram 1447 - Jour de jeûne, Jour blanc
```

### **Prayers with Jummah:**

```
SUMMARY:Jummah - Dhuhr (13:08)
DESCRIPTION:🕌 Jummah Prayer
```

### **Prayers with Adhkar:**

```
SUMMARY:Fajr (06:42) - Adhkar du matin
SUMMARY:Asr (15:42) - Adhkar du soir
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

### Main Module: `option_features.py`

```python
class OptionFeatures:
    def __init__(self, timezone_str: str)
  
    # Date conversion
    def get_hijri_date(self, gregorian_date: date) -> Tuple[int, int, int]
    def get_hijri_date_string(self, gregorian_date) -> str
  
    # Religious events
    def get_hijri_date_events(self, start_date: date, end_date: date, features_options: Dict) -> List[Dict]
    def get_adhkar_info(self, prayer_name: str) -> str
  
    # Calendar integration
    def add_options_events_to_calendar(self, cal: Calendar, start_date: date, end_date: date, features_options: Dict)
    def _add_event_to_calendar(self, cal: Calendar, event_data: Dict)
```

**Note:** The `timezone_str` parameter is **required** and should be provided from the mosque's data to ensure international compatibility.

### Integration in Generators

#### 1. **Prayer Generator** (`prayer_generator.py`)

- Addition of Hijri dates to prayer events
- Special marking of Friday prayers
- Integration of religious events

#### 2. **Empty Generator** (`empty_generator.py`)

- Addition of religious events to free time slots
- Reminders in availability ranges

#### 3. **Slots Generator** (`slots_generator.py`)

- Integration of religious features in available time slots
- Consistency with other generators

### Key Implementation Details

#### **Hijri Date Conversion**
- Uses simplified algorithm with reference date: 1 Muharram 1445 AH = 19 July 2023 CE
- Approximate conversion (354.37 days per Hijri year)
- For production, consider using specialized libraries like `hijri-converter`

#### **Event Categories**
- `hijri_date`: Regular Hijri date events
- `hijri_date,sacred_month`: Sacred month events (with 🌟 emoji)
- `voluntary_fasts`: Voluntary fasting events

#### **Conditional Event Creation**
- If `show_hijri_date` is enabled: Creates Hijri date events with integrated religious info
- If `show_hijri_date` is disabled but `include_voluntary_fasts` is enabled: Creates separate voluntary fasts events
- Sacred months always marked with 🌟 emoji when Hijri dates are shown

## 🎨 User Interface

### Configurable Options

```html
<!-- Features options in the interface -->
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
// Features options management
setupFeaturesOptions() {
  const featuresOptions = [
    'include_voluntary_fasts',
    'show_hijri_date',
    'include_adhkar'
  ];

  featuresOptions.forEach(optionId => {
    const checkbox = document.getElementById(optionId);
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        // Options don't trigger progress
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
    # Get Features options (only active options)
    features_options = {
        'include_voluntary_fasts': request.form.get('include_voluntary_fasts') == 'on',
        'show_hijri_date': request.form.get('show_hijri_date') == 'on',
        'include_adhkar': request.form.get('include_adhkar') == 'on'
    }
  
    # Pass to generators
    ics_path = generate_prayer_ics_file(
        # ... other parameters ...
        features_options=features_options
    )
```

### Cache and Performance

- **Cache enabled** for features options
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
SUMMARY:Jour de jeûne
DESCRIPTION:Jeûnes surérogatoires : Jour de jeûne
CATEGORIES:voluntary_fasts
END:VEVENT
```

### Sacred Month Event

```
BEGIN:VEVENT
UID:22222222-2222-2222-2222-222222222222
DTSTART;VALUE=DATE:20241201
DTEND;VALUE=DATE:20241202
SUMMARY:🌟 1 Muharram 1447
DESCRIPTION:Date Hijri :🌟 1 Muharram 1447
Rappel : Mois sacré de Muharram
CATEGORIES:hijri_date,sacred_month
END:VEVENT
```

## 🚀 Integration Benefits

### 1. **Enhanced User Experience**

- Culturally adapted interface
- Configurable options according to preferences
- Automatic reminders of religious obligations

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
- **Automated tests** for features options
- **Complete API documentation**

## 📝 Development Notes

### Points of Attention

- Religious event dates are approximate
- Hijri conversion uses a simplified algorithm (reference: 1 Muharram 1445 AH = 19 July 2023 CE)
- Cache is enabled for all features
- Timezone parameter is required for international compatibility

### Best Practices

- All options are enabled by default
- Features are non-blocking
- Interface remains consistent with existing design
- Errors are handled gracefully
- Sacred months are marked with 🌟 emoji
- French terminology used for voluntary fasts ("Jour de jeûne", "Jour blanc")

## 🧹 Recent Cleanup

### Cleaned Code

- Streamlined `OptionFeatures` class in `option_features.py`
- Simplified JavaScript logic in `planner_page.js`
- Updated backend processing in `planner_view.py`
- Streamlined HTML form options

### Current Active Options

- ✅ `include_voluntary_fasts`: Voluntary fast reminders ("Jour de jeûne", "Jour blanc")
- ✅ `show_hijri_date`: Hijri date display (with sacred month 🌟 marking)
- ✅ `include_adhkar`: Adhkar reminders ("Adhkar du matin", "Adhkar du soir")

### Implementation Highlights

- **Conditional Logic**: Hijri dates and voluntary fasts are integrated when `show_hijri_date` is enabled
- **Sacred Month Detection**: Automatic 🌟 marking for Muharram, Rajab, Dhul Qadah, Dhul Hijjah
- **French Localization**: All user-facing text in French for consistency
- **Event Categories**: Proper categorization for calendar applications

---

*This integration transforms the application into a true prayer planning assistant, respecting traditions while using modern technologies.*
