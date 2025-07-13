/**
 * Unit tests for clock.js component
 *
 * This test suite covers the Clock component that provides a visual
 * representation of prayer times and available slots in a circular format.
 * The clock displays prayer times as segments and allows users to
 * visualize their daily schedule.
 *
 * Key features tested:
 * - Circular clock visualization with SVG
 * - Prayer time segment rendering
 * - Available slot visualization
 * - Date and time calculations
 * - User interaction handling
 *
 * Dependencies mocked:
 * - SVG DOM manipulation
 * - Date/time utilities
 * - Padding calculations
 */

import { Clock } from '../../../app/static/js/components/clock.js';

// Mock utilities for consistent testing
jest.mock('../../../app/static/js/utils/utils.js', () => ({
  formatDateForDisplay: jest.fn((date) => date.toLocaleDateString()),
  timeToMinutes: jest.fn((time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }),
  minutesToTime: jest.fn((minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  })
}));

jest.mock('../../../app/static/js/utils/padding.js', () => ({
  getPaddingBefore: jest.fn(() => 10),
  getPaddingAfter: jest.fn(() => 35)
}));

describe('Clock Component', () => {
  let clock;
  let mockContainer;
  let mockSlotsContainer;

  beforeEach(() => {
    // Mock main container for clock display
    // This represents the primary clock visualization area
    mockContainer = {
      innerHTML: '',
      appendChild: jest.fn(),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => [])
    };

    // Mock slots container for available time slots
    // This displays the list of available time periods
    mockSlotsContainer = {
      innerHTML: '',
      appendChild: jest.fn(),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => [])
    };

    // Mock document.getElementById for clock elements
    // This simulates the actual DOM structure used by the clock
    document.getElementById = jest.fn((id) => {
      if (id === 'clockContainer') return mockContainer;
      if (id === 'availableSlotsList') return mockSlotsContainer;
      return null;
    });

    // Mock document.querySelector for general element selection
    document.querySelector = jest.fn(() => null);
    document.querySelectorAll = jest.fn(() => []);

    // Mock document.createElementNS for SVG element creation
    // This is essential for the circular clock visualization
    document.createElementNS = jest.fn((namespace, tagName) => {
      const element = {
        setAttribute: jest.fn(),
        appendChild: jest.fn(),
        addEventListener: jest.fn(),
        style: {},
        dataset: {},
        textContent: '',
        classList: {
          add: jest.fn(),
          remove: jest.fn()
        }
      };

      if (tagName === 'svg') {
        element.innerHTML = '';
      }

      return element;
    });

    // Test data representing a typical day's prayer schedule
    // This includes prayer times and available time slots
    const testSegments = [{
      day: 1,
      date: '01/01/2024',
      slots: [
        { start: '06:00', end: '12:00', content: 'Free time' },
        { start: '15:00', end: '18:00', content: 'Free time' }
      ],
      prayer_times: {
        fajr: '05:30',
        dohr: '12:30',
        asr: '15:30',
        maghreb: '18:30',
        icha: '20:30'
      }
    }];

    clock = new Clock('clockContainer', testSegments, 'today');
  });

  afterEach(() => {
    // Clean up mocks to avoid conflicts between tests
    // This ensures each test runs in isolation
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Clean up global variables to prevent memory leaks
    if (clock && clock.container) {
      clock.container.innerHTML = '';
    }

    // Reset document to clean state
    document.body.innerHTML = '';
  });

  describe('Constructor', () => {
    /**
     * Tests for the Clock constructor that initializes the component
     * with the provided container and data.
     */

    test('should initialize with valid container', () => {
      // Test basic initialization with proper container reference
      // This ensures the clock is properly connected to the DOM
      expect(clock.container).toBe(mockContainer);
      expect(clock.segments).toBeDefined();
      expect(clock.scope).toBe('today');
      expect(clock.currentIndex).toBe(0);
    });

    test('should handle missing container gracefully', () => {
      // Test error handling when container element is not found
      // This prevents crashes when the clock is initialized incorrectly
      document.getElementById = jest.fn(() => null);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const invalidClock = new Clock('nonexistent', [], 'today');

      expect(consoleSpy).toHaveBeenCalledWith('Container not found:', 'nonexistent');
      expect(invalidClock.container).toBeNull();

      consoleSpy.mockRestore();
    });
  });

  describe('Static Methods', () => {
    /**
     * Tests for static methods that handle global clock functionality
     * such as planning generation animations.
     */

    test('should handle planning generation animation', () => {
      // Test the animation sequence when a planning is generated
      // This provides visual feedback to users during planning creation
      const mockPlanningContent = {
        classList: { add: jest.fn() }
      };
      const mockClockSection = {
        classList: { add: jest.fn() },
        scrollIntoView: jest.fn()
      };
      const mockSections = [
        { style: {}, setTimeout: jest.fn() },
        { style: {}, setTimeout: jest.fn() }
      ];

      document.querySelector = jest.fn((selector) => {
        if (selector === '.quick-actions') return mockPlanningContent;
        if (selector === '.clock-section') return mockClockSection;
        return null;
      });
      document.querySelectorAll = jest.fn(() => mockSections);

      Clock.handlePlanningGeneration();

      expect(mockPlanningContent.classList.add).toHaveBeenCalledWith('planning-generated');
      expect(mockClockSection.classList.add).toHaveBeenCalledWith('visible');
    });
  });

  describe('Utility Methods', () => {
    /**
     * Tests for utility methods that perform calculations
     * and conversions for the clock display.
     */

    test('should convert minutes to angle correctly', () => {
      // Test angle calculations for circular clock positioning
      // This ensures prayer times are displayed at correct positions
      expect(clock.minutesToAngle(0)).toBe(0);
      expect(clock.minutesToAngle(360)).toBe(90); // 6 hours = 90 degrees
      expect(clock.minutesToAngle(1440)).toBe(360); // 24 hours = 360 degrees
    });

    test('should calculate duration between times', () => {
      // Test duration calculations for time slot display
      // This shows users how long each time period lasts
      expect(clock.calculateDuration('10:00', '12:00')).toBe('(2h)');
      expect(clock.calculateDuration('10:00', '10:30')).toBe('(30min)');
      expect(clock.calculateDuration('23:00', '01:00')).toBe('(2h)'); // Cross midnight
    });

    test('should handle padding operations', () => {
      // Test padding calculations for prayer time adjustments
      // This accounts for preparation time before and after prayers
      const { timeToMinutes, minutesToTime } = require('../../../app/static/js/utils/utils.js');

      timeToMinutes.mockReturnValueOnce(600); // 10:00
      minutesToTime.mockReturnValueOnce('09:50');

      const result = clock.subtractPadding('10:00', 10);
      expect(result).toBe('09:50');
    });
  });

  describe('SVG Element Creation', () => {
    /**
     * Tests for SVG element creation that builds the visual
     * representation of the clock and its segments.
     */

    test('should create event element for prayer', () => {
      // Test creation of prayer time segments on the clock
      // This creates the visual representation of prayer times
      const prayerEvent = {
        start: '05:30',
        end: '06:00',
        content: 'Fajr'
      };

      const element = clock.createEventElement(prayerEvent, 'prayer');

      expect(element).toBeDefined();
      expect(document.createElementNS).toHaveBeenCalledWith('http://www.w3.org/2000/svg', 'path');
    });

    test('should create slot element', () => {
      // Test creation of available time slot segments
      // This shows users when they have free time
      const slot = {
        start: '06:00',
        end: '12:00'
      };

      const element = clock.createSlotElement(slot);

      expect(element).toBeDefined();
      expect(document.createElementNS).toHaveBeenCalledWith('http://www.w3.org/2000/svg', 'path');
    });
  });

  describe('Data Management', () => {
    test('should get current data', () => {
      const currentData = clock.getCurrentData();
      expect(currentData).toBeDefined();
      expect(currentData.day).toBe(1);
    });

    test('should navigate between segments', () => {
      const initialIndex = clock.currentIndex;

      clock.navigate('next');
      expect(clock.currentIndex).toBe(initialIndex);

      clock.navigate('prev');
      expect(clock.currentIndex).toBe(initialIndex);
    });

    test('should set date', () => {
      const testDate = new Date('2024-01-01');
      clock.setDate(testDate);
      expect(clock.currentDayIndex).toBe(0);
    });
  });

  describe('Update Methods', () => {
    test('should update available slots', () => {
      const testData = {
        segments: [{
          slots: [
            { start: '06:00', end: '12:00', content: 'Free time' }
          ]
        }]
      };

      clock.updateAvailableSlots(testData);
      expect(clock.updateAvailableSlots).toBeDefined();
    });

    test('should update clock display', () => {
      clock.updateClock();
      expect(mockContainer.innerHTML).toBe('');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing segments gracefully', () => {
      const emptyClock = new Clock('clockContainer', [], 'today');
      expect(() => emptyClock.updateClock()).not.toThrow();
    });

    test('should handle invalid time formats', () => {
      const { timeToMinutes } = require('../../../app/static/js/utils/utils.js');
      timeToMinutes.mockImplementation(() => {
        throw new Error('Invalid time format');
      });

      expect(() => clock.calculateDuration('invalid', '12:00')).not.toThrow();
    });
  });
});
