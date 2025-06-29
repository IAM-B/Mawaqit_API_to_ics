/*
========================================
  PLANNER.JS - Main script for planner page
  ---------------------------------------
  Structure for unified JS (timeline, calendar, clock, map, search...)
========================================

  TABLE OF CONTENTS:
  1. Global utilities
  2. Timeline (vertical agenda)
  3. Calendar (calendar grid)
  4. Clock (circular clock)
  5. Compact Map (mosque map)
  6. Mosque Search (dropdowns)
  7. Map Loader (OpenStreetMap)
  8. PlannerPage (form, config, download, etc.)
  9. Central initialization & synchronization

========================================
*/

// =========================
// 1. GLOBAL UTILITIES
// =========================
// Date formatting for display (e.g.: "Mon 15 Jan")
function formatDateForDisplay(date) {
  const options = {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  };
  return date.toLocaleDateString('fr-FR', options);
}
// Conversion HH:MM -> minutes since midnight
function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}
// Conversion minutes -> HH:MM
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// =========================
// 2. TIMELINE (vertical agenda)
// =========================
// Main class for the vertical timeline (SVG agenda)
class Timeline {
  constructor() {
    this.container = null;
    this.svg = null;
    this.currentDate = new Date();
    this.segments = [];
    this.scope = 'today';
    this.tooltip = null;
    this.currentView = 'timeline'; // 'timeline' or 'slots'
    this.init();
  }
  // Timeline initialization
  init() {
    this.createTimelineContainer();
    this.createTooltip();
    this.setupViewToggle();
    
    // Set initial date to today and update display
    const today = new Date();
    this.currentDate = today;
    this.updateTimelineDate();
    
    if (this.container && this.svg) {
      this.showTimelineView();
    } else {
      this.showSlotsView();
    }
  }
  // Create the main container
  createTimelineContainer() {
    this.container = document.querySelector('.slots-half');
    this.svg = document.querySelector('.slots-timeline-svg');
    if (this.container && this.svg) {
      this.createSVGGrid(this.svg);
    }
  }
  // Create the SVG grid (hours, labels, groups)
  createSVGGrid(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('class', 'timeline-grid');
    const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelsGroup.setAttribute('class', 'timeline-labels');
    const eventsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    eventsGroup.setAttribute('class', 'timeline-events');
    const nowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nowGroup.setAttribute('class', 'timeline-now');
    svg.appendChild(gridGroup);
    svg.appendChild(labelsGroup);
    svg.appendChild(eventsGroup);
    svg.appendChild(nowGroup);
    this.eventsGroup = eventsGroup;
    this.nowGroup = nowGroup;
    for (let hour = 0; hour <= 24; hour++) {
      const y = hour * 60; // 60px per hour
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 60);
      line.setAttribute('y1', y);
      line.setAttribute('x2', 400);
      line.setAttribute('y2', y);
      line.setAttribute('class', 'timeline-hour-line');
      gridGroup.appendChild(line);
      if (hour < 24) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 52);
        text.setAttribute('y', y + 6);
        text.textContent = `${hour.toString().padStart(2, '0')}:00`;
        text.setAttribute('class', 'timeline-hour-text');
        text.setAttribute('text-anchor', 'end');
        labelsGroup.appendChild(text);
      }
    }
    const verticalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    verticalLine.setAttribute('x1', 60);
    verticalLine.setAttribute('y1', 0);
    verticalLine.setAttribute('x2', 60);
    verticalLine.setAttribute('y2', 1440);
    verticalLine.setAttribute('class', 'timeline-hour-line');
    gridGroup.appendChild(verticalLine);
  }
  // Tooltip for events
  createTooltip() {
    this.tooltip = document.querySelector('.timeline-tooltip');
    if (!this.tooltip) {
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'timeline-tooltip';
      this.tooltip.style.position = 'absolute';
      this.tooltip.style.zIndex = '1000';
      this.tooltip.style.pointerEvents = 'none';
      document.body.appendChild(this.tooltip);
    }
  }
  // Timeline data initialization
  initializeTimeline(segments, scope) {
    this.segments = segments;
    this.scope = scope;
    
    // Set current date to today and update display
    const today = new Date();
    this.currentDate = today;
    this.updateTimelineDate();
    
    // Display events for today by default
    this.displayDayEvents(today);
  }
  // Update the date displayed in the header
  updateTimelineDate() {
    const currentDateElement = document.getElementById('slotsCurrentDate');
    if (currentDateElement) {
      currentDateElement.textContent = formatDateForDisplay(this.currentDate);
    }
  }
  // Display events for a given day
  displayDayEvents(date) {
    this.currentDate = date;
    this.updateTimelineDate();
    this.clearEvents();
    const dayData = this.getDayData(date);
    if (!dayData) {
      this.showEmptyState();
      return;
    }
    this.displayPrayers(dayData.prayer_times);
    this.displaySlots(dayData.slots);
    // this.displayEmptySlots(dayData.slots);
  }
  // Get the day's data
  getDayData(date) {
    if (!this.segments || this.segments.length === 0) return null;
    const day = date.getDate();
    const month = date.getMonth();
    if (this.scope === 'today' && this.segments.length > 0) {
      return this.segments[0];
    }
    if (this.scope === 'month') {
      const dayIndex = day - 1;
      if (dayIndex >= 0 && dayIndex < this.segments.length) {
        return this.segments[dayIndex];
      }
    }
    if (this.scope === 'year') {
      const monthIndex = month;
      if (monthIndex >= 0 && monthIndex < this.segments.length) {
        const monthData = this.segments[monthIndex];
        if (monthData && monthData.days) {
          const dayIndex = day - 1;
          if (dayIndex >= 0 && dayIndex < monthData.days.length) {
            return monthData.days[dayIndex];
          }
        }
      }
    }
    return null;
  }
  // Display prayers
  displayPrayers(prayerTimes) {
    if (!prayerTimes) return;
    
    // Get paddings from global variables
    const paddingBefore = window.currentPaddingBefore || 0;
    const paddingAfter = window.currentPaddingAfter || 0;
    
    const prayerNames = {
      'fajr': 'Fajr',
      'sunset': 'Sunset',
      'dohr': 'Dohr',
      'asr': 'Asr',
      'maghreb': 'Maghreb',
      'icha': 'Icha'
    };
    Object.entries(prayerTimes).forEach(([prayer, time]) => {
      if (time && prayerNames[prayer]) {
        // Calculate exact prayer time (without padding)
        const exactStartTime = this.subtractPadding(time, paddingBefore);
        const exactEndTime = this.addPadding(time, paddingAfter);
        
        // Display exact prayer time with displayed time between parentheses
        const prayerTitle = `${prayerNames[prayer]} (${time})`;
        
        // For synchronization, use exact time (without padding)
        this.createSVGEvent(prayerTitle, exactStartTime, exactEndTime, 'prayer', 'prayer', time);
      }
    });
  }
  // Display slots
  displaySlots(slots) {
    if (!slots || !Array.isArray(slots)) return;
    
    // Get paddings from global variables
    const paddingBefore = window.currentPaddingBefore || 0;
    const paddingAfter = window.currentPaddingAfter || 0;
    
    // Get prayer times for slot calculation
    const dayData = this.getDayData(this.currentDate);
    const prayerTimes = dayData ? dayData.prayer_times : null;
    
    if (prayerTimes) {
      // Calculate real slots based on prayers (positionnement correct)
      const prayerEntries = Object.entries(prayerTimes).sort((a, b) => {
        return timeToMinutes(a[1]) - timeToMinutes(b[1]);
      });
      
      // Create slots between prayers
      for (let i = 0; i < prayerEntries.length - 1; i++) {
        const currentPrayer = prayerEntries[i];
        const nextPrayer = prayerEntries[i + 1];
        
        const currentPrayerTime = currentPrayer[1];
        const nextPrayerTime = nextPrayer[1];
        
        // Slot starts at the end of the current prayer
        const slotStart = this.addPadding(currentPrayerTime, paddingAfter);
        // Slot ends at the exact time of the next prayer
        const slotEnd = this.subtractPadding(nextPrayerTime, paddingBefore);
        
        // Calculate slot duration (without UI margins for accuracy)
        const startMinutes = timeToMinutes(slotStart);
        const endMinutes = timeToMinutes(slotEnd);
        const durationMinutes = endMinutes - startMinutes;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const durationText = hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${minutes}min`;
        
        const slotTitle = `Disponibilité (${durationText})`;
        
        // Add 3 minutes of margin at the beginning and end to improve UI (without affecting displayed duration)
        const adjustedSlotStart = this.addPadding(slotStart, 3);
        const adjustedSlotEnd = this.subtractPadding(slotEnd, 3);
        
        if (adjustedSlotStart && adjustedSlotEnd && timeToMinutes(adjustedSlotEnd) > timeToMinutes(adjustedSlotStart)) {
          // For synchronization, use exact times (without padding)
          this.createSVGEvent(slotTitle, adjustedSlotStart, adjustedSlotEnd, 'slot', 'slot', slotStart + '-' + slotEnd);
        }
      }
    } else if (slots && slots.length > 0) {
      // Fallback: use original slots if no prayer times available
      slots.forEach((slot, index) => {
        const startTime = slot.start_time || slot.start || slot.startTime;
        const endTime = slot.end_time || slot.end || slot.endTime;
        const title = slot.title || slot.summary || `Slot ${index + 1}`;
        
        // Calculate slot duration
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        const durationMinutes = endMinutes - startMinutes;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const durationText = hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${minutes}min`;
        
        const slotTitle = `Disponibilité (${durationText})`;
        
        // Add 3 minutes of margin at the beginning and end to improve UI
        const adjustedStartTime = this.addPadding(startTime, 3);
        const adjustedEndTime = this.subtractPadding(endTime, 3);
        
        if (adjustedStartTime && adjustedEndTime && timeToMinutes(adjustedEndTime) > timeToMinutes(adjustedStartTime)) {
          // For synchronization, use exact times (without padding)
          this.createSVGEvent(slotTitle, adjustedStartTime, adjustedEndTime, 'slot', 'slot', startTime + '-' + endTime);
        }
      });
    }
  }
  
  // Helper: Subtract padding from a time
  subtractPadding(timeStr, paddingMinutes) {
    if (!timeStr || !paddingMinutes) return timeStr;
    const totalMinutes = timeToMinutes(timeStr);
    const adjustedMinutes = totalMinutes - paddingMinutes;
    return minutesToTime(adjustedMinutes);
  }
  
  // Helper: Add padding to a time
  addPadding(timeStr, paddingMinutes) {
    if (!timeStr || !paddingMinutes) return timeStr;
    const totalMinutes = timeToMinutes(timeStr);
    const adjustedMinutes = totalMinutes + paddingMinutes;
    return minutesToTime(adjustedMinutes);
  }
  // Create an SVG event
  createSVGEvent(title, startTime, endTime, type, className, syncTime = null) {
    if (!this.svg || !this.eventsGroup) return;
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const y = startMin;
    const height = Math.max(endMin - startMin, 18);
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', 60 + 6);
    rect.setAttribute('y', y);
    rect.setAttribute('width', 400 - 60 - 12);
    rect.setAttribute('height', height);
    rect.setAttribute('rx', 5);
    rect.setAttribute('ry', 5);
    rect.setAttribute('class', `timeline-event ${className}`);
    
    // Add data-attributes for synchronization with clock-arc
    // For prayers, use syncTime (exact time), otherwise startTime
    // For slots, syncTime contains "start-end"
    let syncStartTime, syncEndTime;
    if (syncTime && syncTime.includes('-')) {
      // It's a slot: syncTime = "start-end"
      [syncStartTime, syncEndTime] = syncTime.split('-');
    } else {
      // It's a prayer: syncTime = exact time
      syncStartTime = syncTime || startTime;
      syncEndTime = syncTime || endTime;
    }
    rect.setAttribute('data-start', syncStartTime);
    rect.setAttribute('data-end', syncEndTime);
    rect.setAttribute('data-type', type);
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', 60 + 16);
    text.setAttribute('y', y + height / 2 + 6);
    text.textContent = title;
    text.setAttribute('class', 'timeline-event-text');
    
    // Add hover events for synchronization
    rect.addEventListener('mouseover', () => {
      // Activate the corresponding clock-arc
      const clockArc = document.querySelector(`.clock-arc[data-start="${syncStartTime}"][data-end="${syncEndTime}"]`);
      if (clockArc) {
        clockArc.classList.add('active');
      }
      
      // Add active class to the timeline-event itself
      rect.classList.add('active');
    });
    
    rect.addEventListener('mouseout', () => {
      // Deactivate the corresponding clock-arc
      const clockArc = document.querySelector(`.clock-arc[data-start="${syncStartTime}"][data-end="${syncEndTime}"]`);
      if (clockArc) {
        clockArc.classList.remove('active');
      }
      
      // Remove active class from the timeline-event itself
      rect.classList.remove('active');
    });
    
    this.eventsGroup.appendChild(rect);
    this.eventsGroup.appendChild(text);
  }
  // Calculate the end of a prayer (35min by default)
  calculatePrayerEndTime(startTime) {
    const startMin = timeToMinutes(startTime);
    const endMin = startMin + 35;
    return minutesToTime(endMin);
  }
  // Tooltip (show)
  showTooltip(event, title, startTime, endTime) {
    if (this.tooltip) {
      this.tooltip.textContent = `${title} - ${startTime} to ${endTime}`;
      this.tooltip.style.left = (event.clientX + 10) + 'px';
      this.tooltip.style.top = (event.clientY - 30) + 'px';
      this.tooltip.classList.add('show');
    }
  }
  // Tooltip (hide)
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.remove('show');
    }
  }
  // Remove all SVG events
  clearEvents() {
    if (this.eventsGroup) {
      while (this.eventsGroup.firstChild) this.eventsGroup.removeChild(this.eventsGroup.firstChild);
    }
  }
  // Show an empty state
  showEmptyState() {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '50%');
    text.setAttribute('y', '50%');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', 'var(--text-muted)');
    text.setAttribute('font-size', '16px');
    text.textContent = 'No events for this day';
    this.svg.appendChild(text);
  }
  // Day navigation
  navigateToDay(date) {
    this.displayDayEvents(date);
  }
  // Method called by central sync
  setDate(date) {
    if (!date) return;
    
    
    this.currentDate = new Date(date);
    this.updateTimelineDate();
    this.displayDayEvents(this.currentDate);
  }
  // Navigation and toggle buttons
  setupViewToggle() {
    const toggleBtn = document.getElementById('toggleViewBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggleView();
      });
    }
    const prevBtn = document.getElementById('prevDayBtn');
    const nextBtn = document.getElementById('nextDayBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const d = new Date(this.currentDate);
        d.setDate(d.getDate() - 1);
        window.setSelectedDate(d);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const d = new Date(this.currentDate);
        d.setDate(d.getDate() + 1);
        window.setSelectedDate(d);
      });
    }
  }
  // Show timeline view
  showTimelineView() {
    const timelineContent = document.querySelector('.timeline-content');
    const slotsList = document.getElementById('availableSlotsList');
    if (timelineContent && slotsList) {
      timelineContent.style.display = 'flex';
      slotsList.style.display = 'none';
      this.currentView = 'timeline';
    }
  }
  // Show classic slots view
  showSlotsView() {
    const timelineContent = document.querySelector('.timeline-content');
    const slotsList = document.getElementById('availableSlotsList');
    if (timelineContent && slotsList) {
      timelineContent.style.display = 'none';
      slotsList.style.display = 'block';
      this.currentView = 'slots';
    }
  }
  // Current view
  getCurrentView() {
    return this.currentView;
  }
  // Check if the timeline is initialized
  isInitialized() {
    return this.container !== null && this.svg !== null;
  }
}
// (End of Timeline class)


// =========================
// 3. CALENDAR (calendar grid)
// =========================
// Main class for the calendar (day grid)
class CalendarViewsManager {
  constructor() {
    this.currentMonth = new Date().getMonth();
    this.currentYear = new Date().getFullYear();
    this.selectedMonth = this.currentMonth;
    this.selectedYear = this.currentYear;
    this.selectedDay = new Date().getDate();
    this.segments = [];
    this.scope = '';
    this.clockInstance = null;
    this.init();
  }
  // Calendar initialization
  init() {
    this.bindEvents();
  }
  // Bind month navigation events
  bindEvents() {
    document.addEventListener('click', (e) => {
      if (e.target.id === 'prevMonthBtn') {
        this.navigateMonth(-1);
      } else if (e.target.id === 'nextMonthBtn') {
        this.navigateMonth(1);
      }
    });
  }
  // To synchronize with the clock
  setClockInstance(clockInstance) {
    this.clockInstance = clockInstance;
  }
  // Initialize views according to the scope
  initializeViews(segments, scope) {
    this.segments = segments;
    this.scope = scope;
    this.showClockCalendar();
    this.renderClockCalendar();
  }
  // Show the calendar
  showClockCalendar() {
    const calendar = document.getElementById('clockCalendar');
    const slotsView = document.getElementById('defaultSlotsView');
    if (calendar) calendar.style.display = 'block';
    if (slotsView) slotsView.style.display = 'block';
  }
  // Render the calendar grid
  renderClockCalendar() {
    const container = document.getElementById('clockCalendarDays');
    const titleElement = document.getElementById('currentMonthTitle');
    if (!container || !titleElement) return;
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    titleElement.textContent = `${monthNames[this.selectedMonth]} ${this.selectedYear}`;
    container.innerHTML = '';
    const firstDay = new Date(this.selectedYear, this.selectedMonth, 1);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = (dayOfWeek + 6) % 7;
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dayElement = this.createDayElement(currentDate);
      container.appendChild(dayElement);
    }
  }
  // Create a day of the calendar
  createDayElement(date) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    dayElement.appendChild(dayNumber);
    if (date.getMonth() !== this.selectedMonth) {
      dayElement.classList.add('other-month');
    }
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      dayElement.classList.add('today');
    }
    if (date.getDate() === this.selectedDay && date.getMonth() === this.selectedMonth) {
      dayElement.classList.add('selected');
    }
    if (this.segments.length > 0) {
      const dayIndex = date.getDate() - 1;
      if (dayIndex >= 0 && dayIndex < this.segments.length) {
        const dayData = this.segments[dayIndex];
        if (dayData && dayData.slots && dayData.slots.length > 0) {
          dayElement.addEventListener('click', () => {
            this.selectDay(date.getDate(), dayData);
          });
        }
      }
    }
    dayElement.addEventListener('click', () => {
      if (date.getMonth() === this.selectedMonth) {
        this.selectDay(date.getDate());
      }
    });
    return dayElement;
  }
  // Select a day
  selectDay(day, dayData = null) {
    const previousSelected = document.querySelector('.calendar-day.selected');
    if (previousSelected) previousSelected.classList.remove('selected');
    const dayElements = document.querySelectorAll('.calendar-day:not(.other-month)');
    const dayIndex = day - 1;
    if (dayElements[dayIndex]) dayElements[dayIndex].classList.add('selected');
    this.selectedDay = day;
    if (this.clockInstance && this.segments.length > 0) {
      if (dayIndex >= 0 && dayIndex < this.segments.length) {
        this.clockInstance.currentIndex = dayIndex;
        this.clockInstance.updateClock();
      }
    }
    if (window.timeline && this.segments.length > 0) {
      const selectedDate = new Date(this.selectedYear, this.selectedMonth, day);
      window.timeline.navigateToDay(selectedDate);
    }
    if (dayData) {
      this.updateSlotsList(dayData);
    }
    if (window.setSelectedDate) {
      const selectedDate = new Date(this.selectedYear, this.selectedMonth, day);
      window.setSelectedDate(selectedDate);
    }
  }
  // Update the list of slots for the selected day
  updateSlotsList(dayData) {
    const slotsList = document.getElementById('availableSlotsList');
    if (!slotsList || !dayData.slots) return;
    slotsList.innerHTML = '';
    dayData.slots.forEach(slot => {
      const slotItem = document.createElement('div');
      slotItem.className = 'slot-item';
      const slotTime = document.createElement('span');
      slotTime.className = 'slot-time';
      slotTime.textContent = `${slot.start} - ${slot.end}`;
      const slotDuration = document.createElement('span');
      slotDuration.className = 'slot-duration';
      slotDuration.textContent = `(${this.calculateDuration(slot.start, slot.end)})`;
      slotItem.appendChild(slotTime);
      slotItem.appendChild(slotDuration);
      slotsList.appendChild(slotItem);
      slotItem.addEventListener('mouseover', () => {
        const arc = document.querySelector(`.clock-arc[data-start="${slot.start}"][data-end="${slot.end}"]`);
        if (arc) arc.classList.add('active');
      });
      slotItem.addEventListener('mouseout', () => {
        const arc = document.querySelector(`.clock-arc[data-start="${slot.start}"][data-end="${slot.end}"]`);
        if (arc) arc.classList.remove('active');
      });
    });
  }
  // Previous/next month navigation
  navigateMonth(direction) {
    this.selectedMonth += direction;
    if (this.selectedMonth < 0) {
      this.selectedMonth = 11;
      this.selectedYear--;
    } else if (this.selectedMonth > 11) {
      this.selectedMonth = 0;
      this.selectedYear++;
    }
    if (window.setSelectedDate) {
      const firstDay = new Date(this.selectedYear, this.selectedMonth, 1);
      window.setSelectedDate(firstDay);
    }
  }
  // Calculate the duration between two times
  calculateDuration(start, end) {
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);
    let duration = endMinutes - startMinutes;
    if (duration < 0) duration += 24 * 60;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (hours === 0) return `${minutes}min`;
    else if (minutes === 0) return `${hours}h`;
    else return `${hours}h${minutes.toString().padStart(2, '0')}min`;
  }
  // Convert a time string to minutes
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
  // Select a day in the clock calendar
  selectClockCalendarDay(day, segments) {
    const dayIndex = day - 1;
    
    // Update calendar selection
    this.updateCalendarSelection(dayIndex);

    // Create the selected date for synchronization
    const currentMonth = window.currentMonth || new Date().getMonth();
    const currentYear = window.currentYear || new Date().getFullYear();
    const selectedDate = new Date(currentYear, currentMonth, day);
    
    // Call central synchronization to update all components
    if (window.setSelectedDate) {
      window.setSelectedDate(selectedDate);
    }

    // Update clock if available (local update as backup)
    if (window.Clock && window.clockInstance) {
      // For year scope, extract current month's data
      let monthSegments = [];
      if (segments && segments.length > 0) {
        const currentMonth = window.currentMonth || new Date().getMonth();
        if (segments[currentMonth] && segments[currentMonth].days) {
          monthSegments = segments[currentMonth].days;
        } else {
          // If segments is already daily data (month scope)
          monthSegments = segments;
        }
      }
      
      if (dayIndex >= 0 && dayIndex < monthSegments.length) {
        window.clockInstance.currentIndex = dayIndex;
        window.clockInstance.updateClock();
      }
    }
  }
  // Method called by central sync
  setDate(date) {
    if (!date) return;
    this.selectedDay = date.getDate();
    this.selectedMonth = date.getMonth();
    this.selectedYear = date.getFullYear();
    this.renderClockCalendar();
  }
}
// (End of CalendarViewsManager class)


// =========================
// 4. CLOCK (circular clock)
// =========================
// Main class for the circular clock (slots and prayers)
class Clock {
  constructor(containerId, segments, scope) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Container not found:', containerId);
      return;
    }
    this.segments = segments;
    this.scope = scope;
    this.currentIndex = 0;
    this.currentDayIndex = 0;
    this.slotsContainer = document.getElementById('availableSlotsList');
    this.init();
  }
  // Animation of planning appearance
  static handlePlanningGeneration() {
    const planningContent = document.querySelector('.quick-actions');
    if (planningContent) planningContent.classList.add('planning-generated');
    const clockSection = document.querySelector('.clock-section');
    if (clockSection) {
      clockSection.classList.add('visible');
      setTimeout(() => {
        try { clockSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (error) { clockSection.scrollIntoView(); }
      }, 500);
    }
    const sections = document.querySelectorAll('.available-slots, .summary-section');
    sections.forEach((section, index) => {
      setTimeout(() => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'all 0.6s ease';
        setTimeout(() => {
          section.style.opacity = '1';
          section.style.transform = 'translateY(0)';
        }, 100);
      }, (index + 1) * 300);
    });
  }
  // Conversion minutes -> angle
  minutesToAngle(minutes) {
    return (minutes * 360) / (24 * 60);
  }
  // Calculate the duration between two times
  calculateDuration(start, end) {
    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);
    let duration = endMinutes - startMinutes;
    if (duration < 0) duration += 24 * 60;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (hours === 0) return `(${minutes}min)`;
    else if (minutes === 0) return `(${hours}h)`;
    else return `(${hours}h${minutes.toString().padStart(2, '0')}min)`;
  }
  
  // Helper: Subtract padding from a time
  subtractPadding(timeStr, paddingMinutes) {
    if (!timeStr || !paddingMinutes) return timeStr;
    const totalMinutes = timeToMinutes(timeStr);
    const adjustedMinutes = totalMinutes - paddingMinutes;
    return minutesToTime(adjustedMinutes);
  }
  
  // Helper: Add padding to a time
  addPadding(timeStr, paddingMinutes) {
    if (!timeStr || !paddingMinutes) return timeStr;
    const totalMinutes = timeToMinutes(timeStr);
    const adjustedMinutes = totalMinutes + paddingMinutes;
    return minutesToTime(adjustedMinutes);
  }
  // Create an SVG arc for an event (prayer or slot)
  createEventElement(event, type) {
    const startMinutes = timeToMinutes(event.start);
    const endMinutes = timeToMinutes(event.end);
    const startAngle = this.minutesToAngle(startMinutes);
    const endAngle = this.minutesToAngle(endMinutes);
    const radius = type === 'prayer' ? 135 : 120; // Uniformize the radius of the slots
    
    const centerX = 150;
    const centerY = 150;
    const startX = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const startY = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const endX = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const endY = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let angleDiff = endMinutes - startMinutes;
    if (angleDiff < 0) angleDiff += 24 * 60;
    const largeArcFlag = angleDiff > 12 * 60 ? 1 : 0;
    const d = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    
    path.setAttribute("d", d);
    path.setAttribute("class", `clock-arc ${type}`);
    
    // Add data-attributes for synchronization with timeline-event
    path.setAttribute('data-start', event.start);
    path.setAttribute('data-end', event.end);
    path.setAttribute('data-type', type);
    
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = type === 'prayer' ? radius + 25 : radius - 25;
    const labelX = centerX + labelRadius * Math.cos((midAngle - 90) * Math.PI / 180);
    const labelY = centerY + labelRadius * Math.sin((midAngle - 90) * Math.PI / 180);
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", "150");
    label.setAttribute("y", "150");
    label.setAttribute("class", "clock-label");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "middle");
    if (type === 'prayer') label.textContent = `${event.content} (${event.start})`;
    else label.textContent = `${event.start} - ${event.end}`;
    
    // Add hover events for synchronization with timeline
    path.addEventListener("mouseover", () => {
      // Activate the corresponding timeline-event
      const timelineEvent = document.querySelector(`.timeline-event[data-start="${event.start}"][data-end="${event.end}"]`);
      if (timelineEvent) {
        timelineEvent.classList.add('active');
      }
      
      // Add active class to the clock-arc itself
      path.classList.add('active');
    });
    
    path.addEventListener("mouseout", () => {
      // Deactivate the corresponding timeline-event
      const timelineEvent = document.querySelector(`.timeline-event[data-start="${event.start}"][data-end="${event.end}"]`);
      if (timelineEvent) {
        timelineEvent.classList.remove('active');
      }
      
      // Remove active class from the clock-arc itself
      path.classList.remove('active');
    });
    
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.appendChild(path);
    group.appendChild(label);
    // Tooltip for prayers
    if (type === 'prayer') {
      const tooltipGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      tooltipGroup.setAttribute("class", "tooltip-group");
      tooltipGroup.style.display = "none";
      const tooltipRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      tooltipRect.setAttribute("class", "tooltip-rect");
      tooltipRect.setAttribute("rx", "5");
      tooltipRect.setAttribute("ry", "5");
      const tooltipText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tooltipText.setAttribute("class", "tooltip-text");
      tooltipText.textContent = `${event.content}\nTime: ${event.start}`;
      tooltipGroup.appendChild(tooltipRect);
      tooltipGroup.appendChild(tooltipText);
      const tooltipX = labelX;
      const tooltipY = labelY - 40;
      tooltipGroup.setAttribute("transform", `translate(${tooltipX}, ${tooltipY})`);
      path.addEventListener("mouseover", () => { tooltipGroup.style.display = "block"; });
      path.addEventListener("mouseout", () => { tooltipGroup.style.display = "none"; });
      group.appendChild(tooltipGroup);
    }
    return group;
  }
  // Create an SVG arc for a slot
  createSlotElement(slot) {
    const startMinutes = timeToMinutes(slot.start);
    const endMinutes = timeToMinutes(slot.end);
    
    // Parameter to manually adjust the size of the slots
    const slotSizeAdjustment = -25; // Reduce the end of the slot by 25 minutes
    
    // Adjust the end of the slot
    const adjustedEndMinutes = endMinutes + slotSizeAdjustment;
    const adjustedEndTime = minutesToTime(adjustedEndMinutes);
    
    const startAngle = this.minutesToAngle(startMinutes);
    const endAngle = this.minutesToAngle(adjustedEndMinutes);
    
    const radius = 120; // Même rayon que dans createEventElement pour les créneaux
    const centerX = 150;
    const centerY = 150;
    const startX = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const startY = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const endX = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const endY = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let angleDiff = adjustedEndMinutes - startMinutes;
    if (angleDiff < 0) angleDiff += 24 * 60;
    const largeArcFlag = angleDiff > 12 * 60 ? 1 : 0;
    const d = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    
    path.setAttribute("d", d);
    path.setAttribute("class", "clock-arc slot");
    path.dataset.start = slot.start;
    path.dataset.end = slot.end;
    path.setAttribute('data-type', 'slot');
    
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = radius - 25;
    const labelX = centerX + labelRadius * Math.cos((midAngle - 90) * Math.PI / 180);
    const labelY = centerY + labelRadius * Math.sin((midAngle - 90) * Math.PI / 180);
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", "150");
    label.setAttribute("y", "150");
    label.setAttribute("class", "clock-label");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "middle");
    label.textContent = this.calculateDuration(slot.start, slot.end);
    
    // Add hover events for synchronization with timeline
    path.addEventListener("mouseover", () => {
      // Activate the corresponding timeline-event
      const timelineEvent = document.querySelector(`.timeline-event[data-start="${slot.start}"][data-end="${slot.end}"]`);
      if (timelineEvent) {
        timelineEvent.classList.add('active');
      }
      
      // Add active class to the clock-arc itself
      path.classList.add('active');
      
      // Keep the old behavior for the list
      const listItem = document.querySelector(`.slot-item[data-start="${slot.start}"][data-end="${slot.end}"]`);
      if (listItem) listItem.classList.add("active");
    });
    
    path.addEventListener("mouseout", () => {
      // Deactivate the corresponding timeline-event
      const timelineEvent = document.querySelector(`.timeline-event[data-start="${slot.start}"][data-end="${slot.end}"]`);
      if (timelineEvent) {
        timelineEvent.classList.remove('active');
      }
      
      // Remove active class from the clock-arc itself
      path.classList.remove('active');
      
      // Keep the old behavior for the list
      const listItem = document.querySelector(`.slot-item[data-start="${slot.start}"][data-end="${slot.end}"]`);
      if (listItem) listItem.classList.remove("active");
    });
    
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.appendChild(path);
    group.appendChild(label);
    return group;
  }
  // Update the list of available slots
  updateAvailableSlots(data) {
    if (!this.slotsContainer) return;
    this.slotsContainer.innerHTML = '';
    
    if (!data || !data.prayer_times) {
      this.slotsContainer.innerHTML = '<p>No slots available for this period.</p>';
      return;
    }
    
    // Calculate slots based on prayers (same logic as timeline and clock)
    const paddingBefore = window.currentPaddingBefore || 0;
    const paddingAfter = window.currentPaddingAfter || 0;
    
    const prayerEntries = Object.entries(data.prayer_times).sort((a, b) => {
      return timeToMinutes(a[1]) - timeToMinutes(b[1]);
    });
    
    const calculatedSlots = [];
    
    // Create slots between prayers
    for (let i = 0; i < prayerEntries.length - 1; i++) {
      const currentPrayer = prayerEntries[i];
      const nextPrayer = prayerEntries[i + 1];
      
      const currentPrayerTime = currentPrayer[1];
      const nextPrayerTime = nextPrayer[1];
      
      // Slot starts at the end of the current prayer
      const slotStart = this.addPadding(currentPrayerTime, paddingAfter);
      // Slot ends at the exact time of the next prayer
      const slotEnd = this.subtractPadding(nextPrayerTime, paddingBefore);
      
      if (slotStart && slotEnd && timeToMinutes(slotEnd) > timeToMinutes(slotStart)) {
        calculatedSlots.push({
          start: slotStart,
          end: slotEnd
        });
      }
    }
    
    if (calculatedSlots.length === 0) {
      this.slotsContainer.innerHTML = '<p>No slots available for this period.</p>';
      return;
    }
    const slotsList = document.createElement('ul');
    slotsList.className = 'slots-list';
    calculatedSlots.forEach(slot => {
      const slotItem = document.createElement('li');
      slotItem.className = 'slot-item';
      slotItem.dataset.start = slot.start;
      slotItem.dataset.end = slot.end;
      const slotTime = document.createElement('span');
      slotTime.className = 'slot-time';
      slotTime.textContent = `${slot.start} - ${slot.end}`;
      const slotDuration = document.createElement('span');
      slotDuration.className = 'slot-duration';
      slotDuration.textContent = this.calculateDuration(slot.start, slot.end);
      slotItem.appendChild(slotTime);
      slotItem.appendChild(slotDuration);
      slotsList.appendChild(slotItem);
      slotItem.addEventListener('mouseover', () => {
        const arc = document.querySelector(`.clock-arc[data-start="${slot.start}"][data-end="${slot.end}"]`);
        if (arc) arc.classList.add('active');
      });
      slotItem.addEventListener('mouseout', () => {
        const arc = document.querySelector(`.clock-arc[data-start="${slot.start}"][data-end="${slot.end}"]`);
        if (arc) arc.classList.remove('active');
      });
    });
    this.slotsContainer.appendChild(slotsList);
  }
  // Update the clock display
  updateClock() {
    this.container.innerHTML = '';
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "-80 -80 460 460");
    svg.setAttribute("class", "clock-svg");
    this.container.appendChild(svg);
    const clockFace = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    clockFace.setAttribute("cx", "150");
    clockFace.setAttribute("cy", "150");
    clockFace.setAttribute("r", "180");
    clockFace.setAttribute("class", "clock-face");
    svg.appendChild(clockFace);
    for (let hour = 0; hour < 24; hour++) {
      const angle = this.minutesToAngle(hour * 60);
      const x1 = 150 + 170 * Math.cos((angle - 90) * Math.PI / 180);
      const y1 = 150 + 170 * Math.sin((angle - 90) * Math.PI / 180);
      const x2 = 150 + 180 * Math.cos((angle - 90) * Math.PI / 180);
      const y2 = 150 + 180 * Math.sin((angle - 90) * Math.PI / 180);
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "line");
      marker.setAttribute("x1", x1);
      marker.setAttribute("y1", y1);
      marker.setAttribute("x2", x2);
      marker.setAttribute("y2", y2);
      marker.setAttribute("class", "hour-marker");
      svg.appendChild(marker);
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      const labelX = 150 + 155 * Math.cos((angle - 90) * Math.PI / 180);
      const labelY = 150 + 155 * Math.sin((angle - 90) * Math.PI / 180);
      label.setAttribute("x", labelX);
      label.setAttribute("y", labelY);
      label.setAttribute("class", "hour-label");
      label.textContent = hour;
      svg.appendChild(label);
    }
    for (let minute = 0; minute < 60; minute++) {
      if (minute % 5 === 0) continue;
      const angle = this.minutesToAngle(minute);
      const x1 = 150 + 175 * Math.cos((angle - 90) * Math.PI / 180);
      const y1 = 150 + 175 * Math.sin((angle - 90) * Math.PI / 180);
      const x2 = 150 + 180 * Math.cos((angle - 90) * Math.PI / 180);
      const y2 = 150 + 180 * Math.sin((angle - 90) * Math.PI / 180);
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "line");
      marker.setAttribute("x1", x1);
      marker.setAttribute("y1", y1);
      marker.setAttribute("x2", x2);
      marker.setAttribute("y2", y2);
      marker.setAttribute("class", "minute-marker");
      svg.appendChild(marker);
    }
    const currentData = this.getCurrentData();
    if (currentData && currentData.prayer_times) {
      Object.entries(currentData.prayer_times).forEach(([prayer, time]) => {
        const eventElement = this.createEventElement({
          content: prayer,
          start: time,
          end: time
        }, 'prayer');
        svg.appendChild(eventElement);
      });
    }
    
    // Calculate slots based on prayers (same logic as timeline)
    if (currentData && currentData.prayer_times) {
      const paddingBefore = window.currentPaddingBefore || 0;
      const paddingAfter = window.currentPaddingAfter || 0;
      
      const prayerEntries = Object.entries(currentData.prayer_times).sort((a, b) => {
        return timeToMinutes(a[1]) - timeToMinutes(b[1]);
      });
      
      // Create slots between prayers
      for (let i = 0; i < prayerEntries.length - 1; i++) {
        const currentPrayer = prayerEntries[i];
        const nextPrayer = prayerEntries[i + 1];
        
        const currentPrayerTime = currentPrayer[1];
        const nextPrayerTime = nextPrayer[1];
        
        // Slot starts at the end of the current prayer
        const slotStart = this.addPadding(currentPrayerTime, paddingAfter);
        // Slot ends at the exact time of the next prayer
        const slotEnd = this.subtractPadding(nextPrayerTime, paddingBefore);
        
        if (slotStart && slotEnd && timeToMinutes(slotEnd) > timeToMinutes(slotStart)) {
          const slot = {
            start: slotStart,
            end: slotEnd
          };
          const slotElement = this.createSlotElement(slot);
          svg.appendChild(slotElement);
        }
      }
    }
    const dateElement = document.getElementById('currentDate');
    if (dateElement && currentData && currentData.date) {
      const [day, month, year] = currentData.date.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      dateElement.textContent = formatDateForDisplay(date);
    }
    const timezoneElement = document.getElementById('timezone');
    if (timezoneElement) {
      timezoneElement.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    this.updateAvailableSlots(currentData);
  }
  // Get the current day's data
  getCurrentData() {
    if (this.scope === 'today') return this.segments[0];
    else if (this.scope === 'month') return this.segments[this.currentIndex];
    else if (this.scope === 'year') return this.segments[this.currentIndex];
    return null;
  }
  // Clock initialization
  init() {
    this.updateClock();
  }
  // Day/month navigation
  navigate(direction) {
    if (this.scope === 'month' || this.scope === 'year') {
      let idx = this.currentIndex + direction;
      if (idx < 0) idx = 0;
      if (idx >= this.segments.length) idx = this.segments.length - 1;
      const seg = this.segments[idx];
      if (seg && seg.date) {
        const [day, month, year] = seg.date.split('/');
        const selectedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        window.setSelectedDate(selectedDate);
      }
    }
  }
  // Method called by central sync
  setDate(date) {
    if (!date || !this.segments || this.segments.length === 0) return;
    let idx = 0;
    if (this.scope === 'month' || this.scope === 'year') {
      for (let i = 0; i < this.segments.length; i++) {
        const seg = this.segments[i];
        if (seg.date) {
          const [day, month, year] = seg.date.split('/');
          const segDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (segDate.toDateString() === date.toDateString()) {
            idx = i;
            break;
          }
        }
      }
    }
    this.currentIndex = idx;
    this.updateClock();
  }
}
// (End of Clock class)


// =========================
// 5. COMPACT MAP (mosque map)
// =========================
// Module for the initialization of the compact map (Leaflet)
let currentMap = null;
function initializeCompactMap(containerId, lat, lng, mosqueName) {
  if (!lat || !lng) {
    return;
  }
  // Destroy the existing map if needed
  if (currentMap) {
    currentMap.remove();
    currentMap = null;
  }
  // Create a new map
  currentMap = L.map(containerId).setView([lat, lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(currentMap);
  L.marker([lat, lng])
    .addTo(currentMap)
    .bindPopup(mosqueName)
    .openPopup();
}
window.initializeCompactMap = initializeCompactMap;


// =========================
// 6. MOSQUE SEARCH (dropdowns)
// =========================
// Initialization of TomSelect dropdowns for mosque and country search
function initMosqueSearchDropdowns() {
  const countrySelectEl = document.getElementById("country-select");
  const mosqueSelectEl = document.getElementById("mosque-select");
  if (!countrySelectEl || !mosqueSelectEl) return;
  // Dropdown mosquée
  const mosqueSelect = new TomSelect(mosqueSelectEl, {
    placeholder: "Choisir une mosquée...",
    valueField: "value",
    labelField: "text",
    searchField: ["name", "slug", "city", "address", "zipcode"],
    options: [],
    shouldLoad: () => false,
    render: {
      no_results: () => '<div class="no-results">Aucune mosquée trouvée</div>'
    },
    onChange: (value) => {
      if (!value) return;
      const selectedOption = mosqueSelect.options[value];
      if (selectedOption) {
        document.getElementById('mosque_lat').value = selectedOption.lat || '';
        document.getElementById('mosque_lng').value = selectedOption.lng || '';
        document.getElementById('mosque_name').value = selectedOption.name || '';
        document.getElementById('mosque_address').value = selectedOption.address || '';
      }
    }
  });
  // Dropdown pays
  const countrySelect = new TomSelect(countrySelectEl, {
    placeholder: "Choisir un pays...",
    onChange: (value) => {
      if (!value) return;
      mosqueSelect.clear(true);
      mosqueSelect.clearOptions();
      mosqueSelect.disable();
      fetch(`/get_mosques?country=${value}`)
        .then(res => res.json())
        .then(mosques => {
          mosqueSelect.enable();
          mosqueSelect.addOptions(
            mosques.map(m => ({
              value: m.slug || m.id || m.name,
              text: m.text || m.name,
              name: m.name,
              slug: m.slug,
              city: m.city,
              address: m.address,
              zipcode: m.zipcode,
              lat: m.lat,
              lng: m.lng
            }))
          );
        });
    }
  });
  // Initial loading of countries
  fetch("/get_countries")
    .then(res => res.json())
    .then(countries => {
      countrySelect.addOptions(
        countries.map(c => ({ value: c.code, text: c.name }))
      );
    });
  // Expose globally
  window.countrySelectInstance = countrySelect;
  window.mosqueSelectInstance = mosqueSelect;
}


// =========================
// 7. MAP LOADER (OpenStreetMap)
// =========================
// Initialization of the main mosque map with clusters and interactions
function initMosqueMapLoader() {
  const mosqueSelectEl = document.getElementById("mosque-select");
  const countrySelectEl = document.getElementById("country-select");
  if (!mosqueSelectEl || !countrySelectEl) return;
  // OSM map
  const map = L.map("mosque-map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);
  // Clusters
  const markerCluster = L.markerClusterGroup();
  map.addLayer(markerCluster);
  // Markers by slug
  const markers = {};
  // Select a mosque after loading
  function selectMosqueAfterLoad(mosqueSelect, mosqueSlug) {
    let attempts = 0;
    const maxAttempts = 20;
    const wait = setInterval(() => {
      const options = Object.keys(mosqueSelect.options || {});
      if (options.includes(mosqueSlug)) {
        mosqueSelect.setValue(mosqueSlug, true);
        clearInterval(wait);
        const marker = markers[mosqueSlug];
        if (marker) {
          map.setView(marker.getLatLng(), 250);
          marker.openPopup();
        }
      } else if (++attempts > maxAttempts) {
        console.warn(`⚠️ Impossible de sélectionner la mosquée : ${mosqueSlug}`);
        clearInterval(wait);
      }
    }, 300);
  }
  // Load all mosques and create markers
  async function loadAllMosques() {
    const countries = await (await fetch("/get_countries")).json();
    for (const country of countries) {
      const mosques = await (await fetch(`/get_mosques?country=${country.code}`)).json();
      mosques.forEach((mosque) => {
        if (!mosque.lat || !mosque.lng) return;
        const popupContent = `
          <div class="popup-content" style="min-width:220px;max-width:320px;padding:1em 1.2em;background:var(--form-bg,#1a1a1a);color:var(--text-color,#e2e8f0);border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.25);">
            <div style="display:flex;align-items:center;gap:0.5em;margin-bottom:0.5em;">
              <i class="fa-solid fa-mosque" style="font-size:1.3em;color:var(--primary,#d4af37);"></i>
              <strong style="font-size:1.1em;">${mosque.name}</strong>
            </div>
            <div style="color:var(--text-muted,#a0aec0);font-size:0.95em;margin-bottom:0.3em;">
              ${mosque.city ? `<span><i class='fa-solid fa-location-dot'></i> ${mosque.city}</span><br>` : ''}
              ${mosque.address ? `<span><i class='fa-solid fa-map-pin'></i> ${mosque.address}</span><br>` : ''}
            </div>
            ${mosque.image1 ? `<img id="popup-img-${mosque.slug}" src="${mosque.image1}" alt="mosquée" class="popup-image" style="width:100%;max-height:120px;object-fit:cover;border-radius:6px;margin:0.5em 0;" />` : ''}
            <hr style="border:0;border-top:1px solid var(--border-color,#333);margin:0.5em 0;">
            <button class="btn-sync-mosque" data-country="${country.code}" data-slug="${mosque.slug}" style="display:block;width:100%;margin-top:0.7em;padding:0.5em 0;background:var(--primary,#d4af37);color:#222;border:none;border-radius:6px;font-weight:600;cursor:pointer;transition:background 0.2s;font-size:1em;">
              <i class="fa-solid fa-check"></i> Sélectionner cette mosquée
            </button>
          </div>
        `;
        const marker = L.marker([mosque.lat, mosque.lng]).bindPopup(popupContent);
        markerCluster.addLayer(marker);
        markers[mosque.slug] = marker;
      });
    }
  }
  // Event delegation for selection from the map
  map.on("popupopen", (e) => {
    const btn = e.popup.getElement().querySelector(".btn-sync-mosque");
    if (!btn) return;
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const countryCode = btn.dataset.country;
      const mosqueSlug = btn.dataset.slug;
      const countrySelect = countrySelectEl.tomselect;
      const mosqueSelect = mosqueSelectEl.tomselect;
      countrySelect.setValue(countryCode, true);
      fetch(`/get_mosques?country=${countryCode}`)
        .then((res) => res.json())
        .then((mosques) => {
          mosqueSelect.clearOptions();
          mosqueSelect.enable();
          mosqueSelect.addOptions(
            mosques.map((m) => ({
              value: m.slug || m.id || m.name,
              text: m.text || m.name,
              name: m.name,
              slug: m.slug,
              city: m.city,
              address: m.address,
              zipcode: m.zipcode,
            }))
          );
          selectMosqueAfterLoad(mosqueSelect, mosqueSlug);
        });
    });
    // Correction of the popup position after image loading
    const img = e.popup.getElement().querySelector('img[id^="popup-img-"]');
    if (img) {
      if (!img.complete) {
        img.addEventListener('load', () => {
          e.popup.update();
        });
      } else {
        setTimeout(() => e.popup.update(), 50);
      }
    }
  });
  // Update the map view when manually selecting
  mosqueSelectEl.addEventListener("change", () => {
    const mosqueSlug = mosqueSelectEl.value;
    const marker = markers[mosqueSlug];
    if (marker) {
      map.setView(marker.getLatLng(), 250);
      marker.openPopup();
    }
  });
  // Auto-focus on the selected country
  countrySelectEl.addEventListener("change", () => {
    const code = countrySelectEl.value;
    fetch(`/get_mosques?country=${code}`)
      .then((res) => res.json())
      .then((mosques) => {
        const first = mosques.find((m) => m.lat && m.lng);
        if (first) map.setView([first.lat, first.lng], 6);
      });
  });
  // Initial loading of all mosques
  loadAllMosques();
}


// =========================
// 8. PLANNERPAGE (form, config, download, etc.)
// =========================
/**
 * Planner page functionality
 * Handles form submission, animations, and clock initialization
 */

class PlannerPage {
  constructor() {
    this.init();
  }

  /**
   * Initialize planner page functionality
   */
  init() {
    this.setupFormHandling();
    this.setupPlanningAnimation();
  }

  /**
   * Setup form submission handling with AJAX
   */
  setupFormHandling() {
    const plannerForm = document.getElementById('plannerForm');
    const configForm = document.getElementById('configForm');
    const submitBtn = document.querySelector('.btn-submit');
    
    if (configForm && submitBtn) {
      configForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission
        
        // Show loading state
        this.showLoadingState(submitBtn);
        
        try {
          // Get form data from both forms
          const plannerFormData = new FormData(plannerForm);
          const configFormData = new FormData(configForm);
          
          // Combine the form data
          const combinedFormData = new FormData();
          
          // Add planner form data
          for (let [key, value] of plannerFormData.entries()) {
            combinedFormData.append(key, value);
          }
          
          // Add config form data
          for (let [key, value] of configFormData.entries()) {
            combinedFormData.append(key, value);
          }
          
          // Explicit inclusion of the include_sunset checkbox (to avoid any omission)
          const includeSunsetCheckbox = document.getElementById('include_sunset');
          if (includeSunsetCheckbox) {
            combinedFormData.set('include_sunset', includeSunsetCheckbox.checked ? 'on' : '');
          }
          
          // Send AJAX request
          const response = await fetch('/api/generate_planning', {
            method: 'POST',
            body: combinedFormData
          });
          
          const result = await response.json();
          
          if (result.success) {
            // Update the page with new data
            this.updatePageWithPlanningData(result.data);
            this.showSuccessMessage('Planning généré avec succès !');
          } else {
            throw new Error(result.error || 'Erreur lors de la génération');
          }
          
        } catch (error) {
          console.error('Error generating planning:', error);
          this.showErrorMessage(error.message);
        } finally {
          // Hide loading state
          this.hideLoadingState(submitBtn);
        }
      });
    }
  }

  /**
   * Show loading state
   */
  showLoadingState(submitBtn) {
    submitBtn.classList.add('loading');
    submitBtn.textContent = '🔄 Génération en cours...';
    submitBtn.disabled = true;
  }

  /**
   * Hide loading state
   */
  hideLoadingState(submitBtn) {
    submitBtn.classList.remove('loading');
    submitBtn.textContent = '📥 Générer planning';
    submitBtn.disabled = false;
  }

  /**
   * Show success message
   */
  showSuccessMessage(message) {
    this.showMessage(message, 'success');
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    this.showMessage(message, 'error');
  }

  /**
   * Show message
   */
  showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      background: ${type === 'success' ? '#48bb78' : '#f56565'};
      animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      messageDiv.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(messageDiv);
      }, 300);
    }, 3000);
  }

  /**
   * Update page with planning data
   */
  updatePageWithPlanningData(data) {
    // Store mosque and configuration data globally for navigation
    window.currentMosqueId = data.masjid_id;
    window.currentPaddingBefore = data.padding_before;
    window.currentPaddingAfter = data.padding_after;
    window.currentMonth = new Date().getMonth();
    window.currentYear = new Date().getFullYear();
    
    // Show the planning sections first
    this.showPlanningSections();
    
    // Update mosque information
    this.updateMosqueInfo(data);
    
    // Update configuration summary
    this.updateConfigSummary(data);
    
    // Generate download links
    this.generateDownloadLinks(data);
    
    // Initialize calendar views if segments are available
    if (data.segments && data.segments.length > 0) {
      setTimeout(() => {
        // Initialize calendar views
        if (window.calendarViewsManager) {
          window.calendarViewsManager.initializeViews(data.segments, data.scope);
        }
        
        // Initialize timeline
        if (window.timeline) {
          window.timeline.initializeTimeline(data.segments, data.scope);
          
          // Set initial date for timeline
          const today = new Date();
          window.timeline.setDate(today);
        }
        
        // Initialize clock
        this.initializeClock(data);
      }, 100);
    }

    // Initialize timeline with selected month/year in clockCalendar
    let year, month;
    if (window.clockCalendar && window.clockCalendar.selectedYear && window.clockCalendar.selectedMonth) {
        year = window.clockCalendar.selectedYear;
        month = window.clockCalendar.selectedMonth;
    } else {
        // By default, current month/year
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth() + 1; // JS: 0=janvier
    }
  }

  /**
   * Show summary display section
   */
  showSummaryDisplay() {
    const summaryDisplay = document.querySelector('.summary-display');
    if (summaryDisplay) {
      summaryDisplay.classList.remove('hidden');
      summaryDisplay.classList.add('fade-in-up');
      setTimeout(() => summaryDisplay.classList.add('visible'), 100);
    }
  }

  /**
   * Update mosque information
   */
  updateMosqueInfo(data) {
    const mosqueNameEl = document.querySelector('.summary-display .mosque-details h4');
    const mosqueAddressEl = document.querySelector('.summary-display .mosque-details .address');
    const mapLinksEl = document.querySelector('.summary-display .map-links');
    const mapContainer = document.getElementById('mosque-location-map');
    
    if (mosqueNameEl) mosqueNameEl.textContent = data.mosque_name;
    if (mosqueAddressEl) mosqueAddressEl.textContent = data.mosque_address;
    
    // Update the data attributes of the map container
    if (mapContainer && data.mosque_lat && data.mosque_lng) {
      mapContainer.dataset.lat = data.mosque_lat;
      mapContainer.dataset.lng = data.mosque_lng;
      mapContainer.dataset.name = data.mosque_name;
      
      // Initialize compact map if the function exists
      if (window.initializeCompactMap) {
        window.initializeCompactMap(
          'mosque-location-map',
          parseFloat(data.mosque_lat),
          parseFloat(data.mosque_lng),
          data.mosque_name
        );
      }
    }
    
    // Update the map links
    if (mapLinksEl) {
      mapLinksEl.innerHTML = '';
      if (data.google_maps_url) {
        const a = document.createElement('a');
        a.href = data.google_maps_url;
        a.target = '_blank';
        a.className = 'map-link';
        a.innerHTML = '🗺️ Google Maps';
        mapLinksEl.appendChild(a);
      }
      if (data.osm_url) {
        const a = document.createElement('a');
        a.href = data.osm_url;
        a.target = '_blank';
        a.className = 'map-link';
        a.innerHTML = '🗺️ OpenStreetMap';
        mapLinksEl.appendChild(a);
      }
      if (data.mawaqit_url) {
        const a = document.createElement('a');
        a.href = data.mawaqit_url;
        a.target = '_blank';
        a.className = 'map-link';
        a.innerHTML = '🌐 Mawaqit.net';
        mapLinksEl.appendChild(a);
      }
    }
  }

  /**
   * Update configuration summary
   */
  updateConfigSummary(data) {
    const configItems = document.querySelectorAll('.summary-display .config-item');
    configItems.forEach(item => {
      const label = item.querySelector('.config-label');
      const value = item.querySelector('.config-value');
      if (label && value) {
        const labelText = label.textContent;
        if (labelText.includes('Période')) {
          value.textContent = `${data.start_date} → ${data.end_date}`;
        } else if (labelText.includes('Délai avant')) {
          value.textContent = `${data.padding_before} min`;
        } else if (labelText.includes('Délai après')) {
          value.textContent = `${data.padding_after} min`;
        } else if (labelText.includes('Fuseau horaire')) {
          value.textContent = data.timezone_str;
        } else if (labelText.includes('Portée')) {
          value.textContent = data.scope_display;
        }
      }
    });
  }

  /**
   * Generate download links for ICS files
   */
  generateDownloadLinks(data) {
    const downloadGrid = document.querySelector('.download-grid');
    if (downloadGrid) {
      downloadGrid.innerHTML = '';
      // Add download links if available
      if (data.ics_path) {
        const a = document.createElement('a');
        a.href = `/static/ics/${data.ics_path}`;
        a.download = '';
        a.className = 'download-card primary';
        a.innerHTML = `<span class="download-icon">📅</span><span class="download-title">Horaires de prière (${data.scope})</span><span class="download-format">.ics</span>`;
        downloadGrid.appendChild(a);
      }
      if (data.available_slots_path) {
        const a = document.createElement('a');
        a.href = `/static/ics/${data.available_slots_path}`;
        a.download = '';
        a.className = 'download-card secondary';
        a.innerHTML = `<span class="download-icon">🕒</span><span class="download-title">Créneaux synchronisés (${data.scope})</span><span class="download-format">.ics</span>`;
        downloadGrid.appendChild(a);
      }
      if (data.empty_slots_path) {
        const a = document.createElement('a');
        a.href = `/static/ics/${data.empty_slots_path}`;
        a.download = '';
        a.className = 'download-card secondary';
        a.innerHTML = `<span class="download-icon">📋</span><span class="download-title">Créneaux disponibles (${data.scope})</span><span class="download-format">.ics</span>`;
        downloadGrid.appendChild(a);
      }
      // Manual edit link
      const editA = document.createElement('a');
      editA.href = '/edit_slot';
      editA.className = 'download-card edit';
      editA.innerHTML = `<span class="download-icon">✏️</span><span class="download-title">Modifier manuellement</span><span class="download-format">Créneaux</span>`;
      downloadGrid.appendChild(editA);
      // Add period download buttons
      const scopeDownloads = document.createElement('div');
      scopeDownloads.className = 'scope-downloads';
      scopeDownloads.innerHTML = `<h3>📥 Téléchargements par période</h3><div class="scope-buttons"></div>`;
      const scopeButtons = scopeDownloads.querySelector('.scope-buttons');
      
      // Add year button first (original scope)
      const yearBtn = document.createElement('button');
      yearBtn.className = 'scope-download-btn year active';
      yearBtn.dataset.scope = 'year';
      yearBtn.innerHTML = `<span class="scope-icon">📅</span><span class="scope-title">Cette année</span>`;
      scopeButtons.appendChild(yearBtn);
      
      // Add other scope buttons
      ['today', 'month'].forEach(scope => {
        const btn = document.createElement('button');
        btn.className = `scope-download-btn ${scope}`;
        btn.dataset.scope = scope;
        btn.innerHTML = `<span class="scope-icon">📅</span><span class="scope-title">${scope === 'today' ? "Aujourd'hui" : 'Ce mois'}</span>`;
        scopeButtons.appendChild(btn);
      });
      downloadGrid.appendChild(scopeDownloads);
      // Activate the buttons
      this.setupScopeDownloadButtons(data);
    }
  }

  /**
   * Setup scope download buttons
   */
  setupScopeDownloadButtons(data) {
    const scopeButtons = document.querySelectorAll('.scope-download-btn');
    
    // Store original year data for later use
    if (!window.originalYearData) {
      window.originalYearData = data;
    }
    
    scopeButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const scope = button.dataset.scope;
        
        // If clicking on year button, restore original data
        if (scope === 'year' && window.originalYearData) {
          this.generateDownloadLinks(window.originalYearData);
          this.updateActiveScopeButton('year');
          this.showSuccessMessage(`Fichiers ICS pour ${scope} générés !`);
          return; // Exit early to avoid the rest of the function
        }
        
        const mosqueId = data.masjid_id;
        const paddingBefore = data.padding_before || 10;
        const paddingAfter = data.padding_after || 35;
        // Get checkbox include_sunset
        const includeSunsetCheckbox = document.getElementById('include_sunset');
        const includeSunset = includeSunsetCheckbox ? includeSunsetCheckbox.checked : false;
        
        // Show loading state
        button.classList.add('loading');
        button.disabled = true;
        
        try {
          // Slot generation for the selected scope
          const response = await fetch('/api/generate_planning', {
            method: 'POST',
            body: (() => {
              const formData = new FormData();
              formData.append('masjid_id', mosqueId);
              formData.append('scope', scope);
              formData.append('padding_before', paddingBefore);
              formData.append('padding_after', paddingAfter);
              formData.append('include_sunset', includeSunset ? 'on' : '');
              return formData;
            })()
          });
          const result = await response.json();
          if (result.success) {
            // Update download-cards with new links
            this.generateDownloadLinks(result.data);
            this.updateActiveScopeButton(scope);
            this.showSuccessMessage(`Fichiers ICS pour ${scope} générés !`);
          } else {
            throw new Error(result.error || 'Erreur lors de la génération');
          }
        } catch (error) {
          console.error('Error generating ICS:', error);
          this.showErrorMessage(error.message);
        } finally {
          button.classList.remove('loading');
          button.disabled = false;
        }
      });
    });
  }

  /**
   * Update active scope button
   */
  updateActiveScopeButton(activeScope) {
    const scopeButtons = document.querySelectorAll('.scope-download-btn');
    scopeButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.scope === activeScope) {
        btn.classList.add('active');
      }
    });
  }

  /**
   * Initialize clock with new data
   */
  initializeClock(data) {
    
    // Check if clock container exists
    const clockContainer = document.getElementById('clockContent');
    if (!clockContainer) {
      console.error('❌ Clock container #clockContent not found in DOM');
      return;
    }
    
    // Check if we have segments data
    if (!data.segments || data.segments.length === 0) {
      console.warn('⚠️ No segments data available for clock initialization');
      return;
    }
    
    // Create clock config element
    const clockConfig = document.createElement('div');
    clockConfig.id = 'clockConfig';
    clockConfig.dataset.segments = JSON.stringify(data.segments);
    clockConfig.dataset.scope = data.scope;
    clockConfig.style.display = 'none';
    document.body.appendChild(clockConfig);
    
    // Initialize clock using the correct method
    if (window.Clock) {
      
      // For year scope, extract current month's data for clock display
      let clockSegments = data.segments;
      if (data.scope === 'year' && data.segments && data.segments.length > 0) {
        const currentMonth = new Date().getMonth();
        if (data.segments[currentMonth] && data.segments[currentMonth].days) {
          clockSegments = data.segments[currentMonth].days;
        } else {
          console.warn('⚠️ No days data found for month', currentMonth);
        }
      }
      
      // Create a new Clock instance with the appropriate segments
      try {
        const clock = new Clock('clockContent', clockSegments, data.scope);
        
        // Store clock instance globally for access from other functions
        window.clockInstance = clock;
        
        // Set the clock to show today's view by default
        if (clockSegments && clockSegments.length > 0) {
          // Get current day of month (1-based)
          const currentDay = new Date().getDate();
          // Convert to 0-based index, but ensure it's within bounds
          const todayIndex = Math.min(currentDay - 1, clockSegments.length - 1);
          
          clock.currentIndex = todayIndex;
          clock.updateClock();
          
          // Update calendar selection to match today
          this.updateCalendarSelection(todayIndex);
        } else {
          console.warn('⚠️ No clock segments available for display');
        }
        
        // Pass clock instance to calendar views manager for synchronization
        if (window.calendarViewsManager) {
          window.calendarViewsManager.setClockInstance(clock);
        }
        
        // Initialize the clock calendar for month navigation
        this.initializeClockCalendar(data.segments, data.scope);
        
        // Setup navigation
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) {
          prevBtn.addEventListener('click', () => {
            clock.navigate(-1);
            this.updateCalendarSelection(clock.currentIndex);
          });
        }
        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            clock.navigate(1);
            this.updateCalendarSelection(clock.currentIndex);
          });
        }
        
        // Trigger planning generation animation after a short delay
        setTimeout(() => {
          Clock.handlePlanningGeneration();
        }, 200);
        
      } catch (error) {
        console.error('❌ Error creating clock instance:', error);
      }
    } else {
      console.error('❌ Clock class not found in window.Clock');
    }
  }

  /**
   * Initialize clock calendar for month navigation
   */
  initializeClockCalendar(segments, scope) {
    if (scope !== 'year') return;
    
    const container = document.getElementById('clockCalendarDays');
    const titleElement = document.getElementById('currentMonthTitle');
    
    if (!container || !titleElement) return;

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Initialize global variables
    window.currentMonth = currentMonth;
    window.currentYear = currentYear;
    
    // Update title
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    titleElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // Clear container
    container.innerHTML = '';

    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const dayOfWeek = firstDay.getDay(); // 0 = dimanche, 1 = lundi, ...
    const daysToSubtract = (dayOfWeek + 6) % 7;
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - daysToSubtract);

    // Generate calendar days
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayElement = this.createClockCalendarDay(currentDate, segments, currentMonth, currentYear);
      container.appendChild(dayElement);
    }
    
    // Setup month navigation
    this.setupClockCalendarNavigation(segments, currentMonth, currentYear);
  }

  /**
   * Create a day element for the clock calendar
   */
  createClockCalendarDay(date, segments, currentMonth, currentYear) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    
    dayElement.appendChild(dayNumber);

    // Check if it's current month
    if (date.getMonth() !== currentMonth) {
      dayElement.classList.add('other-month');
    }

    // Check if it's today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      dayElement.classList.add('today');
    }

    // Check if it's selected day (default to today)
    if (date.getDate() === today.getDate() && date.getMonth() === currentMonth && date.getFullYear() === today.getFullYear()) {
      dayElement.classList.add('selected');
    }

    // Check if day has slots data
    if (segments && segments.length > 0) {
      // For year scope, segments contain monthly data
      // Extract the current month's data
      let monthSegments = [];
      if (segments[currentMonth] && segments[currentMonth].days) {
        monthSegments = segments[currentMonth].days;
      } else {
        // If segments is already daily data (month scope)
        monthSegments = segments;
      }
    }

    // Add click event to select day and update clock
    dayElement.addEventListener('click', () => {
      if (date.getMonth() === currentMonth) {
        this.selectClockCalendarDay(date.getDate(), segments);
      }
    });

    return dayElement;
  }

  /**
   * Select a day in the clock calendar and update clock
   */
  selectClockCalendarDay(day, segments) {
    const dayIndex = day - 1;
    
    // Update calendar selection
    this.updateCalendarSelection(dayIndex);

    // Create the selected date for synchronization
    const currentMonth = window.currentMonth || new Date().getMonth();
    const currentYear = window.currentYear || new Date().getFullYear();
    const selectedDate = new Date(currentYear, currentMonth, day);
    
    // Call central synchronization to update all components
    if (window.setSelectedDate) {
      window.setSelectedDate(selectedDate);
    }

    // Update clock if available (local update as backup)
    if (window.Clock && window.clockInstance) {
      // For year scope, extract current month's data
      let monthSegments = [];
      if (segments && segments.length > 0) {
        const currentMonth = window.currentMonth || new Date().getMonth();
        if (segments[currentMonth] && segments[currentMonth].days) {
          monthSegments = segments[currentMonth].days;
        } else {
          // If segments is already daily data (month scope)
          monthSegments = segments;
        }
      }
      
      if (dayIndex >= 0 && dayIndex < monthSegments.length) {
        window.clockInstance.currentIndex = dayIndex;
        window.clockInstance.updateClock();
      }
    }
  }

  /**
   * Setup navigation for clock calendar
   */
  setupClockCalendarNavigation(segments, currentMonth, currentYear) {
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    
    // Store initial values globally
    window.currentMonth = currentMonth;
    window.currentYear = currentYear;
    
    if (prevMonthBtn) {
      prevMonthBtn.addEventListener('click', () => {
        // Use global values instead of local parameters
        this.navigateClockCalendarMonth(-1, segments, window.currentMonth, window.currentYear);
      });
    }
    
    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', () => {
        // Use global values instead of local parameters
        this.navigateClockCalendarMonth(1, segments, window.currentMonth, window.currentYear);
      });
    }
  }

  /**
   * Navigate to previous/next month in clock calendar
   */
  async navigateClockCalendarMonth(direction, segments, currentMonth, currentYear) {
    // Calculate new month and year
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    
    // Handle year boundary
    if (newMonth < 0) {
      newMonth = 11;
      newYear = currentYear - 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear = currentYear + 1;
    }
    
    // Since we have year data, we can navigate locally without API calls
    // Find the month data in the year segments
    let monthSegments = [];
    if (segments && segments.length > 0) {
      // For year scope, segments contain monthly data
      // Each segment represents a month with a 'days' array
      const monthIndex = newMonth; // 0-based month index
      if (segments[monthIndex] && segments[monthIndex].days) {
        monthSegments = segments[monthIndex].days;
      }
    }
    
    // Update the calendar display with new month data
    this.updateClockCalendarDisplay(newMonth, newYear, monthSegments);
    
    // Update the clock with new month data
    if (window.clockInstance && monthSegments.length > 0) {
      window.clockInstance.segments = monthSegments;
      window.clockInstance.currentIndex = 0; // Reset to first day of month
      window.clockInstance.updateClock();
      
      // Update calendar selection to match the clock
      this.updateCalendarSelection(0);
    }
    
    // Store current month/year for future navigation
    window.currentMonth = newMonth;
    window.currentYear = newYear;
    
    this.showSuccessMessage(`Navigation vers ${this.getMonthName(newMonth)} ${newYear}`);
  }

  /**
   * Get mosque ID from the page
   */
  getMosqueIdFromPage() {
    // Try to get from form
    const mosqueSelect = document.getElementById('mosque-select');
    if (mosqueSelect && mosqueSelect.value) {
      return mosqueSelect.value;
    }
    
    // Try to get from hidden field
    const mosqueIdField = document.querySelector('input[name="masjid_id"]');
    if (mosqueIdField && mosqueIdField.value) {
      return mosqueIdField.value;
    }
    
    // Try to get from data attributes
    const clockConfig = document.getElementById('clockConfig');
    if (clockConfig && clockConfig.dataset.mosqueId) {
      return clockConfig.dataset.mosqueId;
    }
    
    return null;
  }

  /**
   * Get month name in French
   */
  getMonthName(monthIndex) {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return monthNames[monthIndex];
  }

  /**
   * Update clock calendar display
   */
  updateClockCalendarDisplay(month, year, segments) {
    const titleElement = document.getElementById('currentMonthTitle');
    const container = document.getElementById('clockCalendarDays');
    
    if (!titleElement || !container) return;

    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    titleElement.textContent = `${monthNames[month]} ${year}`;

    // Clear and regenerate calendar days
    container.innerHTML = '';
    
const firstDay = new Date(year, month, 1);
const dayOfWeek = firstDay.getDay();
const daysToSubtract = (dayOfWeek + 6) % 7;
const startDate = new Date(firstDay);
startDate.setDate(firstDay.getDate() - daysToSubtract);

    // For year scope, segments contain monthly data
    let monthSegments = [];
    if (segments && segments.length > 0) {
      // If segments is an array of months (year scope)
      // Each segment represents a month with a 'days' array
      if (segments[month] && segments[month].days) {
        monthSegments = segments[month].days;
      } else {
        // If segments is already daily data (month scope)
        monthSegments = segments;
      }
    }

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayElement = this.createClockCalendarDay(currentDate, monthSegments, month, year);
      container.appendChild(dayElement);
    }
  }

  /**
   * Show planning sections
   */
  showPlanningSections() {
    // Show existing sections without creating them dynamically
    const selectors = [
      '.quick-actions',
      '.clock-section',
      '.available-slots',
      '.summary-display'
    ];
    selectors.forEach(selector => {
      const section = document.querySelector(selector);
      if (section) {
        section.classList.remove('hidden');
        section.classList.add('fade-in-up');
        setTimeout(() => section.classList.add('visible'), 100);
      }
    });
    // Hide the no-data section if it exists
    const noDataSection = document.querySelector('.no-data');
    if (noDataSection) {
      noDataSection.classList.add('hidden');
    }
  }

  /**
   * Setup planning generation animations
   */
  setupPlanningAnimation() {
    // Check if planning was just generated
    const hasPlanningData = document.querySelector('.quick-actions') !== null;
    const hasClockConfig = document.getElementById('clockConfig') !== null;
    
    if (hasPlanningData && hasClockConfig) {
      // Add a small delay to ensure DOM is fully loaded
      setTimeout(() => {
        Clock.handlePlanningGeneration();
      }, 100);
    } else {
      console.log('No planning data found, skipping animation');
    }
  }

  /**
   * Initialize clock with data from server
   */
  static initClock() {
    const clockConfig = document.getElementById('clockConfig');
    if (!clockConfig) return;

    try {
      const clockData = JSON.parse(clockConfig.dataset.segments);
      const clockScope = clockConfig.dataset.scope;

      // Initialize clock
      const clock = new Clock('clockContent', clockData, clockScope);

      // Setup navigation
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');
      
      if (prevBtn) {
        prevBtn.addEventListener('click', () => clock.navigate(-1));
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', () => clock.navigate(1));
      }
    } catch (error) {
      console.error('Error initializing clock:', error);
    }
  }

  /**
   * Update calendar selection based on clock index
   */
  updateCalendarSelection(index) {
    // Remove previous selection
    const previousSelected = document.querySelector('#clockCalendar .calendar-day.selected');
    if (previousSelected) {
      previousSelected.classList.remove('selected');
    }

    // Calculate the actual day number (index + 1)
    const dayNumber = index + 1;
    
    // Find the calendar day element that corresponds to this day number
    const dayElements = document.querySelectorAll('#clockCalendar .calendar-day');
    
    for (let i = 0; i < dayElements.length; i++) {
      const dayElement = dayElements[i];
      const dayText = dayElement.querySelector('.day-number');
      
      if (dayText && parseInt(dayText.textContent) === dayNumber && !dayElement.classList.contains('other-month')) {
        dayElement.classList.add('selected');
        break;
      }
    }
  }
}

// =========================
// 9. INITIALISATION & SYNCHRONISATION CENTRALE
// =========================
// Central initialization of all merged JS modules

document.addEventListener('DOMContentLoaded', () => {
  // 1. Dropdowns TomSelect (pays & mosquée)
  initMosqueSearchDropdowns();

  // 2. Main map (OpenStreetMap with clusters)
  initMosqueMapLoader();

  // 3. Vertical timeline (SVG agenda)
  window.timeline = new Timeline();

  // 4. Calendar (calendar grid)
  window.calendarViewsManager = new CalendarViewsManager();

  // 5. Circular clock (clock) - Expose Clock class globally
  window.Clock = Clock;
  // The instance will be created dynamically by PlannerPage according to the received data
  // window.clockInstance = new Clock(...)

  // 6. Compact map (Leaflet) : initialized on demand via window.initializeCompactMap

  // 7. PlannerPage (formulaires, config, etc.)
  new PlannerPage();

  // 8. Clock initialization if segments are already present (ex: after planning generation)
  if (document.getElementById('clockConfig')) {
    PlannerPage.initClock();
  }
});

// Central synchronization of planner views
window.selectedDate = new Date();
window.setSelectedDate = function(date) {
  if (!date) return;
  
  // Prevent infinite loops
  if (window.selectedDate && window.selectedDate.toDateString && window.selectedDate.toDateString() === date.toDateString()) {
    console.log('⚠️ Same date, skipping sync to prevent loops');
    return;
  }
  
  window.selectedDate = new Date(date);
  
  // Timeline
  if (window.timeline && typeof window.timeline.setDate === 'function') {
    window.timeline.setDate(window.selectedDate);
  } else {
    console.warn('⚠️ Timeline not available for sync');
  }
  
  // Clock
  if (window.clockInstance && typeof window.clockInstance.setDate === 'function') {
    window.clockInstance.setDate(window.selectedDate);
  } else {
    console.warn('⚠️ Clock not available for sync');
  }
  
  // Calendar
  if (window.calendarViewsManager && typeof window.calendarViewsManager.setDate === 'function') {
    window.calendarViewsManager.setDate(window.selectedDate);
  } else {
    console.warn('⚠️ Calendar not available for sync');
  }
};
