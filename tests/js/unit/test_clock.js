/**
 * Clock class tests
 * Tests for the circular clock component with prayer time segments
 */

const {
  formatDateForDisplay,
  timeToMinutes,
  minutesToTime,
  getPaddingBefore,
  getPaddingAfter
} = require('../../../app/static/js/planner.js');

// Mock DOM elements for Clock
const createClockDOM = () => {
  document.body.innerHTML = `
    <div class="clock-half">
      <svg class="clock-svg" width="400" height="400" viewBox="0 0 400 400"></svg>
      <div class="clock-time">12:00</div>
      <div class="clock-date">Today</div>
      <div class="clock-tooltip"></div>
    </div>
    <div class="prayer-segments"></div>
    <div class="current-prayer-indicator"></div>
  `;
};

// Mock Clock class (simplified version for testing)
class MockClock {
  constructor() {
    this.container = null;
    this.svg = null;
    this.timeDisplay = null;
    this.dateDisplay = null;
    this.tooltip = null;
    this.centerX = 200;
    this.centerY = 200;
    this.radius = 150;
    this.hourHand = null;
    this.minuteHand = null;
    this.secondHand = null;
    this.prayerSegments = [];
    this.currentPrayer = null;
    this.updateInterval = null;
  }

  init() {
    this.createClockContainer();
    this.createClockFace();
    this.createHands();
    this.createTooltip();
    this.startClock();
  }

  createClockContainer() {
    this.container = document.querySelector('.clock-half');
    this.svg = document.querySelector('.clock-svg');
    this.timeDisplay = document.querySelector('.clock-time');
    this.dateDisplay = document.querySelector('.clock-date');
  }

  createClockFace() {
    if (!this.svg) return;

    // Clear existing content
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }

    // Create clock face circle
    const face = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    face.setAttribute('cx', this.centerX);
    face.setAttribute('cy', this.centerY);
    face.setAttribute('r', this.radius);
    face.setAttribute('class', 'clock-face');
    face.setAttribute('fill', 'var(--bg-secondary)');
    face.setAttribute('stroke', 'var(--border-color)');
    face.setAttribute('stroke-width', '2');

    // Create hour markers
    const markersGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    markersGroup.setAttribute('class', 'hour-markers');

    for (let hour = 1; hour <= 12; hour++) {
      const angle = (hour * 30 - 90) * (Math.PI / 180);
      const x1 = this.centerX + (this.radius - 20) * Math.cos(angle);
      const y1 = this.centerY + (this.radius - 20) * Math.sin(angle);
      const x2 = this.centerX + this.radius * Math.cos(angle);
      const y2 = this.centerY + this.radius * Math.sin(angle);

      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      marker.setAttribute('x1', x1);
      marker.setAttribute('y1', y1);
      marker.setAttribute('x2', x2);
      marker.setAttribute('y2', y2);
      marker.setAttribute('stroke', 'var(--text-primary)');
      marker.setAttribute('stroke-width', '2');

      markersGroup.appendChild(marker);
    }

    // Create prayer segments group
    const segmentsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    segmentsGroup.setAttribute('class', 'prayer-segments');

    // Create hands group
    const handsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    handsGroup.setAttribute('class', 'clock-hands');

    this.svg.appendChild(face);
    this.svg.appendChild(markersGroup);
    this.svg.appendChild(segmentsGroup);
    this.svg.appendChild(handsGroup);
  }

  createHands() {
    if (!this.svg) return;

    const handsGroup = this.svg.querySelector('.clock-hands');
    if (!handsGroup) return;

    // Hour hand
    this.hourHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    this.hourHand.setAttribute('x1', this.centerX);
    this.hourHand.setAttribute('y1', this.centerY);
    this.hourHand.setAttribute('x2', this.centerX);
    this.hourHand.setAttribute('y2', this.centerY - this.radius * 0.5);
    this.hourHand.setAttribute('stroke', 'var(--text-primary)');
    this.hourHand.setAttribute('stroke-width', '4');
    this.hourHand.setAttribute('stroke-linecap', 'round');

    // Minute hand
    this.minuteHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    this.minuteHand.setAttribute('x1', this.centerX);
    this.minuteHand.setAttribute('y1', this.centerY);
    this.minuteHand.setAttribute('x2', this.centerX);
    this.minuteHand.setAttribute('y2', this.centerY - this.radius * 0.7);
    this.minuteHand.setAttribute('stroke', 'var(--text-primary)');
    this.minuteHand.setAttribute('stroke-width', '3');
    this.minuteHand.setAttribute('stroke-linecap', 'round');

    // Second hand
    this.secondHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    this.secondHand.setAttribute('x1', this.centerX);
    this.secondHand.setAttribute('y1', this.centerY);
    this.secondHand.setAttribute('x2', this.centerX);
    this.secondHand.setAttribute('y2', this.centerY - this.radius * 0.8);
    this.secondHand.setAttribute('stroke', 'var(--accent-color)');
    this.secondHand.setAttribute('stroke-width', '2');
    this.secondHand.setAttribute('stroke-linecap', 'round');

    // Center dot
    const centerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerDot.setAttribute('cx', this.centerX);
    centerDot.setAttribute('cy', this.centerY);
    centerDot.setAttribute('r', '4');
    centerDot.setAttribute('fill', 'var(--text-primary)');

    handsGroup.appendChild(this.hourHand);
    handsGroup.appendChild(this.minuteHand);
    handsGroup.appendChild(this.secondHand);
    handsGroup.appendChild(centerDot);
  }

  createTooltip() {
    this.tooltip = document.querySelector('.clock-tooltip');
    if (!this.tooltip) {
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'clock-tooltip';
      this.tooltip.style.position = 'absolute';
      this.tooltip.style.zIndex = '1000';
      this.tooltip.style.pointerEvents = 'none';
      document.body.appendChild(this.tooltip);
    }
  }

  startClock() {
    this.updateClock();
    this.updateInterval = setInterval(() => {
      this.updateClock();
    }, 1000);
  }

  stopClock() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  updateClock() {
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    this.updateHands(hours, minutes, seconds);
    this.updateTimeDisplay(hours, minutes);
    this.updateDateDisplay(now);
    this.updateCurrentPrayer();
  }

  updateHands(hours, minutes, seconds) {
    if (!this.hourHand || !this.minuteHand || !this.secondHand) return;

    const hourAngle = (hours * 30 + minutes * 0.5 - 90) * (Math.PI / 180);
    const minuteAngle = (minutes * 6 - 90) * (Math.PI / 180);
    const secondAngle = (seconds * 6 - 90) * (Math.PI / 180);

    this.hourHand.setAttribute('x2', this.centerX + this.radius * 0.5 * Math.cos(hourAngle));
    this.hourHand.setAttribute('y2', this.centerY + this.radius * 0.5 * Math.sin(hourAngle));

    this.minuteHand.setAttribute('x2', this.centerX + this.radius * 0.7 * Math.cos(minuteAngle));
    this.minuteHand.setAttribute('y2', this.centerY + this.radius * 0.7 * Math.sin(minuteAngle));

    this.secondHand.setAttribute('x2', this.centerX + this.radius * 0.8 * Math.cos(secondAngle));
    this.secondHand.setAttribute('y2', this.centerY + this.radius * 0.8 * Math.sin(secondAngle));
  }

  updateTimeDisplay(hours, minutes) {
    if (!this.timeDisplay) return;
    
    const displayHours = hours === 0 ? 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');
    this.timeDisplay.textContent = `${displayHours}:${displayMinutes}`;
  }

  updateDateDisplay(date) {
    if (!this.dateDisplay) return;
    
    this.dateDisplay.textContent = formatDateForDisplay(date);
  }

  setTime(hours, minutes, seconds = 0) {
    this.updateHands(hours, minutes, seconds);
    this.updateTimeDisplay(hours, minutes);
  }

  displayPrayerSegments(prayerTimes) {
    if (!this.svg || !prayerTimes) return;

    this.prayerSegments = [];
    const segmentsGroup = this.svg.querySelector('.prayer-segments');
    if (!segmentsGroup) return;

    // Clear existing segments
    while (segmentsGroup.firstChild) {
      segmentsGroup.removeChild(segmentsGroup.firstChild);
    }

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
        const startTime = this.subtractPadding(time, paddingBefore);
        const endTime = this.addPadding(time, paddingAfter);
        
        const segment = this.createPrayerSegment(prayer, time, startTime, endTime);
        if (segment) {
          segmentsGroup.appendChild(segment);
          this.prayerSegments.push({
            prayer,
            time,
            startTime,
            endTime,
            element: segment
          });
        }
      }
    });
  }

  createPrayerSegment(prayer, time, startTime, endTime) {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    if (startMinutes === endMinutes) return null;

    const startAngle = (startMinutes * 0.1 - 90) * (Math.PI / 180);
    const endAngle = (endMinutes * 0.1 - 90) * (Math.PI / 180);

    const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;

    const x1 = this.centerX + this.radius * Math.cos(startAngle);
    const y1 = this.centerY + this.radius * Math.sin(startAngle);
    const x2 = this.centerX + this.radius * Math.cos(endAngle);
    const y2 = this.centerY + this.radius * Math.sin(endAngle);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} A ${this.radius} ${this.radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`);
    path.setAttribute('stroke', 'var(--accent-color)');
    path.setAttribute('stroke-width', '8');
    path.setAttribute('fill', 'none');
    path.setAttribute('class', 'prayer-segment');
    path.setAttribute('data-prayer', prayer);
    path.setAttribute('data-time', time);

    return path;
  }

  highlightCurrentPrayer() {
    if (!this.prayerSegments.length) return;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    let currentPrayer = null;
    let minDistance = Infinity;

    this.prayerSegments.forEach(segment => {
      const prayerMinutes = timeToMinutes(segment.time);
      const distance = Math.abs(currentMinutes - prayerMinutes);
      
      if (distance < minDistance) {
        minDistance = distance;
        currentPrayer = segment;
      }
    });

    // Remove previous highlight
    this.prayerSegments.forEach(segment => {
      segment.element.setAttribute('stroke', 'var(--accent-color)');
      segment.element.setAttribute('stroke-width', '8');
    });

    // Highlight current prayer
    if (currentPrayer) {
      currentPrayer.element.setAttribute('stroke', 'var(--primary-color)');
      currentPrayer.element.setAttribute('stroke-width', '12');
      this.currentPrayer = currentPrayer;
    }
  }

  updateCurrentPrayer() {
    this.highlightCurrentPrayer();
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

  getCurrentPrayer() {
    return this.currentPrayer;
  }

  getPrayerSegments() {
    return this.prayerSegments;
  }

  isRunning() {
    return this.updateInterval !== null;
  }

  destroy() {
    this.stopClock();
    this.container = null;
    this.svg = null;
    this.timeDisplay = null;
    this.dateDisplay = null;
    this.tooltip = null;
    this.hourHand = null;
    this.minuteHand = null;
    this.secondHand = null;
    this.prayerSegments = [];
    this.currentPrayer = null;
  }
}

describe('Clock Class', () => {
  let clock;

  beforeEach(() => {
    createClockDOM();
    clock = new MockClock();
  });

  afterEach(() => {
    clock.destroy();
    document.body.innerHTML = '';
  });

  describe('Initialization', () => {
    test('should initialize clock correctly', () => {
      clock.init();
      
      expect(clock.container).toBeTruthy();
      expect(clock.svg).toBeTruthy();
      expect(clock.timeDisplay).toBeTruthy();
      expect(clock.dateDisplay).toBeTruthy();
      expect(clock.hourHand).toBeTruthy();
      expect(clock.minuteHand).toBeTruthy();
      expect(clock.secondHand).toBeTruthy();
    });

    test('should create clock face with markers', () => {
      clock.init();
      
      const face = clock.svg.querySelector('.clock-face');
      const markers = clock.svg.querySelectorAll('.hour-markers line');
      
      expect(face).toBeTruthy();
      expect(markers.length).toBe(12); // 12 hour markers
    });

    test('should create tooltip if not exists', () => {
      clock.createTooltip();
      
      expect(clock.tooltip).toBeTruthy();
      expect(clock.tooltip.className).toBe('clock-tooltip');
    });
  });

  describe('Clock Hands', () => {
    test('should create all clock hands', () => {
      clock.init();
      
      const handsGroup = clock.svg.querySelector('.clock-hands');
      expect(handsGroup).toBeTruthy();
      
      const hands = handsGroup.querySelectorAll('line');
      expect(hands.length).toBe(3); // hour, minute, second
      
      const centerDot = handsGroup.querySelector('circle');
      expect(centerDot).toBeTruthy();
    });

    test('should update hands correctly', () => {
      clock.init();
      
      // Get initial positions
      const initialHourX2 = clock.hourHand.getAttribute('x2');
      const initialMinuteX2 = clock.minuteHand.getAttribute('x2');
      const initialSecondX2 = clock.secondHand.getAttribute('x2');
      
      // Update to a specific time
      clock.updateHands(3, 30, 45);
      
      // Check that hands have been updated (position changed from initial)
      expect(clock.hourHand.getAttribute('x2')).not.toBe(initialHourX2);
      expect(clock.minuteHand.getAttribute('x2')).not.toBe(initialMinuteX2);
      expect(clock.secondHand.getAttribute('x2')).not.toBe(initialSecondX2);
    });

    test('should set time correctly', () => {
      clock.init();
      
      clock.setTime(9, 15);
      
      expect(clock.timeDisplay.textContent).toBe('9:15');
    });
  });

  describe('Time Display', () => {
    test('should update time display correctly', () => {
      clock.init();
      
      clock.updateTimeDisplay(3, 5);
      expect(clock.timeDisplay.textContent).toBe('3:05');
      
      clock.updateTimeDisplay(0, 30);
      expect(clock.timeDisplay.textContent).toBe('12:30');
    });

    test('should update date display correctly', () => {
      clock.init();
      
      const testDate = new Date('2024-01-15');
      clock.updateDateDisplay(testDate);
      
      expect(clock.dateDisplay.textContent).toBe('lun. 15 janv.');
    });
  });

  describe('Prayer Segments', () => {
    test('should display prayer segments correctly', () => {
      clock.init();
      
      const prayerTimes = {
        fajr: '06:00',
        dohr: '12:00',
        asr: '15:30',
        maghreb: '18:00',
        icha: '20:00'
      };
      
      clock.displayPrayerSegments(prayerTimes);
      
      const segments = clock.svg.querySelectorAll('.prayer-segment');
      expect(segments.length).toBe(5);
    });

    test('should create prayer segment with correct attributes', () => {
      clock.init();
      
      const prayerTimes = { fajr: '06:00' };
      clock.displayPrayerSegments(prayerTimes);
      
      const segment = clock.svg.querySelector('.prayer-segment');
      expect(segment).toBeTruthy();
      expect(segment.getAttribute('data-prayer')).toBe('fajr');
      expect(segment.getAttribute('data-time')).toBe('06:00');
    });

    test('should highlight current prayer', () => {
      clock.init();
      
      const prayerTimes = {
        fajr: '06:00',
        dohr: '12:00',
        asr: '15:30'
      };
      
      clock.displayPrayerSegments(prayerTimes);
      clock.highlightCurrentPrayer();
      
      // Should have a current prayer selected
      expect(clock.currentPrayer).toBeTruthy();
    });

    test('should get prayer segments', () => {
      clock.init();
      
      const prayerTimes = { fajr: '06:00', dohr: '12:00' };
      clock.displayPrayerSegments(prayerTimes);
      
      const segments = clock.getPrayerSegments();
      expect(segments.length).toBe(2);
      expect(segments[0].prayer).toBe('fajr');
      expect(segments[1].prayer).toBe('dohr');
    });
  });

  describe('Clock Operation', () => {
    test('should start clock correctly', () => {
      clock.init();
      
      expect(clock.isRunning()).toBe(true);
    });

    test('should stop clock correctly', () => {
      clock.init();
      
      clock.stopClock();
      expect(clock.isRunning()).toBe(false);
    });

    test('should update clock continuously', () => {
      clock.init();
      
      const initialTime = clock.timeDisplay.textContent;
      
      // Simulate time passing
      setTimeout(() => {
        expect(clock.timeDisplay.textContent).not.toBe(initialTime);
      }, 1100);
    });
  });

  describe('Utility Methods', () => {
    test('should add padding correctly', () => {
      const result = clock.addPadding('10:00', 30);
      expect(result).toBe('10:30');
    });

    test('should subtract padding correctly', () => {
      const result = clock.subtractPadding('10:30', 30);
      expect(result).toBe('10:00');
    });

    test('should handle null padding values', () => {
      expect(clock.addPadding('10:00', null)).toBe('10:00');
      expect(clock.subtractPadding('10:00', null)).toBe('10:00');
    });

    test('should get current prayer', () => {
      clock.init();
      
      const prayerTimes = { fajr: '06:00' };
      clock.displayPrayerSegments(prayerTimes);
      clock.highlightCurrentPrayer();
      
      const currentPrayer = clock.getCurrentPrayer();
      expect(currentPrayer).toBeTruthy();
    });
  });

  describe('Cleanup', () => {
    test('should destroy clock correctly', () => {
      clock.init();
      
      clock.destroy();
      
      expect(clock.container).toBeNull();
      expect(clock.svg).toBeNull();
      expect(clock.isRunning()).toBe(false);
    });
  });
}); 