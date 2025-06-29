/**
 * Timeline class tests
 * Tests for the vertical timeline component (SVG agenda)
 */

const {
  formatDateForDisplay,
  timeToMinutes,
  minutesToTime,
  getPaddingBefore,
  getPaddingAfter
} = require('../../app/static/js/planner.js');

// Mock DOM elements for Timeline
const createTimelineDOM = () => {
  document.body.innerHTML = `
    <div class="slots-half">
      <svg class="slots-timeline-svg" width="460" height="1440"></svg>
    </div>
    <div id="slotsCurrentDate"></div>
    <div class="timeline-tooltip"></div>
    <div class="timeline-content" style="display: flex;">
      <div class="timeline-events"></div>
    </div>
    <div id="availableSlotsList" style="display: none;"></div>
    <button id="toggleViewBtn">Toggle View</button>
    <button id="prevDayBtn">Previous</button>
    <button id="nextDayBtn">Next</button>
  `;
};

// Mock Timeline class (simplified version for testing)
class MockTimeline {
  constructor() {
    this.container = null;
    this.svg = null;
    this.currentDate = new Date();
    this.segments = [];
    this.scope = 'today';
    this.tooltip = null;
    this.currentView = 'timeline';
    this.eventsGroup = null;
    this.nowGroup = null;
  }

  init() {
    this.createTimelineContainer();
    this.createTooltip();
    this.setupViewToggle();
    
    const today = new Date();
    this.currentDate = today;
    this.updateTimelineDate();
    
    if (this.container && this.svg) {
      this.showTimelineView();
    } else {
      this.showSlotsView();
    }
  }

  createTimelineContainer() {
    this.container = document.querySelector('.slots-half');
    this.svg = document.querySelector('.slots-timeline-svg');
    if (this.container && this.svg) {
      this.createSVGGrid(this.svg);
    }
  }

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
  }

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

  initializeTimeline(segments, scope) {
    this.segments = segments;
    this.scope = scope;
    
    const today = new Date();
    this.currentDate = today;
    this.updateTimelineDate();
    
    this.displayDayEvents(today);
  }

  updateTimelineDate() {
    const currentDateElement = document.getElementById('slotsCurrentDate');
    if (currentDateElement) {
      currentDateElement.textContent = formatDateForDisplay(this.currentDate);
    }
  }

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

  displayPrayers(prayerTimes) {
    if (!prayerTimes) return;
    
    const paddingBefore = getPaddingBefore();
    const paddingAfter = getPaddingAfter();
    
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
        const exactStartTime = this.subtractPadding(time, paddingBefore);
        const exactEndTime = this.addPadding(time, paddingAfter);
        const prayerTitle = `${prayerNames[prayer]} (${time})`;
        
        this.createSVGEvent(prayerTitle, exactStartTime, exactEndTime, 'prayer', 'prayer', time);
      }
    });
  }

  displaySlots(slots) {
    if (!slots || !Array.isArray(slots)) return;
    
    const paddingBefore = getPaddingBefore();
    const paddingAfter = getPaddingAfter();
    
    const dayData = this.getDayData(this.currentDate);
    const prayerTimes = dayData ? dayData.prayer_times : null;
    
    if (prayerTimes) {
      const prayerEntries = Object.entries(prayerTimes).sort((a, b) => {
        return timeToMinutes(a[1]) - timeToMinutes(b[1]);
      });
      
      for (let i = 0; i < prayerEntries.length - 1; i++) {
        const currentPrayer = prayerEntries[i];
        const nextPrayer = prayerEntries[i + 1];
        
        const currentPrayerTime = currentPrayer[1];
        const nextPrayerTime = nextPrayer[1];
        
        const slotStart = this.addPadding(currentPrayerTime, paddingAfter);
        const slotEnd = this.subtractPadding(nextPrayerTime, paddingBefore);
        
        const realSlotStart = this.addPadding(currentPrayerTime, paddingAfter);
        const realSlotEnd = this.subtractPadding(nextPrayerTime, paddingBefore);
        const startMinutes = timeToMinutes(realSlotStart);
        const endMinutes = timeToMinutes(realSlotEnd);
        const durationMinutes = endMinutes - startMinutes;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const durationText = hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${minutes}min`;
        
        const slotTitle = `Disponibilité (${durationText})`;
        
        const adjustedSlotStart = this.addPadding(slotStart, 3);
        const adjustedSlotEnd = this.subtractPadding(slotEnd, 3);
        
        if (adjustedSlotStart && adjustedSlotEnd && timeToMinutes(adjustedSlotEnd) > timeToMinutes(adjustedSlotStart)) {
          this.createSVGEvent(slotTitle, adjustedSlotStart, adjustedSlotEnd, 'slot', 'slot', slotStart + '-' + slotEnd);
        }
      }
    }
  }

  subtractPadding(timeStr, paddingMinutes) {
    if (!timeStr || !paddingMinutes) return timeStr;
    const totalMinutes = timeToMinutes(timeStr);
    const adjustedMinutes = totalMinutes - paddingMinutes;
    return minutesToTime(adjustedMinutes);
  }

  addPadding(timeStr, paddingMinutes) {
    if (!timeStr || !paddingMinutes) return timeStr;
    const totalMinutes = timeToMinutes(timeStr);
    const adjustedMinutes = totalMinutes + paddingMinutes;
    return minutesToTime(adjustedMinutes);
  }

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
    
    let syncStartTime, syncEndTime;
    if (syncTime && syncTime.includes('-')) {
      [syncStartTime, syncEndTime] = syncTime.split('-');
    } else {
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
    
    this.eventsGroup.appendChild(rect);
    this.eventsGroup.appendChild(text);
  }

  clearEvents() {
    if (this.eventsGroup) {
      while (this.eventsGroup.firstChild) {
        this.eventsGroup.removeChild(this.eventsGroup.firstChild);
      }
    }
  }

  showEmptyState() {
    if (!this.svg) return;
    
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

  navigateToDay(date) {
    this.displayDayEvents(date);
  }

  setDate(date) {
    if (!date) return;
    this.currentDate = new Date(date);
    this.updateTimelineDate();
    this.displayDayEvents(this.currentDate);
  }

  setupViewToggle() {
    const toggleBtn = document.getElementById('toggleViewBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggleView();
      });
    }
  }

  toggleView() {
    if (this.currentView === 'timeline') {
      this.showSlotsView();
    } else {
      this.showTimelineView();
    }
  }

  showTimelineView() {
    const timelineContent = document.querySelector('.timeline-content');
    const slotsList = document.getElementById('availableSlotsList');
    if (timelineContent && slotsList) {
      timelineContent.style.display = 'flex';
      slotsList.style.display = 'none';
      this.currentView = 'timeline';
    }
  }

  showSlotsView() {
    const timelineContent = document.querySelector('.timeline-content');
    const slotsList = document.getElementById('availableSlotsList');
    if (timelineContent && slotsList) {
      timelineContent.style.display = 'none';
      slotsList.style.display = 'block';
      this.currentView = 'slots';
    }
  }

  getCurrentView() {
    return this.currentView;
  }

  isInitialized() {
    return this.container !== null && this.svg !== null;
  }
}

describe('Timeline Class', () => {
  let timeline;

  beforeEach(() => {
    createTimelineDOM();
    timeline = new MockTimeline();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Initialization', () => {
    test('should initialize timeline correctly', () => {
      timeline.init();
      
      expect(timeline.container).toBeTruthy();
      expect(timeline.svg).toBeTruthy();
      expect(timeline.currentDate).toBeInstanceOf(Date);
      expect(timeline.eventsGroup).toBeTruthy();
      expect(timeline.nowGroup).toBeTruthy();
    });

    test('should create tooltip if not exists', () => {
      timeline.createTooltip();
      
      expect(timeline.tooltip).toBeTruthy();
      expect(timeline.tooltip.className).toBe('timeline-tooltip');
    });

    test('should setup view toggle correctly', () => {
      timeline.setupViewToggle();
      
      const toggleBtn = document.getElementById('toggleViewBtn');
      expect(toggleBtn).toBeTruthy();
    });
  });

  describe('Date Management', () => {
    test('should update timeline date correctly', () => {
      const testDate = new Date('2024-01-15');
      timeline.currentDate = testDate;
      timeline.updateTimelineDate();
      
      const dateElement = document.getElementById('slotsCurrentDate');
      expect(dateElement.textContent).toBe('lun. 15 janv.');
    });

    test('should set date correctly', () => {
      const testDate = new Date('2024-01-15');
      timeline.setDate(testDate);
      
      expect(timeline.currentDate.toDateString()).toBe(testDate.toDateString());
    });
  });

  describe('Data Management', () => {
    test('should initialize timeline with segments and scope', () => {
      const segments = [{ prayer_times: { fajr: '06:00' } }];
      const scope = 'today';
      
      timeline.initializeTimeline(segments, scope);
      
      expect(timeline.segments).toEqual(segments);
      expect(timeline.scope).toBe(scope);
    });

    test('should get day data for today scope', () => {
      const segments = [{ prayer_times: { fajr: '06:00' } }];
      timeline.segments = segments;
      timeline.scope = 'today';
      
      const dayData = timeline.getDayData(new Date());
      
      expect(dayData).toEqual(segments[0]);
    });

    test('should get day data for month scope', () => {
      const segments = [
        { prayer_times: { fajr: '06:00' } },
        { prayer_times: { fajr: '06:01' } }
      ];
      timeline.segments = segments;
      timeline.scope = 'month';
      
      const testDate = new Date('2024-01-02'); // Day 2
      const dayData = timeline.getDayData(testDate);
      
      expect(dayData).toEqual(segments[1]); // Index 1 (day 2 - 1)
    });

    test('should return null for invalid day data', () => {
      timeline.segments = [];
      
      const dayData = timeline.getDayData(new Date());
      
      expect(dayData).toBeNull();
    });
  });

  describe('Event Display', () => {
    test('should display prayers correctly', () => {
      timeline.init();
      
      const prayerTimes = {
        fajr: '06:00',
        dohr: '12:00',
        asr: '15:30'
      };
      
      timeline.displayPrayers(prayerTimes);
      
      const events = timeline.eventsGroup.querySelectorAll('.timeline-event');
      expect(events.length).toBe(3);
    });

    test('should display slots correctly', () => {
      timeline.init();
      // Fournir un segment avec prayer_times et slots pour le jour courant
      const segments = [{
        prayer_times: {
          fajr: '06:00',
          dohr: '12:00',
          asr: '15:30',
          maghreb: '18:00',
          icha: '20:00'
        },
        slots: [
          { start: '07:00', end: '11:00' },
          { start: '13:00', end: '15:00' }
        ]
      }];
      timeline.segments = segments;
      timeline.scope = 'today';
      timeline.currentDate = new Date();
      // Appel de displaySlots avec les slots du segment courant
      timeline.displaySlots(segments[0].slots);
      const events = timeline.eventsGroup.querySelectorAll('.timeline-event');
      expect(events.length).toBeGreaterThan(0);
    });

    test('should create SVG events correctly', () => {
      timeline.init();
      
      timeline.createSVGEvent('Test Event', '10:00', '11:00', 'test', 'test-class');
      
      const events = timeline.eventsGroup.querySelectorAll('.timeline-event');
      expect(events.length).toBe(1);
      
      const event = events[0];
      expect(event.classList.contains('test-class')).toBe(true);
      expect(event.getAttribute('data-start')).toBe('10:00');
      expect(event.getAttribute('data-end')).toBe('11:00');
    });

    test('should clear events correctly', () => {
      timeline.init();
      
      timeline.createSVGEvent('Test Event', '10:00', '11:00', 'test', 'test-class');
      expect(timeline.eventsGroup.children.length).toBe(2); // rect + text
      
      timeline.clearEvents();
      expect(timeline.eventsGroup.children.length).toBe(0);
    });
  });

  describe('View Management', () => {
    test('should show timeline view correctly', () => {
      timeline.showTimelineView();
      
      const timelineContent = document.querySelector('.timeline-content');
      const slotsList = document.getElementById('availableSlotsList');
      
      expect(timelineContent.style.display).toBe('flex');
      expect(slotsList.style.display).toBe('none');
      expect(timeline.currentView).toBe('timeline');
    });

    test('should show slots view correctly', () => {
      timeline.showSlotsView();
      
      const timelineContent = document.querySelector('.timeline-content');
      const slotsList = document.getElementById('availableSlotsList');
      
      expect(timelineContent.style.display).toBe('none');
      expect(slotsList.style.display).toBe('block');
      expect(timeline.currentView).toBe('slots');
    });

    test('should toggle view correctly', () => {
      timeline.currentView = 'timeline';
      timeline.toggleView();
      expect(timeline.currentView).toBe('slots');
      
      timeline.toggleView();
      expect(timeline.currentView).toBe('timeline');
    });

    test('should get current view correctly', () => {
      timeline.currentView = 'timeline';
      expect(timeline.getCurrentView()).toBe('timeline');
      
      timeline.currentView = 'slots';
      expect(timeline.getCurrentView()).toBe('slots');
    });
  });

  describe('Utility Methods', () => {
    test('should add padding correctly', () => {
      const result = timeline.addPadding('10:00', 30);
      expect(result).toBe('10:30');
    });

    test('should subtract padding correctly', () => {
      const result = timeline.subtractPadding('10:30', 30);
      expect(result).toBe('10:00');
    });

    test('should handle null padding values', () => {
      expect(timeline.addPadding('10:00', null)).toBe('10:00');
      expect(timeline.subtractPadding('10:00', null)).toBe('10:00');
    });

    test('should check initialization status', () => {
      expect(timeline.isInitialized()).toBe(false);
      
      timeline.init();
      expect(timeline.isInitialized()).toBe(true);
    });
  });

  describe('Navigation', () => {
    test('should navigate to day correctly', () => {
      const testDate = new Date('2024-01-15');
      const spy = jest.spyOn(timeline, 'displayDayEvents');
      
      timeline.navigateToDay(testDate);
      
      expect(spy).toHaveBeenCalledWith(testDate);
      spy.mockRestore();
    });
  });

  describe('Empty State', () => {
    test('should show empty state when no data', () => {
      timeline.init();
      
      timeline.showEmptyState();
      
      const emptyText = timeline.svg.querySelector('text');
      expect(emptyText.textContent).toBe('No events for this day');
    });
  });
}); 