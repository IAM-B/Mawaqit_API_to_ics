// Timeline component for vertical agenda display

import { formatDateForDisplay, timeToMinutes, minutesToTime } from '../utils/utils.js';
import { getPaddingBefore, getPaddingAfter, getRealPaddingBefore, getRealPaddingAfter } from '../utils/padding.js';

/**
 * Main class for the vertical timeline (SVG agenda)
 */
export class Timeline {
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
    
    // Get paddings from global variables (with minimum for calculation)
    const paddingBefore = getPaddingBefore();
    const paddingAfter = getPaddingAfter();
    
    // Get real user values for display
    const realPaddingBefore = getRealPaddingBefore();
    const realPaddingAfter = getRealPaddingAfter();
    
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
    
    // Get paddings from global variables (with minimum for calculation)
    const paddingBefore = getPaddingBefore();
    const paddingAfter = getPaddingAfter();
    
    // Get real user values for display
    const realPaddingBefore = getRealPaddingBefore();
    const realPaddingAfter = getRealPaddingAfter();
    
    // Get prayer times for slot calculation
    const dayData = this.getDayData(this.currentDate);
    const prayerTimes = dayData ? dayData.prayer_times : null;
    
    if (prayerTimes) {
      // Define the logical order of prayers (not chronological)
      const prayerOrder = ['fajr', 'sunset', 'dohr', 'asr', 'maghreb', 'icha'];
      
      // Create slots between prayers in logical order
      for (let i = 0; i < prayerOrder.length - 1; i++) {
        const currentPrayerName = prayerOrder[i];
        const nextPrayerName = prayerOrder[i + 1];
        
        const currentPrayerTime = prayerTimes[currentPrayerName];
        const nextPrayerTime = prayerTimes[nextPrayerName];
        
        // Skip if either prayer time is missing
        if (!currentPrayerTime || !nextPrayerTime) {
          continue;
        }
        
        // Special handling for the slot between maghreb and icha when icha is after midnight
        if (currentPrayerName === 'maghreb' && nextPrayerName === 'icha') {
          const ichaMinutes = timeToMinutes(nextPrayerTime);
          
          // Check if icha is after midnight (after 00:00)
          // ichaMinutes will be >= 0 when icha is after midnight (e.g., 01:30 = 90 minutes)
          // ichaMinutes will be >= 0 when icha is before midnight (e.g., 23:30 = 1410 minutes)
          // We need to check if icha is actually after midnight by comparing with maghreb
          const maghrebMinutes = timeToMinutes(currentPrayerTime);
          if (ichaMinutes < maghrebMinutes) {
            // icha is after midnight, create two slots: maghreb to midnight and midnight to icha
            const maghrebToMidnightStart = this.addPadding(currentPrayerTime, paddingAfter);
            const maghrebToMidnightEnd = "23:59";
            
            const midnightToIchaStart = "00:00";
            const midnightToIchaEnd = this.subtractPadding(nextPrayerTime, paddingBefore);
            
            // Calculate total duration for display
            const realMaghrebToMidnightStart = this.addPadding(currentPrayerTime, realPaddingAfter);
            const realMidnightToIchaEnd = this.subtractPadding(nextPrayerTime, realPaddingBefore);
            const realStartMinutes = timeToMinutes(realMaghrebToMidnightStart);
            const realEndMinutes = timeToMinutes(realMidnightToIchaEnd);
            
            // Handle case where icha is the next day
            let totalDurationMinutes;
            if (realEndMinutes <= realStartMinutes) {
              // icha is the next day, so we need to add 24 hours
              totalDurationMinutes = (realEndMinutes + 24 * 60) - realStartMinutes;
            } else {
              totalDurationMinutes = realEndMinutes - realStartMinutes;
            }
            
            const totalHours = Math.floor(totalDurationMinutes / 60);
            const totalMinutes = totalDurationMinutes % 60;
            const totalDurationText = totalHours > 0 ? `${totalHours}h${totalMinutes.toString().padStart(2, '0')}` : `${totalMinutes}min`;
            
            const slotTitle = `Disponibilité (${totalDurationText})`;
            
            // First slot: maghreb to 23:59
            if (maghrebToMidnightStart && maghrebToMidnightEnd && timeToMinutes(maghrebToMidnightEnd) > timeToMinutes(maghrebToMidnightStart)) {
              const adjustedStart = this.addPadding(maghrebToMidnightStart, 1);
              const adjustedEnd = this.subtractPadding(maghrebToMidnightEnd, 1);
              
              if (adjustedStart && adjustedEnd && timeToMinutes(adjustedEnd) > timeToMinutes(adjustedStart)) {
                this.createSVGEvent(slotTitle, adjustedStart, adjustedEnd, 'slot', 'slot', maghrebToMidnightStart + '-' + maghrebToMidnightEnd);
              }
            }
            
            // Second slot: 00:00 to icha
            if (midnightToIchaStart && midnightToIchaEnd && timeToMinutes(midnightToIchaEnd) > timeToMinutes(midnightToIchaStart)) {
              const adjustedStart = this.addPadding(midnightToIchaStart, 1);
              const adjustedEnd = this.subtractPadding(midnightToIchaEnd, 1);
              
              if (adjustedStart && adjustedEnd && timeToMinutes(adjustedEnd) > timeToMinutes(adjustedStart)) {
                this.createSVGEvent(slotTitle, adjustedStart, adjustedEnd, 'slot', 'slot', midnightToIchaStart + '-' + midnightToIchaEnd);
              }
            }
            
            continue; // Skip the normal slot creation for this pair
          }
        }
        
        // Normal slot creation for other prayer pairs
        // Slot starts at the end of the current prayer
        const slotStart = this.addPadding(currentPrayerTime, paddingAfter);
        // Slot ends at the exact time of the next prayer
        const slotEnd = this.subtractPadding(nextPrayerTime, paddingBefore);
        
        // Calculate slot duration using real user values for display
        const realSlotStart = this.addPadding(currentPrayerTime, realPaddingAfter);
        const realSlotEnd = this.subtractPadding(nextPrayerTime, realPaddingBefore);
        const startMinutes = timeToMinutes(realSlotStart);
        const endMinutes = timeToMinutes(realSlotEnd);
        const durationMinutes = endMinutes - startMinutes;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const durationText = hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${minutes}min`;
        
        const slotTitle = `Disponibilité (${durationText})`;
        
        // Add 1 minute of margin at the beginning and end to improve UI (without affecting displayed duration)
        const adjustedSlotStart = this.addPadding(slotStart, 1);
        const adjustedSlotEnd = this.subtractPadding(slotEnd, 1);
        
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
        
        // Add 1 minute of margin at the beginning and end to improve UI
        const adjustedStartTime = this.addPadding(startTime, 1);
        const adjustedEndTime = this.subtractPadding(endTime, 1);
        
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
    const height = Math.max(endMin - startMin, 8);
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