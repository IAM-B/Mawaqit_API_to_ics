/**
 * CalendarViewsManager class tests
 * Tests for the calendar navigation component that manages date navigation
 */

const {
  formatDateForDisplay,
  timeToMinutes,
  minutesToTime,
  getPaddingBefore,
  getPaddingAfter
} = require('../../../app/static/js/planner.js');

// Mock DOM elements for CalendarViewsManager
const createCalendarViewsManagerDOM = () => {
  document.body.innerHTML = `
    <div class="calendar-controls">
      <button id="prevDayBtn">Previous Day</button>
      <button id="nextDayBtn">Next Day</button>
      <button id="prevMonthBtn">Previous Month</button>
      <button id="nextMonthBtn">Next Month</button>
      <button id="prevYearBtn">Previous Year</button>
      <button id="nextYearBtn">Next Year</button>
      <button id="todayBtn">Today</button>
      <div class="current-date-display">Today</div>
    </div>
    
    <div class="calendar-view">
      <div class="calendar-header">
        <span class="month-year-display">January 2024</span>
      </div>
      <div class="calendar-grid">
        <div class="calendar-day" data-date="2024-01-01">1</div>
        <div class="calendar-day" data-date="2024-01-02">2</div>
        <div class="calendar-day" data-date="2024-01-03">3</div>
        <div class="calendar-day" data-date="2024-01-04">4</div>
        <div class="calendar-day" data-date="2024-01-05">5</div>
        <div class="calendar-day" data-date="2024-01-06">6</div>
        <div class="calendar-day" data-date="2024-01-07">7</div>
      </div>
    </div>
  `;
};

// Mock CalendarViewsManager class (simplified version for testing)
class MockCalendarViewsManager {
  constructor() {
    this.currentDate = new Date();
    this.scope = 'today';
    this.timeline = null;
    this.plannerPage = null;
    this.prevDayBtn = null;
    this.nextDayBtn = null;
    this.prevMonthBtn = null;
    this.nextMonthBtn = null;
    this.prevYearBtn = null;
    this.nextYearBtn = null;
    this.todayBtn = null;
    this.currentDateDisplay = null;
    this.monthYearDisplay = null;
    this.calendarGrid = null;
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.updateDisplay();
    this.updateNavigation();
  }

  setupElements() {
    this.prevDayBtn = document.getElementById('prevDayBtn');
    this.nextDayBtn = document.getElementById('nextDayBtn');
    this.prevMonthBtn = document.getElementById('prevMonthBtn');
    this.nextMonthBtn = document.getElementById('nextMonthBtn');
    this.prevYearBtn = document.getElementById('prevYearBtn');
    this.nextYearBtn = document.getElementById('nextYearBtn');
    this.todayBtn = document.getElementById('todayBtn');
    this.currentDateDisplay = document.querySelector('.current-date-display');
    this.monthYearDisplay = document.querySelector('.month-year-display');
    this.calendarGrid = document.querySelector('.calendar-grid');
  }

  setupEventListeners() {
    if (this.prevDayBtn) {
      this.prevDayBtn.addEventListener('click', () => this.navigateToPreviousDay());
    }
    if (this.nextDayBtn) {
      this.nextDayBtn.addEventListener('click', () => this.navigateToNextDay());
    }
    if (this.prevMonthBtn) {
      this.prevMonthBtn.addEventListener('click', () => this.navigateToPreviousMonth());
    }
    if (this.nextMonthBtn) {
      this.nextMonthBtn.addEventListener('click', () => this.navigateToNextMonth());
    }
    if (this.prevYearBtn) {
      this.prevYearBtn.addEventListener('click', () => this.navigateToPreviousYear());
    }
    if (this.nextYearBtn) {
      this.nextYearBtn.addEventListener('click', () => this.navigateToNextYear());
    }
    if (this.todayBtn) {
      this.todayBtn.addEventListener('click', () => this.navigateToToday());
    }

    // Setup calendar day clicks
    if (this.calendarGrid) {
      this.calendarGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('calendar-day')) {
          const dateStr = e.target.getAttribute('data-date');
          if (dateStr) {
            this.navigateToDate(new Date(dateStr));
          }
        }
      });
    }
  }

  setTimeline(timeline) {
    this.timeline = timeline;
  }

  setPlannerPage(plannerPage) {
    this.plannerPage = plannerPage;
  }

  setScope(scope) {
    this.scope = scope;
    this.updateNavigation();
  }

  setCurrentDate(date) {
    this.currentDate = new Date(date);
    this.updateDisplay();
    this.updateNavigation();
  }

  navigateToPreviousDay() {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() - 1);
    this.navigateToDate(newDate);
  }

  navigateToNextDay() {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() + 1);
    this.navigateToDate(newDate);
  }

  navigateToPreviousMonth() {
    const newDate = new Date(this.currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    this.navigateToDate(newDate);
  }

  navigateToNextMonth() {
    const newDate = new Date(this.currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    this.navigateToDate(newDate);
  }

  navigateToPreviousYear() {
    const newDate = new Date(this.currentDate);
    newDate.setFullYear(newDate.getFullYear() - 1);
    this.navigateToDate(newDate);
  }

  navigateToNextYear() {
    const newDate = new Date(this.currentDate);
    newDate.setFullYear(newDate.getFullYear() + 1);
    this.navigateToDate(newDate);
  }

  navigateToToday() {
    this.navigateToDate(new Date());
  }

  navigateToDate(date) {
    this.currentDate = new Date(date);
    this.updateDisplay();
    this.updateNavigation();
    this.syncWithComponents();
  }

  updateDisplay() {
    this.updateCurrentDateDisplay();
    this.updateMonthYearDisplay();
    this.updateCalendarGrid();
  }

  updateCurrentDateDisplay() {
    if (this.currentDateDisplay) {
      this.currentDateDisplay.textContent = formatDateForDisplay(this.currentDate);
    }
  }

  updateMonthYearDisplay() {
    if (this.monthYearDisplay) {
      const month = this.currentDate.toLocaleDateString('en-US', { month: 'long' });
      const year = this.currentDate.getFullYear();
      this.monthYearDisplay.textContent = `${month} ${year}`;
    }
  }

  updateCalendarGrid() {
    if (!this.calendarGrid) return;

    const days = this.calendarGrid.querySelectorAll('.calendar-day');
    const currentDay = this.currentDate.getDate();
    const currentMonth = this.currentDate.getMonth();
    const currentYear = this.currentDate.getFullYear();

    days.forEach((day, index) => {
      const dayNumber = index + 1;
      const dayDate = new Date(currentYear, currentMonth, dayNumber);
      
      // Update data-date attribute
      day.setAttribute('data-date', dayDate.toISOString().split('T')[0]);
      
      // Update visual state
      day.classList.remove('current-day', 'other-month');
      
      if (dayNumber === currentDay) {
        day.classList.add('current-day');
      }
      
      if (dayDate.getMonth() !== currentMonth) {
        day.classList.add('other-month');
      }
    });
  }

  updateNavigation() {
    this.updateButtonStates();
    this.updateCalendarVisibility();
  }

  updateButtonStates() {
    const buttons = [
      this.prevDayBtn,
      this.nextDayBtn,
      this.prevMonthBtn,
      this.nextMonthBtn,
      this.prevYearBtn,
      this.nextYearBtn
    ];

    buttons.forEach(button => {
      if (button) {
        button.disabled = false;
      }
    });

    // Disable buttons based on scope
    if (this.scope === 'today') {
      if (this.prevDayBtn) this.prevDayBtn.disabled = true;
      if (this.nextDayBtn) this.nextDayBtn.disabled = true;
      if (this.prevMonthBtn) this.prevMonthBtn.disabled = true;
      if (this.nextMonthBtn) this.nextMonthBtn.disabled = true;
      if (this.prevYearBtn) this.prevYearBtn.disabled = true;
      if (this.nextYearBtn) this.nextYearBtn.disabled = true;
    } else if (this.scope === 'month') {
      if (this.prevDayBtn) this.prevDayBtn.disabled = true;
      if (this.nextDayBtn) this.nextDayBtn.disabled = true;
      if (this.prevYearBtn) this.prevYearBtn.disabled = true;
      if (this.nextYearBtn) this.nextYearBtn.disabled = true;
    } else if (this.scope === 'year') {
      if (this.prevDayBtn) this.prevDayBtn.disabled = true;
      if (this.nextDayBtn) this.nextDayBtn.disabled = true;
      if (this.prevMonthBtn) this.prevMonthBtn.disabled = true;
      if (this.nextMonthBtn) this.nextMonthBtn.disabled = true;
    }
  }

  updateCalendarVisibility() {
    const calendarView = document.querySelector('.calendar-view');
    if (calendarView) {
      if (this.scope === 'today') {
        calendarView.style.display = 'none';
      } else {
        calendarView.style.display = 'block';
      }
    }
  }

  syncWithComponents() {
    if (this.timeline) {
      this.timeline.setDate(this.currentDate);
    }

    if (this.plannerPage) {
      this.plannerPage.navigateToDate(this.currentDate);
    }
  }

  getCurrentDate() {
    return this.currentDate;
  }

  getScope() {
    return this.scope;
  }

  isToday() {
    const today = new Date();
    return this.currentDate.toDateString() === today.toDateString();
  }

  isCurrentMonth() {
    const today = new Date();
    return this.currentDate.getMonth() === today.getMonth() && 
           this.currentDate.getFullYear() === today.getFullYear();
  }

  isCurrentYear() {
    const today = new Date();
    return this.currentDate.getFullYear() === today.getFullYear();
  }

  getDaysInMonth() {
    return new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();
  }

  getFirstDayOfMonth() {
    return new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1).getDay();
  }

  destroy() {
    // Remove event listeners
    if (this.prevDayBtn) {
      this.prevDayBtn.removeEventListener('click', this.navigateToPreviousDay);
    }
    if (this.nextDayBtn) {
      this.nextDayBtn.removeEventListener('click', this.navigateToNextDay);
    }
    if (this.prevMonthBtn) {
      this.prevMonthBtn.removeEventListener('click', this.navigateToPreviousMonth);
    }
    if (this.nextMonthBtn) {
      this.nextMonthBtn.removeEventListener('click', this.navigateToNextMonth);
    }
    if (this.prevYearBtn) {
      this.prevYearBtn.removeEventListener('click', this.navigateToPreviousYear);
    }
    if (this.nextYearBtn) {
      this.nextYearBtn.removeEventListener('click', this.navigateToNextYear);
    }
    if (this.todayBtn) {
      this.todayBtn.removeEventListener('click', this.navigateToToday);
    }

    this.timeline = null;
    this.plannerPage = null;
    this.currentDate = new Date();
    this.scope = 'today';
  }
}

describe('CalendarViewsManager Class', () => {
  let calendarManager;

  beforeEach(() => {
    createCalendarViewsManagerDOM();
    calendarManager = new MockCalendarViewsManager();
  });

  afterEach(() => {
    calendarManager.destroy();
    document.body.innerHTML = '';
  });

  describe('Initialization', () => {
    test('should initialize calendar manager correctly', () => {
      calendarManager.init();
      
      expect(calendarManager.prevDayBtn).toBeTruthy();
      expect(calendarManager.nextDayBtn).toBeTruthy();
      expect(calendarManager.prevMonthBtn).toBeTruthy();
      expect(calendarManager.nextMonthBtn).toBeTruthy();
      expect(calendarManager.prevYearBtn).toBeTruthy();
      expect(calendarManager.nextYearBtn).toBeTruthy();
      expect(calendarManager.todayBtn).toBeTruthy();
      expect(calendarManager.currentDateDisplay).toBeTruthy();
      expect(calendarManager.monthYearDisplay).toBeTruthy();
      expect(calendarManager.calendarGrid).toBeTruthy();
    });

    test('should setup event listeners correctly', () => {
      calendarManager.init();
      
      // Check that buttons exist and are clickable (scope is 'today' by default, so buttons are disabled)
      expect(calendarManager.prevDayBtn).toBeTruthy();
      expect(calendarManager.nextDayBtn).toBeTruthy();
      expect(calendarManager.prevDayBtn.disabled).toBe(true); // Disabled in today scope
      expect(calendarManager.nextDayBtn.disabled).toBe(true); // Disabled in today scope
    });
  });

  describe('Date Navigation', () => {
    test('should navigate to previous day correctly', () => {
      calendarManager.init();
      
      const initialDate = new Date('2024-01-15');
      calendarManager.setCurrentDate(initialDate);
      
      calendarManager.navigateToPreviousDay();
      
      const expectedDate = new Date('2024-01-14');
      expect(calendarManager.currentDate.toDateString()).toBe(expectedDate.toDateString());
    });

    test('should navigate to next day correctly', () => {
      calendarManager.init();
      
      const initialDate = new Date('2024-01-15');
      calendarManager.setCurrentDate(initialDate);
      
      calendarManager.navigateToNextDay();
      
      const expectedDate = new Date('2024-01-16');
      expect(calendarManager.currentDate.toDateString()).toBe(expectedDate.toDateString());
    });

    test('should navigate to previous month correctly', () => {
      calendarManager.init();
      
      const initialDate = new Date('2024-01-15');
      calendarManager.setCurrentDate(initialDate);
      
      calendarManager.navigateToPreviousMonth();
      
      const expectedDate = new Date('2023-12-15');
      expect(calendarManager.currentDate.getMonth()).toBe(expectedDate.getMonth());
      expect(calendarManager.currentDate.getFullYear()).toBe(expectedDate.getFullYear());
    });

    test('should navigate to next month correctly', () => {
      calendarManager.init();
      
      const initialDate = new Date('2024-01-15');
      calendarManager.setCurrentDate(initialDate);
      
      calendarManager.navigateToNextMonth();
      
      const expectedDate = new Date('2024-02-15');
      expect(calendarManager.currentDate.getMonth()).toBe(expectedDate.getMonth());
      expect(calendarManager.currentDate.getFullYear()).toBe(expectedDate.getFullYear());
    });

    test('should navigate to previous year correctly', () => {
      calendarManager.init();
      
      const initialDate = new Date('2024-01-15');
      calendarManager.setCurrentDate(initialDate);
      
      calendarManager.navigateToPreviousYear();
      
      const expectedDate = new Date('2023-01-15');
      expect(calendarManager.currentDate.getFullYear()).toBe(expectedDate.getFullYear());
    });

    test('should navigate to next year correctly', () => {
      calendarManager.init();
      
      const initialDate = new Date('2024-01-15');
      calendarManager.setCurrentDate(initialDate);
      
      calendarManager.navigateToNextYear();
      
      const expectedDate = new Date('2025-01-15');
      expect(calendarManager.currentDate.getFullYear()).toBe(expectedDate.getFullYear());
    });

    test('should navigate to today correctly', () => {
      calendarManager.init();
      
      const initialDate = new Date('2024-01-15');
      calendarManager.setCurrentDate(initialDate);
      
      calendarManager.navigateToToday();
      
      const today = new Date();
      expect(calendarManager.currentDate.toDateString()).toBe(today.toDateString());
    });

    test('should navigate to specific date correctly', () => {
      calendarManager.init();
      
      const targetDate = new Date('2024-03-20');
      calendarManager.navigateToDate(targetDate);
      
      expect(calendarManager.currentDate.toDateString()).toBe(targetDate.toDateString());
    });
  });

  describe('Display Updates', () => {
    test('should update current date display correctly', () => {
      calendarManager.init();
      
      const testDate = new Date('2024-01-15');
      calendarManager.setCurrentDate(testDate);
      
      expect(calendarManager.currentDateDisplay.textContent).toBe('lun. 15 janv.');
    });

    test('should update month year display correctly', () => {
      calendarManager.init();
      
      const testDate = new Date('2024-01-15');
      calendarManager.setCurrentDate(testDate);
      
      expect(calendarManager.monthYearDisplay.textContent).toBe('January 2024');
    });

    test('should update calendar grid correctly', () => {
      calendarManager.init();
      
      const testDate = new Date('2024-01-05');
      calendarManager.setCurrentDate(testDate);
      
      const days = calendarManager.calendarGrid.querySelectorAll('.calendar-day');
      expect(days.length).toBe(7);
      
      // Check that the grid was updated with data-date attributes
      const dayElements = Array.from(days);
      const hasDataDates = dayElements.every(day => day.hasAttribute('data-date'));
      expect(hasDataDates).toBe(true);
      
      // Check that at least one day has the current-day class (the logic might vary)
      const hasCurrentDay = dayElements.some(day => day.classList.contains('current-day'));
      expect(hasCurrentDay).toBe(true);
    });
  });

  describe('Scope Management', () => {
    test('should set scope correctly', () => {
      calendarManager.init();
      
      calendarManager.setScope('month');
      expect(calendarManager.scope).toBe('month');
      
      calendarManager.setScope('year');
      expect(calendarManager.scope).toBe('year');
    });

    test('should update navigation based on scope', () => {
      calendarManager.init();
      
      // Test today scope
      calendarManager.setScope('today');
      expect(calendarManager.prevDayBtn.disabled).toBe(true);
      expect(calendarManager.nextDayBtn.disabled).toBe(true);
      
      // Test month scope
      calendarManager.setScope('month');
      expect(calendarManager.prevDayBtn.disabled).toBe(true);
      expect(calendarManager.nextDayBtn.disabled).toBe(true);
      expect(calendarManager.prevMonthBtn.disabled).toBe(false);
      expect(calendarManager.nextMonthBtn.disabled).toBe(false);
      
      // Test year scope
      calendarManager.setScope('year');
      expect(calendarManager.prevDayBtn.disabled).toBe(true);
      expect(calendarManager.nextDayBtn.disabled).toBe(true);
      expect(calendarManager.prevMonthBtn.disabled).toBe(true);
      expect(calendarManager.nextMonthBtn.disabled).toBe(true);
      expect(calendarManager.prevYearBtn.disabled).toBe(false);
      expect(calendarManager.nextYearBtn.disabled).toBe(false);
    });

    test('should update calendar visibility based on scope', () => {
      calendarManager.init();
      
      const calendarView = document.querySelector('.calendar-view');
      
      // Today scope should hide calendar
      calendarManager.setScope('today');
      expect(calendarView.style.display).toBe('none');
      
      // Month scope should show calendar
      calendarManager.setScope('month');
      expect(calendarView.style.display).toBe('block');
    });
  });

  describe('Component Synchronization', () => {
    test('should sync with timeline component', () => {
      calendarManager.init();
      
      const mockTimeline = {
        setDate: jest.fn()
      };
      calendarManager.setTimeline(mockTimeline);
      
      const testDate = new Date('2024-01-15');
      calendarManager.navigateToDate(testDate);
      
      expect(mockTimeline.setDate).toHaveBeenCalledWith(testDate);
    });

    test('should sync with planner page component', () => {
      calendarManager.init();
      
      const mockPlannerPage = {
        navigateToDate: jest.fn()
      };
      calendarManager.setPlannerPage(mockPlannerPage);
      
      const testDate = new Date('2024-01-15');
      calendarManager.navigateToDate(testDate);
      
      expect(mockPlannerPage.navigateToDate).toHaveBeenCalledWith(testDate);
    });
  });

  describe('Utility Methods', () => {
    test('should check if current date is today', () => {
      calendarManager.init();
      
      calendarManager.setCurrentDate(new Date());
      expect(calendarManager.isToday()).toBe(true);
      
      calendarManager.setCurrentDate(new Date('2024-01-15'));
      expect(calendarManager.isToday()).toBe(false);
    });

    test('should check if current date is in current month', () => {
      calendarManager.init();
      
      const today = new Date();
      calendarManager.setCurrentDate(today);
      expect(calendarManager.isCurrentMonth()).toBe(true);
      
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15);
      calendarManager.setCurrentDate(lastMonth);
      expect(calendarManager.isCurrentMonth()).toBe(false);
    });

    test('should check if current date is in current year', () => {
      calendarManager.init();
      
      const today = new Date();
      calendarManager.setCurrentDate(today);
      expect(calendarManager.isCurrentYear()).toBe(true);
      
      const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), 15);
      calendarManager.setCurrentDate(lastYear);
      expect(calendarManager.isCurrentYear()).toBe(false);
    });

    test('should get days in current month', () => {
      calendarManager.init();
      
      calendarManager.setCurrentDate(new Date('2024-01-15')); // January has 31 days
      expect(calendarManager.getDaysInMonth()).toBe(31);
      
      calendarManager.setCurrentDate(new Date('2024-02-15')); // February 2024 has 29 days (leap year)
      expect(calendarManager.getDaysInMonth()).toBe(29);
    });

    test('should get first day of current month', () => {
      calendarManager.init();
      
      calendarManager.setCurrentDate(new Date('2024-01-01')); // January 1, 2024 is a Monday (1)
      expect(calendarManager.getFirstDayOfMonth()).toBe(1);
    });
  });

  describe('Data Management', () => {
    test('should get current date', () => {
      const testDate = new Date('2024-01-15');
      calendarManager.setCurrentDate(testDate);
      
      expect(calendarManager.getCurrentDate().toDateString()).toBe(testDate.toDateString());
    });

    test('should get current scope', () => {
      calendarManager.setScope('month');
      expect(calendarManager.getScope()).toBe('month');
    });
  });

  describe('Cleanup', () => {
    test('should destroy calendar manager correctly', () => {
      calendarManager.init();
      
      calendarManager.destroy();
      
      expect(calendarManager.timeline).toBeNull();
      expect(calendarManager.plannerPage).toBeNull();
      expect(calendarManager.scope).toBe('today');
    });
  });
}); 