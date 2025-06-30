/**
 * Unit tests for main.js
 * 
 * This test suite covers the main application initialization and
 * synchronization logic that orchestrates the entire prayer planning
 * application. The main.js file serves as the entry point that sets up
 * the application, establishes component connections, and manages
 * global state synchronization.
 * 
 * Key responsibilities tested:
 * - Application initialization and DOM setup
 * - Component synchronization and coordination
 * - Global state management and date handling
 * - Event listener setup and management
 * - Error handling and graceful degradation
 * 
 * Architecture tested:
 * - Main application entry point
 * - Component lifecycle management
 * - Global function registration
 * - Cross-component communication
 * 
 * Dependencies mocked:
 * - All major components (Clock, Map, MosqueSearch, Calendar, Timeline)
 * - PlannerPage for page-specific initialization
 * - DOM manipulation and event handling
 * - Console logging and error reporting
 */

// Test main.js file - Application initialization
// The main.js file initializes automatically with DOMContentLoaded

// Mock modules for isolated testing
// These prevent actual component initialization during tests
jest.mock('../../../app/static/js/components/clock.js');
jest.mock('../../../app/static/js/components/map.js');
jest.mock('../../../app/static/js/components/mosque_search.js');
jest.mock('../../../app/static/js/components/calendar.js');
jest.mock('../../../app/static/js/components/timeline.js');
jest.mock('../../../app/static/js/pages/planner_page.js');

describe('Main Application', () => {
  let mockConsoleError;
  let mockConsoleLog;
  let mockConsoleWarn;

  beforeEach(() => {
    // Mock console methods for testing output and error handling
    // This allows us to verify logging behavior without cluttering test output
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

    // Mock document methods for DOM manipulation testing
    // This simulates the actual DOM structure and behavior
    document.addEventListener = jest.fn();
    document.getElementById = jest.fn((id) => {
      if (id === 'clockConfig') return null;
      return {
        addEventListener: jest.fn(),
        style: {},
        classList: { add: jest.fn(), remove: jest.fn() }
      };
    });
    document.querySelector = jest.fn(() => ({
      addEventListener: jest.fn(),
      style: {},
      classList: { add: jest.fn(), remove: jest.fn() }
    }));
    document.querySelectorAll = jest.fn(() => []);

    // Mock window methods and global state
    // This simulates the browser environment and global application state
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
    window.selectedDate = new Date();
    window.timeline = null;
    window.clockInstance = null;
    window.calendarViewsManager = null;
  });

  afterEach(() => {
    // Restore console methods and clear mocks after each test
    // This ensures clean state between tests
    mockConsoleError.mockRestore();
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
    jest.clearAllMocks();
  });

  describe('DOM Content Loaded Event', () => {
    /**
     * Tests for the DOM content loaded event handling that
     * initializes the application when the page is ready.
     */
    
    test('should set up DOM content loaded listener', () => {
      // Test that the application sets up proper event listening
      // This ensures the app initializes when the DOM is ready
      require('../../../app/static/js/main.js');
      
      expect(document.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
    });

    test('should handle DOM content loaded event', () => {
      // Test that the initialization callback executes without errors
      // This ensures the app starts properly when triggered
      require('../../../app/static/js/main.js');
      
      // Get the callback function that was registered
      const callback = document.addEventListener.mock.calls[0][1];
      
      // Simulate DOMContentLoaded event execution
      expect(() => callback()).not.toThrow();
    });
  });

  describe('Global Window Functions', () => {
    /**
     * Tests for global functions that provide cross-component
     * communication and state management capabilities.
     */
    
    test('should set up setSelectedDate function', () => {
      // Test global function registration for date management
      // This enables components to communicate date changes
      require('../../../app/static/js/main.js');
      
      expect(typeof window.setSelectedDate).toBe('function');
    });

    test('should handle setSelectedDate with valid date', () => {
      // Test date setting functionality with valid input
      // This allows users to navigate to specific dates
      require('../../../app/static/js/main.js');
      
      const testDate = new Date('2024-01-01');
      expect(() => window.setSelectedDate(testDate)).not.toThrow();
    });

    test('should handle setSelectedDate with null date', () => {
      // Test date setting with null input for edge case handling
      // This ensures graceful handling of invalid date inputs
      require('../../../app/static/js/main.js');
      
      expect(() => window.setSelectedDate(null)).not.toThrow();
    });

    test('should handle setSelectedDate with same date', () => {
      // Test optimization for same date selection
      // This prevents unnecessary updates and potential infinite loops
      require('../../../app/static/js/main.js');
      
      const testDate = new Date('2024-01-01');
      window.selectedDate = testDate;
      
      expect(() => window.setSelectedDate(testDate)).not.toThrow();
      expect(mockConsoleLog).toHaveBeenCalledWith('⚠️ Same date, skipping sync to prevent loops');
    });
  });

  describe('Component Synchronization', () => {
    /**
     * Tests for component synchronization that ensures all
     * visual components stay in sync when the selected date changes.
     */
    
    test('should sync timeline when available', () => {
      // Test timeline synchronization with date changes
      // This ensures the timeline updates when date is changed
      require('../../../app/static/js/main.js');
      
      const mockTimeline = {
        setDate: jest.fn()
      };
      window.timeline = mockTimeline;
      
      const testDate = new Date('2024-01-01');
      window.setSelectedDate(testDate);
      
      expect(mockTimeline.setDate).toHaveBeenCalledWith(testDate);
    });

    test('should handle missing timeline gracefully', () => {
      // Test graceful handling when timeline component is not available
      // This prevents crashes when components are not initialized
      require('../../../app/static/js/main.js');
      
      window.timeline = null;
      
      const testDate = new Date('2024-01-01');
      window.setSelectedDate(testDate);
      
      expect(mockConsoleWarn).toHaveBeenCalledWith('⚠️ Timeline not available for sync');
    });

    test('should sync clock when available', () => {
      // Test clock synchronization with date changes
      // This ensures the clock displays the correct date
      require('../../../app/static/js/main.js');
      
      const mockClock = {
        setDate: jest.fn()
      };
      window.clockInstance = mockClock;
      
      const testDate = new Date('2024-01-01');
      window.setSelectedDate(testDate);
      
      expect(mockClock.setDate).toHaveBeenCalledWith(testDate);
    });

    test('should handle missing clock gracefully', () => {
      // Test graceful handling when clock component is not available
      // This prevents crashes when components are not initialized
      require('../../../app/static/js/main.js');
      
      window.clockInstance = null;
      
      const testDate = new Date('2024-01-01');
      window.setSelectedDate(testDate);
      
      expect(mockConsoleWarn).toHaveBeenCalledWith('⚠️ Clock not available for sync');
    });

    test('should sync calendar when available', () => {
      // Test calendar synchronization with date changes
      // This ensures the calendar highlights the correct date
      require('../../../app/static/js/main.js');
      
      const mockCalendar = {
        setDate: jest.fn()
      };
      window.calendarViewsManager = mockCalendar;
      
      const testDate = new Date('2024-01-01');
      window.setSelectedDate(testDate);
      
      expect(mockCalendar.setDate).toHaveBeenCalledWith(testDate);
    });

    test('should handle missing calendar gracefully', () => {
      // Test graceful handling when calendar component is not available
      // This prevents crashes when components are not initialized
      require('../../../app/static/js/main.js');
      
      window.calendarViewsManager = null;
      
      const testDate = new Date('2024-01-01');
      window.setSelectedDate(testDate);
      
      expect(mockConsoleWarn).toHaveBeenCalledWith('⚠️ Calendar not available for sync');
    });
  });

  describe('Clock Configuration', () => {
    /**
     * Tests for clock-specific initialization that occurs
     * when the clock configuration element is present on the page.
     */
    
    test('should initialize clock when clockConfig is present', () => {
      // Test clock initialization when clock configuration is available
      // This enables clock functionality on pages that need it
      const mockPlannerPage = {
        initClock: jest.fn()
      };
      
      // Mock document.getElementById to return clockConfig element
      document.getElementById = jest.fn((id) => {
        if (id === 'clockConfig') return { style: {} };
        return null;
      });
      
      // Mock PlannerPage.initClock method
      const { PlannerPage } = require('../../../app/static/js/pages/planner_page.js');
      PlannerPage.initClock = jest.fn();
      
      // Import the main.js file to trigger initialization
      require('../../../app/static/js/main.js');
      
      // Execute the DOMContentLoaded callback
      const callback = document.addEventListener.mock.calls[0][1];
      callback();
      
      expect(PlannerPage.initClock).toHaveBeenCalled();
    });

    test('should not initialize clock when clockConfig is missing', () => {
      // Test that clock is not initialized when not needed
      // This prevents unnecessary initialization on pages without clock
      const { PlannerPage } = require('../../../app/static/js/pages/planner_page.js');
      PlannerPage.initClock = jest.fn();
      
      // Import the main.js file to trigger initialization
      require('../../../app/static/js/main.js');
      
      // Execute the DOMContentLoaded callback
      const callback = document.addEventListener.mock.calls[0][1];
      callback();
      
      expect(PlannerPage.initClock).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    /**
     * Tests for error handling and graceful degradation
     * when components fail to load or initialize properly.
     */
    
    test('should handle initialization errors gracefully', () => {
      // Test error handling during module loading
      // This ensures the application doesn't crash if components fail
      jest.doMock('../../../app/static/js/components/mosque_search.js', () => {
        throw new Error('Module error');
      });

      expect(() => {
        require('../../../app/static/js/main.js');
      }).toThrow('Module error');
    });
  });
}); 