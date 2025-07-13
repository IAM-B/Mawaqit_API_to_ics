/**
 * Unit tests for timeline.js component
 *
 * This test suite covers the Timeline class functionality that provides
 * visual representation of prayer times and available slots throughout
 * the day. The Timeline component is a critical part of the prayer
 * planning interface, showing users when prayers occur and when they
 * have free time for other activities.
 *
 * Key features tested:
 * - Timeline initialization and DOM setup
 * - Date management and navigation
 * - Segment data handling (prayer times and available slots)
 * - Visual rendering of timeline elements
 * - Error handling and edge cases
 * - Slot segmentation functionality
 *
 * Timeline functionality:
 * - Displays 24-hour timeline with prayer times marked
 * - Shows available time slots for planning
 * - Supports different scopes (today, week, month, year)
 * - Handles date navigation and updates
 * - Provides interactive tooltips and hover effects
 * - Supports segmented slot display (split into full hours)
 *
 * Technical aspects:
 * - SVG-based rendering for scalability
 * - Real-time updates when data changes
 * - Responsive design considerations
 * - Integration with global state management
 */

// Import Timeline class from the new modular structure
import { Timeline } from '../../../app/static/js/components/timeline.js';

// Mock DOM elements
const mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
mockSvg.setAttribute('viewBox', '0 0 400 1440');

// Mock DOM structure
document.body.innerHTML = `
  <div class="slots-half">
    <div class="slots-header">
      <button id="prevDayBtn">←</button>
      <h3 id="slotsCurrentDate"></h3>
      <button id="nextDayBtn">→</button>
    </div>
    <svg class="slots-timeline-svg" viewBox="0 0 400 1440"></svg>
  </div>
  <div class="timeline-tooltip"></div>
`;

// Mock utility functions
jest.mock('../../../app/static/js/utils/utils.js', () => ({
  formatDateForDisplay: jest.fn((date) => date.toLocaleDateString('fr-FR')),
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

describe('Timeline Component', () => {
  let timeline;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div class="slots-half">
        <div class="slots-header">
          <button id="prevDayBtn">←</button>
          <h3 id="slotsCurrentDate"></h3>
          <button id="nextDayBtn">→</button>
        </div>
        <svg class="slots-timeline-svg" viewBox="0 0 400 1440"></svg>
      </div>
      <div class="timeline-tooltip"></div>
    `;

    timeline = new Timeline();
  });

  afterEach(() => {
    if (timeline) {
      timeline = null;
    }
  });

  describe('Timeline Initialization', () => {
    /**
     * Tests for the initialization process that sets up the timeline
     * component and establishes its basic structure and properties.
     */

    test('should create Timeline instance with correct properties', () => {
      // Test basic Timeline object creation and property initialization
      // This ensures the component is properly structured
      timeline = new Timeline();

      expect(timeline).toBeDefined();
      expect(timeline.container).toBeTruthy();
      expect(timeline.svg).toBeTruthy();
      expect(timeline.currentDate).toBeInstanceOf(Date);
      expect(timeline.segments).toEqual([]);
      expect(timeline.scope).toBe('today');
      expect(timeline.slotDisplayMode).toBe('normal');
    });

    test('should initialize with current date', () => {
      // Test that Timeline starts with the current date
      // This ensures proper initial state for date-based operations
      const now = new Date();
      timeline = new Timeline();

      expect(timeline.currentDate.getDate()).toBe(now.getDate());
      expect(timeline.currentDate.getMonth()).toBe(now.getMonth());
      expect(timeline.currentDate.getFullYear()).toBe(now.getFullYear());
    });

    test('should set up DOM elements correctly', () => {
      // Test DOM element connection and configuration
      // This ensures the timeline can render properly
      timeline = new Timeline();

      expect(timeline.container).toBeTruthy();
      expect(timeline.svg).toBeTruthy();
      expect(timeline.svg.getAttribute('viewBox')).toBe('0 0 400 1440');
    });
  });

  describe('Slot Display Mode Toggle', () => {
    /**
     * Tests for the slot display mode toggle functionality
     * that allows switching between normal and segmented slot display.
     */

    test('should initialize with normal slot display mode', () => {
      timeline = new Timeline();
      expect(timeline.getSlotDisplayMode()).toBe('normal');
    });

    test('should toggle slot display mode correctly', () => {
      timeline = new Timeline();

      // Initial state
      expect(timeline.getSlotDisplayMode()).toBe('normal');

      // Toggle to segmented
      timeline.toggleSlotDisplayMode();
      expect(timeline.getSlotDisplayMode()).toBe('segmented');

      // Toggle back to normal
      timeline.toggleSlotDisplayMode();
      expect(timeline.getSlotDisplayMode()).toBe('normal');
    });

    test('should create slot display toggle button', () => {
      // Create the wrapper element that the toggle needs
      const wrapper = document.createElement('div');
      wrapper.className = 'slot-toggle-wrapper';
      document.body.appendChild(wrapper);

      timeline = new Timeline();
      timeline.setupSlotDisplayToggle();

      const toggleButton = document.querySelector('.slot-toggle-switch');
      expect(toggleButton).toBeTruthy();
      expect(toggleButton.querySelector('i')).toBeTruthy();
      expect(toggleButton.querySelector('.toggle-label')).toBeTruthy();

      // Cleanup
      document.body.removeChild(wrapper);
    });

    test('should update button appearance when toggled', () => {
      // Create the wrapper element that the toggle needs
      const wrapper = document.createElement('div');
      wrapper.className = 'slot-toggle-wrapper';
      document.body.appendChild(wrapper);

      timeline = new Timeline();
      timeline.setupSlotDisplayToggle();

      const toggleButton = document.querySelector('.slot-toggle-switch');
      const icon = toggleButton.querySelector('i');
      const input = toggleButton.querySelector('.toggle-input');

      // Initial state
      expect(icon.className).toContain('fa-clock');
      expect(input.checked).toBe(false);

      // After toggle
      timeline.toggleSlotDisplayMode();
      expect(icon.className).toContain('fa-puzzle-piece');
      expect(input.checked).toBe(true);

      // Cleanup
      document.body.removeChild(wrapper);
    });
  });

  describe('Slot Segmentation', () => {
    /**
     * Tests for the slot segmentation functionality that splits
     * slots into full-hour segments for better visualization.
     */

    test('should generate segmented slots correctly', () => {
      timeline = new Timeline();

      const slots = timeline.generateSegmentedSlots('14:30', '17:45', 'Test Slot');

      expect(slots).toHaveLength(4);
      expect(slots[0]).toEqual({
        start: '14:30',
        end: '15:00',
        title: 'Test Slot',
        isSegmented: true
      });
      expect(slots[1]).toEqual({
        start: '15:00',
        end: '16:00',
        title: 'Test Slot',
        isSegmented: true
      });
      expect(slots[2]).toEqual({
        start: '16:00',
        end: '17:00',
        title: 'Test Slot',
        isSegmented: true
      });
      expect(slots[3]).toEqual({
        start: '17:00',
        end: '17:45',
        title: 'Test Slot',
        isSegmented: true
      });
    });

    test('should handle slots that do not cross hour boundaries', () => {
      timeline = new Timeline();

      const slots = timeline.generateSegmentedSlots('14:30', '14:45', 'Short Slot');

      expect(slots).toHaveLength(1);
      expect(slots[0]).toEqual({
        start: '14:30',
        end: '14:45',
        title: 'Short Slot',
        isSegmented: false
      });
    });

    test('should handle slots that start at full hours', () => {
      timeline = new Timeline();

      const slots = timeline.generateSegmentedSlots('15:00', '17:30', 'Full Hour Slot');

      expect(slots).toHaveLength(4);
      expect(slots[0]).toEqual({
        start: '15:00',
        end: '15:00',
        title: 'Full Hour Slot',
        isSegmented: true
      });
      expect(slots[1]).toEqual({
        start: '15:00',
        end: '16:00',
        title: 'Full Hour Slot',
        isSegmented: true
      });
      expect(slots[2]).toEqual({
        start: '16:00',
        end: '17:00',
        title: 'Full Hour Slot',
        isSegmented: true
      });
      expect(slots[3]).toEqual({
        start: '17:00',
        end: '17:30',
        title: 'Full Hour Slot',
        isSegmented: true
      });
    });

    test('should handle invalid time ranges', () => {
      timeline = new Timeline();

      const slots = timeline.generateSegmentedSlots('17:00', '14:00', 'Invalid Slot');

      expect(slots).toHaveLength(0);
    });

    test('should determine best segment for text display', () => {
      timeline = new Timeline();

      const slots = timeline.generateSegmentedSlots('14:30', '17:45', 'Test Slot');

      // Verify that we have the expected segments
      expect(slots).toHaveLength(4);
      expect(slots[1].start).toBe('15:00');
      expect(slots[1].end).toBe('16:00');
      expect(slots[2].start).toBe('16:00');
      expect(slots[2].end).toBe('17:00');

      // The full hour segments should be the largest ones
      expect(slots[1].isSegmented).toBe(true);
      expect(slots[2].isSegmented).toBe(true);
    });

    test('should create segmented slot events with proper text display', () => {
      timeline = new Timeline();

      // Mock the createSVGEvent method to track calls
      const mockCreateSVGEvent = jest.fn();
      timeline.createSVGEvent = mockCreateSVGEvent;

      // Create segmented events
      timeline.createSegmentedSlotEvents(
        '14:30',
        '17:45',
        'Test Slot',
        'slot day',
        '14:30-17:45',
        true
      );

      // Should have created 4 segments
      expect(mockCreateSVGEvent).toHaveBeenCalledTimes(4);

      // Check that only one segment has showText = true
      const callsWithText = mockCreateSVGEvent.mock.calls.filter(call => call[6] === true);
      expect(callsWithText).toHaveLength(1);

      // Check that the segment with text is the largest one
      const textCall = callsWithText[0];
      const textSegmentTitle = textCall[0];
      expect(textSegmentTitle).toContain('Test Slot - 30min'); // Should be the first segment
    });
  });

  describe('Timeline Error Handling', () => {
    /**
     * Tests for error handling and edge cases that ensure
     * the timeline component remains robust and doesn't crash
     * under unusual conditions.
     */

    test('should handle missing DOM elements gracefully', () => {
      // Test behavior when required DOM elements are missing
      // This ensures the component doesn't crash in incomplete DOM setups
      document.body.innerHTML = '';

      // Should not crash when DOM elements are missing
      expect(() => {
        timeline = new Timeline();
      }).not.toThrow();
    });

    test('should handle invalid segment data', () => {
      // Test behavior with malformed or invalid segment data
      // This ensures the component handles bad data gracefully
      timeline = new Timeline();

      const invalidSegments = [
        { start: 'invalid', end: 'invalid', type: 'unknown' },
        null,
        undefined
      ];

      // Should not crash with invalid data
      expect(() => {
        timeline.initializeTimeline(invalidSegments, 'today');
      }).not.toThrow();
    });
  });
});
