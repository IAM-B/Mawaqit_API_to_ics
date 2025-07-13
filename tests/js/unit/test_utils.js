/**
 * Unit tests for utils.js
 *
 * This test suite covers the utility functions used throughout the application
 * for date and time formatting, conversion, and manipulation.
 *
 * Functions tested:
 * - formatDateForDisplay: Formats dates for user-friendly display
 * - timeToMinutes: Converts time strings (HH:MM) to minutes
 * - minutesToTime: Converts minutes back to time strings (HH:MM)
 *
 * These utilities are critical for the prayer planning functionality
 * and must handle various edge cases and invalid inputs gracefully.
 */

// Import functions to test from the new modular structure
const {
  formatDateForDisplay,
  timeToMinutes,
  minutesToTime
} = require('../../../app/static/js/utils/utils.js');

describe('Utils.js - Utility functions', () => {
  describe('formatDateForDisplay', () => {
    /**
     * Tests the date formatting function that converts Date objects
     * to user-friendly French date strings (e.g., "lun. 15 janv.")
     * This is used throughout the UI to display dates consistently.
     */

    test('should format a date correctly with French abbreviations', () => {
      // Test a standard date to ensure proper French formatting
      const date = new Date('2024-01-15');
      const result = formatDateForDisplay(date);
      expect(result).toBe('lun. 15 janv.');
    });

    test('should handle invalid dates gracefully with error message', () => {
      // Test that invalid dates don't crash the application
      // and return a meaningful error message
      const invalidDate = new Date('invalid');
      const result = formatDateForDisplay(invalidDate);
      expect(result).toContain('Invalid');
    });

    test('should format different months correctly with proper French names', () => {
      // Test various months to ensure all French month abbreviations work
      const date1 = new Date('2024-03-20');
      const date2 = new Date('2024-12-25');
      expect(formatDateForDisplay(date1)).toBe('mer. 20 mars');
      expect(formatDateForDisplay(date2)).toBe('mer. 25 déc.');
    });

    test('should handle different weekdays with correct French abbreviations', () => {
      // Test different days of the week to ensure proper French day names
      const monday = new Date('2024-01-15'); // Monday
      const friday = new Date('2024-01-19'); // Friday
      expect(formatDateForDisplay(monday)).toBe('lun. 15 janv.');
      expect(formatDateForDisplay(friday)).toBe('ven. 19 janv.');
    });
  });

  describe('timeToMinutes', () => {
    /**
     * Tests the time conversion function that converts time strings (HH:MM)
     * to total minutes since midnight. This is essential for time calculations
     * in the prayer planning system.
     */

    test('should convert HH:MM format to total minutes since midnight', () => {
      // Test various times to ensure accurate minute calculations
      expect(timeToMinutes('14:30')).toBe(870); // 14h30 = 14*60 + 30 = 870 minutes
      expect(timeToMinutes('09:15')).toBe(555); // 9h15 = 9*60 + 15 = 555 minutes
      expect(timeToMinutes('00:00')).toBe(0); // Midnight = 0 minutes
      expect(timeToMinutes('23:59')).toBe(1439); // 23h59 = 23*60 + 59 = 1439 minutes
    });

    test('should handle invalid inputs gracefully with fallback values', () => {
      // Test edge cases to ensure the function doesn't crash
      // and returns sensible default values
      expect(timeToMinutes('')).toBe(0); // Empty string defaults to 0
      expect(timeToMinutes(null)).toBe(0); // Null defaults to 0
      expect(timeToMinutes(undefined)).toBe(0); // Undefined defaults to 0
      expect(timeToMinutes('invalid')).toBe(NaN); // Invalid format returns NaN
    });

    test('should handle time formats without leading zeros', () => {
      // Test flexible input formats that users might enter
      expect(timeToMinutes('9:5')).toBe(545); // 9h05 = 545 minutes
      expect(timeToMinutes('14:3')).toBe(843); // 14h03 = 843 minutes
    });

    test('should handle edge cases and boundary conditions', () => {
      // Test boundary conditions and edge cases
      expect(timeToMinutes('0:0')).toBe(0); // Zero time
      expect(timeToMinutes('24:0')).toBe(1440); // 24 hours (next day)
      expect(timeToMinutes('12:30')).toBe(750); // Noon
    });
  });

  describe('minutesToTime', () => {
    /**
     * Tests the reverse conversion function that converts total minutes
     * back to HH:MM format. This is used for displaying calculated times
     * in the user interface.
     */

    test('should convert total minutes back to HH:MM format', () => {
      // Test reverse conversion to ensure consistency
      expect(minutesToTime(870)).toBe('14:30'); // 870 minutes = 14h30
      expect(minutesToTime(555)).toBe('09:15'); // 555 minutes = 9h15
      expect(minutesToTime(0)).toBe('00:00'); // 0 minutes = 00h00
      expect(minutesToTime(1439)).toBe('23:59'); // 1439 minutes = 23h59
    });

    test('should handle negative values for time adjustments', () => {
      // Test negative values which can occur during time calculations
      // (e.g., when subtracting padding from prayer times)
      expect(minutesToTime(-30)).toBe('-00:30'); // Negative 30 minutes
      expect(minutesToTime(-60)).toBe('-01:00'); // Negative 1 hour
      expect(minutesToTime(-90)).toBe('-01:30'); // Negative 1.5 hours
    });

    test('should handle large values that exceed 24 hours', () => {
      // Test values beyond 24 hours which can occur in calculations
      expect(minutesToTime(1500)).toBe('25:00'); // 25 hours
      expect(minutesToTime(2880)).toBe('48:00'); // 48 hours (2 days)
    });

    test('should handle edge cases and small time values', () => {
      // Test small values and edge cases
      expect(minutesToTime(30)).toBe('00:30'); // 30 minutes
      expect(minutesToTime(60)).toBe('01:00'); // 1 hour
      expect(minutesToTime(90)).toBe('01:30'); // 1.5 hours
    });
  });

  describe('Integration tests', () => {
    /**
     * Integration tests ensure that the time conversion functions
     * work together correctly and maintain mathematical consistency.
     * These tests verify that converting back and forth between
     * time formats preserves the original values.
     */

    test('timeToMinutes and minutesToTime should be inverse functions', () => {
      // Test that the functions are mathematical inverses
      // This ensures data integrity in the prayer planning system
      const testTimes = ['14:30', '09:15', '00:00', '23:59', '12:30'];
      testTimes.forEach(time => {
        const minutes = timeToMinutes(time);
        const backToTime = minutesToTime(minutes);
        expect(backToTime).toBe(time);
      });
    });

    test('should handle round-trip conversion with edge cases', () => {
      // Test round-trip conversion with various minute values
      // including edge cases to ensure robustness
      const testMinutes = [0, 30, 60, 90, 750, 870, 1439];
      testMinutes.forEach(minutes => {
        const time = minutesToTime(minutes);
        const backToMinutes = timeToMinutes(time);
        expect(backToMinutes).toBe(minutes);
      });
    });
  });
});
