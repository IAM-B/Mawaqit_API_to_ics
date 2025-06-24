/**
 * Calendar Views Manager
 * Handles clock calendar functionality
 */
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

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Month navigation for clock calendar
    document.addEventListener('click', (e) => {
      if (e.target.id === 'prevMonthBtn') {
        this.navigateMonth(-1);
      } else if (e.target.id === 'nextMonthBtn') {
        this.navigateMonth(1);
      }
    });
  }

  /**
   * Set clock instance for synchronization
   */
  setClockInstance(clockInstance) {
    this.clockInstance = clockInstance;
  }

  /**
   * Initialize calendar views based on scope
   */
  initializeViews(segments, scope) {
    this.segments = segments;
    this.scope = scope;
    
    // Always show the clock calendar
    this.showClockCalendar();
    this.renderClockCalendar();
  }

  showClockCalendar() {
    const calendar = document.getElementById('clockCalendar');
    const slotsView = document.getElementById('defaultSlotsView');
    
    if (calendar) calendar.style.display = 'block';
    if (slotsView) slotsView.style.display = 'block';
  }

  /**
   * Render clock calendar
   */
  renderClockCalendar() {
    const container = document.getElementById('clockCalendarDays');
    const titleElement = document.getElementById('currentMonthTitle');
    
    if (!container || !titleElement) return;

    // Update title
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    titleElement.textContent = `${monthNames[this.selectedMonth]} ${this.selectedYear}`;

    // Clear container
    container.innerHTML = '';

    // Get first day of month and number of days
    const firstDay = new Date(this.selectedYear, this.selectedMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // Start from Monday

    // Generate calendar days
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayElement = this.createDayElement(currentDate);
      container.appendChild(dayElement);
    }
  }

  createDayElement(date) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    
    dayElement.appendChild(dayNumber);

    // Check if it's current month
    if (date.getMonth() !== this.selectedMonth) {
      dayElement.classList.add('other-month');
    }

    // Check if it's today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      dayElement.classList.add('today');
    }

    // Check if it's selected day
    if (date.getDate() === this.selectedDay && date.getMonth() === this.selectedMonth) {
      dayElement.classList.add('selected');
    }

    // Check if day has slots data
    if (this.segments.length > 0) {
      const dayIndex = date.getDate() - 1;
      if (dayIndex >= 0 && dayIndex < this.segments.length) {
        const dayData = this.segments[dayIndex];
        if (dayData && dayData.slots && dayData.slots.length > 0) {
          dayElement.classList.add('has-slots');
          
          const slotsIndicator = document.createElement('div');
          slotsIndicator.className = 'day-slots-indicator';
          
          const slotsCount = document.createElement('div');
          slotsCount.className = 'day-slots-count';
          slotsCount.textContent = `${dayData.slots.length} créneau${dayData.slots.length > 1 ? 'x' : ''}`;
          
          slotsIndicator.appendChild(slotsCount);
          dayElement.appendChild(slotsIndicator);

          // Add click event to select day and update clock
          dayElement.addEventListener('click', () => {
            this.selectDay(date.getDate(), dayData);
          });
        }
      }
    }

    // Add click event for all days (even without slots)
    dayElement.addEventListener('click', () => {
      if (date.getMonth() === this.selectedMonth) {
        this.selectDay(date.getDate());
      }
    });

    return dayElement;
  }

  /**
   * Select a day and update clock
   */
  selectDay(day, dayData = null) {
    // Remove previous selection
    const previousSelected = document.querySelector('.calendar-day.selected');
    if (previousSelected) {
      previousSelected.classList.remove('selected');
    }

    // Add selection to current day
    const dayElements = document.querySelectorAll('.calendar-day:not(.other-month)');
    const dayIndex = day - 1;
    if (dayElements[dayIndex]) {
      dayElements[dayIndex].classList.add('selected');
    }

    this.selectedDay = day;

    // Update clock if available
    if (this.clockInstance && this.segments.length > 0) {
      if (dayIndex >= 0 && dayIndex < this.segments.length) {
        this.clockInstance.currentIndex = dayIndex;
        this.clockInstance.updateClock();
      }
    }

    // Update slots list if day data is available
    if (dayData) {
      this.updateSlotsList(dayData);
    }
  }

  /**
   * Update slots list with selected day data
   */
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
    });
  }

  /**
   * Navigate to previous/next month
   */
  navigateMonth(direction) {
    this.selectedMonth += direction;
    
    // Handle year boundary
    if (this.selectedMonth < 0) {
      this.selectedMonth = 11;
      this.selectedYear--;
    } else if (this.selectedMonth > 11) {
      this.selectedMonth = 0;
      this.selectedYear++;
    }
    
    // Re-render calendar
    this.renderClockCalendar();
  }

  /**
   * Calculate duration between two times
   */
  calculateDuration(start, end) {
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);
    let duration = endMinutes - startMinutes;
    
    if (duration < 0) {
      duration += 24 * 60; // Add 24 hours if end time is next day
    }
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours === 0) {
      return `${minutes}min`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h${minutes.toString().padStart(2, '0')}min`;
    }
  }

  /**
   * Convert time string to minutes
   */
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// Initialize calendar views manager
let calendarViewsManager;

document.addEventListener('DOMContentLoaded', () => {
  calendarViewsManager = new CalendarViewsManager();
  // Expose globally for access from other scripts
  window.calendarViewsManager = calendarViewsManager;
}); 