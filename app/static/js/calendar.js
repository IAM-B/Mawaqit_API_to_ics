// Calendar component for day grid and navigation

import { formatDateForDisplay, timeToMinutes, minutesToTime } from './utils.js';

/**
 * Main class for the calendar (day grid)
 */
export class CalendarViewsManager {
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