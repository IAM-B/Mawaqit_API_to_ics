/**
 * Unit tests for calendar.js component
 * 
 * This test suite covers the CalendarViewsManager class functionality that
 * provides calendar navigation and date selection capabilities for the
 * prayer planning application. The calendar component allows users to
 * browse through different dates and view corresponding prayer schedules.
 * 
 * Key features tested:
 * - Calendar initialization and DOM setup
 * - Month and year navigation functionality
 * - Date selection and highlighting
 * - Scope management (today, week, month, year)
 * - Clock integration and synchronization
 * - Utility functions for time calculations
 * 
 * Calendar functionality:
 * - Monthly calendar grid display
 * - Navigation between months and years
 * - Day selection with visual feedback
 * - Integration with prayer time data
 * - Responsive design and accessibility
 * 
 * Technical aspects:
 * - DOM manipulation for calendar rendering
 * - Date arithmetic and boundary handling
 * - Event handling for user interactions
 * - Integration with global state management
 * - Time conversion utilities for display
 */

// Import CalendarViewsManager class from the new modular structure
const { CalendarViewsManager } = require("../../../app/static/js/components/calendar.js");

describe("Calendar Component", () => {
  let calendar;
  let mockContainer;

  beforeEach(() => {
    // Setup DOM for tests with realistic calendar structure
    // This creates the necessary DOM elements that CalendarViewsManager expects
    document.body.innerHTML = `
      <div id="clockCalendar" class="clock-calendar">
        <div class="calendar-header">
          <button id="prevMonthBtn" class="calendar-nav-btn">←</button>
          <h3 id="currentMonthTitle" class="calendar-title"></h3>
          <button id="nextMonthBtn" class="calendar-nav-btn">→</button>
        </div>
        <div class="calendar-grid">
          <div class="calendar-weekdays">
            <div class="weekday">Lun</div>
            <div class="weekday">Mar</div>
            <div class="weekday">Mer</div>
            <div class="weekday">Jeu</div>
            <div class="weekday">Ven</div>
            <div class="weekday">Sam</div>
            <div class="weekday">Dim</div>
          </div>
          <div id="clockCalendarDays" class="calendar-days">
            <!-- Calendar days will be generated here -->
          </div>
        </div>
      </div>
    `;

    mockContainer = document.getElementById("clockCalendar");
    
    // Mock global values that CalendarViewsManager might use
    // These represent the current application state
    window.currentMosqueId = "test-mosque-123";
    window.currentPaddingBefore = 10;
    window.currentPaddingAfter = 35;
  });

  afterEach(() => {
    // Clean up DOM and global state after each test
    // This ensures tests don't interfere with each other
    document.body.innerHTML = "";
    delete window.currentMosqueId;
    delete window.currentPaddingBefore;
    delete window.currentPaddingAfter;
  });

  describe("Calendar Initialization", () => {
    /**
     * Tests for the initialization process that sets up the calendar
     * component and establishes its basic structure and properties.
     */
    
    test("should create CalendarViewsManager instance with correct properties", () => {
      // Test basic CalendarViewsManager object creation and property initialization
      // This ensures the component is properly structured with all required properties
      calendar = new CalendarViewsManager();
      
      expect(calendar).toBeDefined();
      expect(calendar.currentMonth).toBeDefined();
      expect(calendar.currentYear).toBeDefined();
      expect(calendar.selectedMonth).toBeDefined();
      expect(calendar.selectedYear).toBeDefined();
      expect(calendar.selectedDay).toBeDefined();
      expect(calendar.segments).toEqual([]);
      expect(calendar.scope).toBe('');
      expect(calendar.clockInstance).toBeNull();
    });

    test("should initialize with current date", () => {
      // Test that CalendarViewsManager starts with the current date
      // This ensures proper initial state for date-based operations
      const now = new Date();
      calendar = new CalendarViewsManager();
      
      expect(calendar.currentMonth).toBe(now.getMonth());
      expect(calendar.currentYear).toBe(now.getFullYear());
      expect(calendar.selectedDay).toBe(now.getDate());
    });
  });

  describe("Calendar Navigation", () => {
    /**
     * Tests for month and year navigation functionality that allows
     * users to browse through different time periods.
     */
    
    beforeEach(() => {
      calendar = new CalendarViewsManager();
    });

    test("should navigate to previous month", () => {
      // Test backward month navigation functionality
      // This allows users to view past months and their prayer schedules
      const initialMonth = calendar.selectedMonth;
      const initialYear = calendar.selectedYear;
      
      calendar.navigateMonth(-1);
      
      if (initialMonth === 0) {
        // Handle year boundary when going from January to December
        expect(calendar.selectedMonth).toBe(11);
        expect(calendar.selectedYear).toBe(initialYear - 1);
      } else {
        // Normal month navigation within the same year
        expect(calendar.selectedMonth).toBe(initialMonth - 1);
        expect(calendar.selectedYear).toBe(initialYear);
      }
    });

    test("should navigate to next month", () => {
      // Test forward month navigation functionality
      // This allows users to view future months and their prayer schedules
      const initialMonth = calendar.selectedMonth;
      const initialYear = calendar.selectedYear;
      
      calendar.navigateMonth(1);
      
      if (initialMonth === 11) {
        // Handle year boundary when going from December to January
        expect(calendar.selectedMonth).toBe(0);
        expect(calendar.selectedYear).toBe(initialYear + 1);
      } else {
        // Normal month navigation within the same year
        expect(calendar.selectedMonth).toBe(initialMonth + 1);
        expect(calendar.selectedYear).toBe(initialYear);
      }
    });
  });

  describe("Calendar Data Management", () => {
    /**
     * Tests for data handling functionality that manages prayer
     * schedule segments and integrates with the clock component.
     */
    
    beforeEach(() => {
      calendar = new CalendarViewsManager();
    });

    test("should initialize views with segments", () => {
      // Test calendar initialization with prayer time segments
      // This populates the calendar with actual prayer schedule data
      const testSegments = [
        { day: 1, slots: [{ start: '06:00', end: '12:00' }] },
        { day: 2, slots: [{ start: '14:00', end: '18:00' }] }
      ];
      
      calendar.initializeViews(testSegments, 'week');
      
      expect(calendar.segments).toEqual(testSegments);
      expect(calendar.scope).toBe('week');
    });

    test("should set clock instance", () => {
      // Test clock component integration
      // This enables synchronization between calendar and clock displays
      const mockClock = { updateClock: jest.fn() };
      
      calendar.setClockInstance(mockClock);
      
      expect(calendar.clockInstance).toBe(mockClock);
    });
  });

  describe("Calendar Utility Methods", () => {
    /**
     * Tests for utility functions that handle time conversions
     * and duration calculations for display purposes.
     */
    
    beforeEach(() => {
      calendar = new CalendarViewsManager();
    });

    test("should convert time to minutes correctly", () => {
      // Test time string to minutes conversion
      // This enables time-based calculations and comparisons
      expect(calendar.timeToMinutes('10:30')).toBe(630);
      expect(calendar.timeToMinutes('00:00')).toBe(0);
      expect(calendar.timeToMinutes('23:59')).toBe(1439);
    });

    test("should calculate duration correctly", () => {
      // Test duration calculation between two time points
      // This provides user-friendly duration displays
      expect(calendar.calculateDuration('10:00', '12:00')).toBe('2h');
      expect(calendar.calculateDuration('10:00', '10:30')).toBe('30min');
      expect(calendar.calculateDuration('23:00', '01:00')).toBe('2h');
    });
  });

  describe("Calendar DOM Interaction", () => {
    /**
     * Tests for DOM manipulation functionality that handles
     * calendar display and user interface interactions.
     */
    
    beforeEach(() => {
      calendar = new CalendarViewsManager();
    });

    test("should show clock calendar", () => {
      // Test calendar visibility toggle functionality
      // This allows showing/hiding the calendar as needed
      const calendarElement = document.getElementById('clockCalendar');
      calendarElement.style.display = 'none';
      
      calendar.showClockCalendar();
      
      expect(calendarElement.style.display).toBe('block');
    });

    test("should render calendar grid", () => {
      // Test calendar grid rendering functionality
      // This creates the visual calendar structure with days and navigation
      calendar.renderClockCalendar();
      
      const titleElement = document.getElementById('currentMonthTitle');
      const daysContainer = document.getElementById('clockCalendarDays');
      
      // Check that the title contains a 4-digit year for proper display
      expect(titleElement.textContent).toMatch(/\d{4}/);
      expect(daysContainer.children.length).toBeGreaterThan(0);
    });
  });

  describe("Calendar Day Selection", () => {
    /**
     * Tests for day selection functionality that allows users
     * to choose specific dates and view corresponding schedules.
     */
    
    beforeEach(() => {
      calendar = new CalendarViewsManager();
      calendar.segments = [
        { day: 1, slots: [{ start: '06:00', end: '12:00' }] }
      ];
    });

    test("should select day correctly", () => {
      // Test day selection functionality
      // This allows users to navigate to specific dates
      calendar.selectDay(15);
      
      expect(calendar.selectedDay).toBe(15);
    });

    test("should handle day selection with data", () => {
      // Test day selection with associated prayer data
      // This enables viewing schedules for specific dates
      const dayData = { day: 1, slots: [{ start: '06:00', end: '12:00' }] };
      
      expect(() => calendar.selectDay(1, dayData)).not.toThrow();
    });
  });

  describe("Calendar Error Handling", () => {
    /**
     * Tests for error handling and edge cases that ensure
     * the calendar component remains robust and doesn't crash
     * under unusual conditions.
     */
    
    beforeEach(() => {
      calendar = new CalendarViewsManager();
    });

    test("should handle missing DOM elements gracefully", () => {
      // Test behavior when required DOM elements are missing
      // This ensures the component doesn't crash in incomplete DOM setups
      document.body.innerHTML = '';
      
      expect(() => calendar.showClockCalendar()).not.toThrow();
      expect(() => calendar.renderClockCalendar()).not.toThrow();
    });

    test("should handle invalid time formats", () => {
      // Test behavior with malformed time strings
      // This ensures the component handles bad time data gracefully
      expect(() => calendar.timeToMinutes('invalid')).toThrow();
    });
  });
});
 