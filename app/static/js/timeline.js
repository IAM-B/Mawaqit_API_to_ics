/**
 * Vertical Timeline (agenda) to visualize prayer slots, slots and empty slots
 * Inspired by Google/Apple Calendar with a vertical time grid
 * 
 * This class handles:
 * - Display of an SVG timeline with time grid
 * - Toggle between timeline view and traditional slots view
 * - Display of events (prayers, slots, empty slots)
 * - User interactions (tooltips, clicks)
 */

console.log('timeline.js loaded');
console.log('Timeline instantiated');

// Constant for graduation: 60px per hour
const HOUR_HEIGHT = 60;
const TIMELINE_HEIGHT = 24 * HOUR_HEIGHT; // 1440px for 24 hours
const HOUR_LABEL_WIDTH = 50;
const EVENT_MARGIN = 4;

/**
 * Utility function to format date consistently
 * @param {Date} date - The date to format
 * @returns {string} - The formatted date (ex: "Mon 15 Jan")
 */
function formatDateForDisplay(date) {
  const options = { 
    weekday: 'short', 
    day: 'numeric',
    month: 'short'
  };
  return date.toLocaleDateString('fr-FR', options);
}

class Timeline {
  constructor() {
    this.container = null;
    this.svg = null;
    this.currentDate = new Date();
    this.segments = [];
    this.scope = 'today';
    this.icsDays = [];
    this.tooltip = null;
    this.currentView = 'timeline'; // 'timeline' or 'slots'
    this.init();
  }

  /**
   * Initialize the timeline
   */
  init() {
    this.createTimelineContainer();
    this.createTooltip();
    this.setupViewToggle();
    
    // Check that initialization went well
    if (this.container && this.svg) {
      console.log('✅ Timeline initialized successfully');
      this.showTimelineView();
    } else {
      console.warn('⚠️ Timeline not initialized, using slots view by default');
      this.showSlotsView();
    }
  }

  /**
   * Create the timeline container
   */
  createTimelineContainer() {
    // Use the existing HTML structure in the template
    this.container = document.getElementById('defaultSlotsView');
    this.svg = document.querySelector('.timeline-svg');
    
    if (this.container && this.svg) {
      console.log('✅ Timeline structure found in template');
      
      // Create the SVG time grid
      this.createSVGGrid(this.svg);
    } else {
      console.error('❌ Timeline structure not found in template');
    }
  }

  createSVGGrid(svg) {
    console.log('🔧 Creating SVG grid');
    console.log(`📏 Dimensions: HOUR_HEIGHT=${HOUR_HEIGHT}px, TIMELINE_HEIGHT=${TIMELINE_HEIGHT}px`);
    
    // Create the grid group
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('class', 'timeline-grid');
    
    // Create horizontal lines for each hour
    for (let hour = 0; hour <= 24; hour++) {
      const y = hour * HOUR_HEIGHT;
      
      // Horizontal line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', HOUR_LABEL_WIDTH);
      line.setAttribute('y1', y);
      line.setAttribute('x2', '100%');
      line.setAttribute('y2', y);
      line.setAttribute('class', 'timeline-hour-line');
      
      // Hour text (only for hours 0-23)
      if (hour < 24) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', HOUR_LABEL_WIDTH - 10);
        text.setAttribute('y', y + HOUR_HEIGHT / 2);
        text.textContent = `${hour.toString().padStart(2, '0')}:00`;
        text.setAttribute('class', 'timeline-hour-text');
        
        gridGroup.appendChild(text);
      }
      
      gridGroup.appendChild(line);
      
      console.log(`🕐 Hour ${hour.toString().padStart(2, '0')}:00 → y=${y}px`);
    }
    
    // Vertical line to separate labels from events
    const verticalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    verticalLine.setAttribute('x1', HOUR_LABEL_WIDTH);
    verticalLine.setAttribute('y1', 0);
    verticalLine.setAttribute('x2', HOUR_LABEL_WIDTH);
    verticalLine.setAttribute('y2', TIMELINE_HEIGHT);
    verticalLine.setAttribute('class', 'timeline-hour-line');
    
    gridGroup.appendChild(verticalLine);
    svg.appendChild(gridGroup);
    
    console.log('✅ SVG grid created successfully');
  }

  createTooltip() {
    // Check if tooltip already exists
    this.tooltip = document.querySelector('.timeline-tooltip');
    
    if (!this.tooltip) {
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'timeline-tooltip';
      this.tooltip.style.position = 'absolute';
      this.tooltip.style.zIndex = '1000';
      this.tooltip.style.pointerEvents = 'none';
      document.body.appendChild(this.tooltip);
      console.log('✅ Timeline tooltip created');
    } else {
      console.log('✅ Existing timeline tooltip found');
    }
  }

  /**
   * Initialize the timeline with data
   */
  initializeTimeline(segments, scope) {
    this.segments = segments;
    this.scope = scope;
    
    // Update the displayed date
    this.updateTimelineDate();
    
    // Display events for the selected day (default today)
    this.displayDayEvents(new Date());
  }

  /**
   * Update the date displayed in the header
   */
  updateTimelineDate() {
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
      currentDateElement.textContent = formatDateForDisplay(this.currentDate);
    }
  }

  /**
   * Display events for a specific day
   */
  displayDayEvents(date) {
    this.currentDate = date;
    this.updateTimelineDate();
    
    // Clear existing events
    this.clearEvents();
    
    // Find the day's data
    const dayData = this.getDayData(date);
    if (!dayData) {
      this.showEmptyState();
      return;
    }
    
    // Display prayers
    this.displayPrayers(dayData.prayer_times);
    
    // Display slots
    this.displaySlots(dayData.slots);
    
    // Display empty slots
    this.displayEmptySlots(dayData.slots);
  }

  /**
   * Get data for a specific day
   */
  getDayData(date) {
    if (!this.segments || this.segments.length === 0) {
      return null;
    }
    
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    
    // For "today" scope
    if (this.scope === 'today' && this.segments.length > 0) {
      return this.segments[0];
    }
    
    // For "month" scope
    if (this.scope === 'month') {
      const dayIndex = day - 1;
      if (dayIndex >= 0 && dayIndex < this.segments.length) {
        return this.segments[dayIndex];
      }
    }
    
    // For "year" scope
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

  /**
   * Display prayers
   */
  displayPrayers(prayerTimes) {
    if (!prayerTimes) return;
    
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
        const startTime = time;
        const endTime = this.calculatePrayerEndTime(time);
        
        this.createSVGEvent(
          prayerNames[prayer],
          startTime,
          endTime,
          'prayer',
          'prayer'
        );
      }
    });
  }

  /**
   * Display slots
   */
  displaySlots(slots) {
    if (!slots || !Array.isArray(slots)) {
      console.log('⚠️ No slots to display or invalid format');
      return;
    }
    
    console.log('🕐 Processing slots:', slots);
    console.log('📊 First slot structure:', JSON.stringify(slots[0], null, 2));
    
    slots.forEach((slot, index) => {
      console.log(`  [${index + 1}] Slot:`, slot);
      
      // Check available properties
      const startTime = slot.start_time || slot.start || slot.startTime;
      const endTime = slot.end_time || slot.end || slot.endTime;
      const title = slot.title || slot.summary || `Slot ${index + 1}`;
      
      if (startTime && endTime) {
        console.log(`    ✅ Creating event: ${title} (${startTime}-${endTime})`);
        this.createSVGEvent(title, startTime, endTime, 'slot', 'slot');
      } else {
        console.warn(`    ⚠️ Slot ${index + 1} without valid times:`, { startTime, endTime });
      }
    });
  }

  /**
   * Display empty slots
   */
  displayEmptySlots(slots) {
    if (!slots || !Array.isArray(slots)) {
      console.log('⚠️ No empty slots to display or invalid format');
      return;
    }
    
    console.log('🕳️ Processing empty slots:', slots);
    
    slots.forEach((slot, index) => {
      console.log(`  [${index + 1}] Empty slot:`, slot);
      
      // Check if it's an empty slot (different possible properties)
      const isEmpty = slot.is_empty || slot.isEmpty || slot.empty || slot.available === false || slot.status === 'empty';
      
      // If no specific property, we can also check if there are events in this slot
      const hasEvents = slot.events && slot.events.length > 0;
      const isActuallyEmpty = isEmpty || (!hasEvents && slot.available !== true);
      
      if (isActuallyEmpty) {
        // Check available properties
        const startTime = slot.start_time || slot.start || slot.startTime;
        const endTime = slot.end_time || slot.end || slot.endTime;
        const title = slot.title || slot.summary || 'Free slot';
        
        if (startTime && endTime) {
          console.log(`    ✅ Creating empty event: ${title} (${startTime}-${endTime})`);
          this.createSVGEvent(title, startTime, endTime, 'empty', 'empty');
        } else {
          console.warn(`    ⚠️ Empty slot ${index + 1} without valid times:`, { startTime, endTime });
        }
      } else {
        console.log(`    ℹ️ Slot ${index + 1} is not empty (${isEmpty}, hasEvents: ${hasEvents})`);
      }
    });
  }

  /**
   * Create an SVG event with precise calculations
   */
  createSVGEvent(title, startTime, endTime, type, className) {
    console.log(`🔧 Creating SVG event: ${title} (${startTime}-${endTime})`);
    
    // Security checks
    if (!startTime || !endTime) {
      console.error(`❌ Cannot create event "${title}": missing times`, { startTime, endTime });
      return;
    }
    
    if (!this.svg) {
      console.error('❌ SVG not initialized');
      return;
    }
    
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    
    // Check that minutes are valid
    if (startMin === 0 && startTime !== '00:00') {
      console.error(`❌ Invalid start time for "${title}": ${startTime}`);
      return;
    }
    
    if (endMin === 0 && endTime !== '00:00') {
      console.error(`❌ Invalid end time for "${title}": ${endTime}`);
      return;
    }
    
    // Precise position calculations
    const y = (startMin / 60) * HOUR_HEIGHT;
    const height = Math.max((endMin - startMin) / 60 * HOUR_HEIGHT, 20);
    
    console.log(`  📐 Calculations: startMin=${startMin}, endMin=${endMin}`);
    console.log(`  📏 Position: y=${y}px, height=${height}px`);
    
    // Check that position is within limits
    if (y < 0 || y > TIMELINE_HEIGHT) {
      console.warn(`⚠️ Position out of bounds for "${title}": y=${y}px (limit: 0-${TIMELINE_HEIGHT}px)`);
    }
    
    // Create SVG rectangle
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', HOUR_LABEL_WIDTH + EVENT_MARGIN);
    rect.setAttribute('y', y);
    rect.setAttribute('width', 1000 - HOUR_LABEL_WIDTH - (EVENT_MARGIN * 2));
    rect.setAttribute('height', height);
    rect.setAttribute('rx', 4);
    rect.setAttribute('ry', 4);
    rect.setAttribute('class', `timeline-event ${className}`);
    
    // Create SVG text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', HOUR_LABEL_WIDTH + EVENT_MARGIN + 10);
    text.setAttribute('y', y + height / 2);
    text.textContent = title;
    text.setAttribute('class', 'timeline-event-text');
    
    // Add events
    rect.addEventListener('mouseenter', (e) => this.showTooltip(e, title, startTime, endTime));
    rect.addEventListener('mouseleave', () => this.hideTooltip());
    rect.addEventListener('click', () => this.onEventClick(type, title, startTime, endTime));
    
    // Add to SVG
    this.svg.appendChild(rect);
    this.svg.appendChild(text);
    
    console.log(`  ✅ SVG event created and added`);
  }

  /**
   * Calculate prayer end time (35 minutes by default)
   */
  calculatePrayerEndTime(startTime) {
    const startMin = timeToMinutes(startTime);
    const endMin = startMin + 35; // 35 minutes duration
    return minutesToTime(endMin);
  }

  /**
   * Show tooltip
   */
  showTooltip(event, title, startTime, endTime) {
    if (this.tooltip) {
      this.tooltip.textContent = `${title} - ${startTime} to ${endTime}`;
      this.tooltip.style.left = (event.clientX + 10) + 'px';
      this.tooltip.style.top = (event.clientY - 30) + 'px';
      this.tooltip.classList.add('show');
    }
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.remove('show');
    }
  }

  /**
   * Clear all events
   */
  clearEvents() {
    // Remove all SVG elements except the grid
    const elementsToRemove = [];
    for (let i = 0; i < this.svg.children.length; i++) {
      const child = this.svg.children[i];
      if (child.getAttribute('class') !== 'timeline-grid') {
        elementsToRemove.push(child);
      }
    }
    
    elementsToRemove.forEach(element => element.remove());
  }

  /**
   * Show empty state
   */
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

  /**
   * Handle click on an event
   */
  onEventClick(type, title, startTime, endTime) {
    console.log(`🖱️ Click on event: ${type} - ${title} (${startTime}-${endTime})`);
    
    // Here you can add logic to handle clicks
    // For example, open a modal, navigate to a page, etc.
  }

  /**
   * Navigate between days
   */
  navigateToDay(date) {
    this.displayDayEvents(date);
  }

  previousDay() {
    const prevDate = new Date(this.currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    this.navigateToDay(prevDate);
  }

  nextDay() {
    const nextDate = new Date(this.currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    this.navigateToDay(nextDate);
  }

  /**
   * Synchronize with calendar
   */
  syncWithCalendar(day, segments) {
    this.segments = segments;
    this.displayDayEvents(day);
  }

  /**
   * Load and display ICS data
   */
  async loadAndDisplayTimelineICS(masjid_id, year, month) {
    try {
      console.log('🔄 Loading ICS data for timeline');
      
      const response = await fetch(`/api/ics/${masjid_id}/${year}/${month}/json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 ICS data received:', data);
      
      this.icsDays = data.days || [];
      
      if (this.icsDays.length > 0) {
        // Display first day by default
        this.displayICSForDay(0);
      } else {
        console.log('⚠️ No days found in ICS data');
        this.showEmptyState();
      }
      
    } catch (error) {
      console.error('❌ Error loading ICS data:', error);
      this.showEmptyState();
    }
  }

  /**
   * Display an ICS day in the timeline
   */
  displayICSForDay(dayIndex) {
    console.log('=== 🕐 TIMELINE SVG DEBUG START ===');
    console.log('displayICSForDay called for index', dayIndex);
    
    if (!this.icsDays || this.icsDays.length === 0) {
      console.log('❌ No ICS data available');
      return;
    }
    
    const dayData = this.icsDays[dayIndex];
    if (!dayData) {
      console.log('❌ No data for day', dayIndex);
      return;
    }
    
    this.clearEvents();

    console.log('📅 Date displayed:', dayData.date);
    console.log('📊 Data received:', {
      prayers: dayData.prayers?.length || 0,
      slots: dayData.slots?.length || 0,
      empty: dayData.empty?.length || 0
    });

    // Display each prayer
    if (dayData.prayers && dayData.prayers.length > 0) {
      console.log('🕌 Processing prayers:');
      dayData.prayers.forEach((prayer, index) => {
        console.log(`  [${index + 1}] ${prayer.summary}: ${prayer.start} - ${prayer.end}`);
        
        // Extract exact prayer time from summary
        const prayerTimeMatch = prayer.summary.match(/\((\d{2}:\d{2})\)/);
        let displayStart = prayer.start;
        let displayEnd = prayer.end;
        
        if (prayerTimeMatch) {
          const prayerTime = prayerTimeMatch[1];
          console.log(`    🎯 Exact prayer time: ${prayerTime}`);
          
          // Use exact prayer time for positioning
          displayStart = prayerTime;
          // Calculate end based on standard 35 minute duration
          const prayerStartMin = timeToMinutes(prayerTime);
          const prayerEndMin = prayerStartMin + 35; // 35 minutes duration
          displayEnd = minutesToTime(prayerEndMin);
          
          console.log(`    📏 Adjustment: prayer_time=${prayerTime}, duration=35min, end=${displayEnd}`);
        }
        
        this.createSVGEvent(prayer.summary, displayStart, displayEnd, 'prayer', 'prayer');
        console.log(`    🎯 SVG element created and added`);
      });
    } else {
      console.log('⚠️ No prayers to display');
    }

    // Display each slot
    if (dayData.slots && dayData.slots.length > 0) {
      console.log('🕐 Processing slots:');
      dayData.slots.forEach((slot, index) => {
        console.log(`  [${index + 1}] ${slot.summary}: ${slot.start} - ${slot.end}`);
        this.createSVGEvent(slot.summary, slot.start, slot.end, 'slot', 'slot');
      });
    } else {
      console.log('⚠️ No slots to display');
    }

    // Display each empty
    if (dayData.empty && dayData.empty.length > 0) {
      console.log('🕳️ Processing empty slots:');
      dayData.empty.forEach((empty, index) => {
        console.log(`  [${index + 1}] ${empty.summary}: ${empty.start} - ${empty.end}`);
        this.createSVGEvent(empty.summary, empty.start, empty.end, 'empty', 'empty');
      });
    } else {
      console.log('⚠️ No empty slots to display');
    }

    // Update displayed date
    this.currentDate = new Date(dayData.date);
    this.updateTimelineDate();
    
    console.log('=== 🕐 TIMELINE SVG DEBUG END ===');
  }

  /**
   * Show timeline view
   */
  showTimelineView() {
    const timelineContent = document.querySelector('.timeline-content');
    const slotsList = document.getElementById('availableSlotsList');
    
    if (timelineContent && slotsList) {
      timelineContent.style.display = 'flex';
      slotsList.style.display = 'none';
      this.currentView = 'timeline';
      console.log('✅ Timeline view activated');
    }
  }

  /**
   * Show traditional slots view
   */
  showSlotsView() {
    const timelineContent = document.querySelector('.timeline-content');
    const slotsList = document.getElementById('availableSlotsList');
    
    if (timelineContent && slotsList) {
      timelineContent.style.display = 'none';
      slotsList.style.display = 'block';
      this.currentView = 'slots';
      console.log('✅ Traditional slots view activated');
    }
  }

  /**
   * Get current view
   */
  getCurrentView() {
    return this.currentView;
  }

  /**
   * Check if timeline is initialized
   */
  isInitialized() {
    return this.container !== null && this.svg !== null;
  }

  /**
   * Setup view toggle button
   */
  setupViewToggle() {
    const toggleBtn = document.getElementById('toggleViewBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggleView();
      });
      console.log('✅ Toggle button configured');
    }
    
    // Setup navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.previousDay();
      });
      console.log('✅ Previous button configured');
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.nextDay();
      });
      console.log('✅ Next button configured');
    }
  }

  /**
   * Toggle between timeline view and slots view
   */
  toggleView() {
    const toggleBtn = document.getElementById('toggleViewBtn');
    
    if (this.currentView === 'timeline') {
      // Switch to slots view
      this.showSlotsView();
      if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="fa-solid fa-clock"></i>';
        toggleBtn.title = 'Switch to timeline view';
      }
    } else {
      // Switch to timeline view
      this.showTimelineView();
      if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="fa-solid fa-list"></i>';
        toggleBtn.title = 'Switch to list view';
      }
    }
  }
}

// Utility functions
function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    console.warn(`⚠️ timeToMinutes received invalid value:`, timeStr);
    return 0;
  }
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Initialize timeline when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.timeline = new Timeline();
  window.timeline.init();
}); 