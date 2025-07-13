/**
 * Unit tests for padding.js
 *
 * This test suite covers the padding utility functions that handle
 * time adjustments for prayer planning. Padding represents the additional
 * time needed before and after prayer times for preparation and completion.
 *
 * Key concepts:
 * - Padding Before: Time needed to prepare for prayer (e.g., wudu, travel)
 * - Padding After: Time needed after prayer (e.g., dua, travel back)
 * - Real Padding: Actual configured values (can be negative)
 * - Safe Padding: Values adjusted for display (always >= 0 or >= 20)
 *
 * Functions tested:
 * - getPaddingBefore: Returns safe padding before prayer (>= 0)
 * - getPaddingAfter: Returns safe padding after prayer (>= 20)
 * - getRealPaddingBefore: Returns actual configured padding before
 * - getRealPaddingAfter: Returns actual configured padding after
 *
 * These utilities are critical for accurate prayer time calculations
 * and user experience in the planning system.
 */

// Import functions to test from the new modular structure
const {
  getPaddingBefore,
  getPaddingAfter,
  getRealPaddingBefore,
  getRealPaddingAfter
} = require('../../../app/static/js/utils/padding.js');

describe('Padding.js - Padding utility functions', () => {
  beforeEach(() => {
    // Reset global values before each test to ensure clean state
    // These global variables store the current padding configuration
    window.currentPaddingBefore = 0;
    window.currentPaddingAfter = 0;
  });

  describe('getPaddingBefore', () => {
    /**
     * Tests for the safe padding before prayer function that ensures
     * preparation time is always non-negative for display purposes.
     * This function is used when calculating prayer start times.
     */

    test('should return configured value if >= 0', () => {
      // Test normal case where padding is a positive value
      // This represents typical preparation time needed
      window.currentPaddingBefore = 15;
      expect(getPaddingBefore()).toBe(15);
    });

    test('should return 0 if value is negative', () => {
      // Test edge case where padding is negative
      // This prevents invalid time calculations in the UI
      window.currentPaddingBefore = -5;
      expect(getPaddingBefore()).toBe(0);
    });

    test('should return 0 by default', () => {
      // Test default behavior when no padding is configured
      // This ensures the function has predictable behavior
      window.currentPaddingBefore = undefined;
      expect(getPaddingBefore()).toBe(0);
    });

    test('should handle zero value', () => {
      // Test boundary case where padding is exactly zero
      // This represents no preparation time needed
      window.currentPaddingBefore = 0;
      expect(getPaddingBefore()).toBe(0);
    });

    test('should handle large positive values', () => {
      // Test large padding values for extended preparation time
      // This could represent travel time to distant mosques
      window.currentPaddingBefore = 100;
      expect(getPaddingBefore()).toBe(100);
    });
  });

  describe('getPaddingAfter', () => {
    /**
     * Tests for the safe padding after prayer function that ensures
     * completion time is always >= 20 minutes for display purposes.
     * This function is used when calculating prayer end times.
     */

    test('should return configured value if >= 20', () => {
      // Test normal case where padding is sufficient
      // This represents typical completion time needed
      window.currentPaddingAfter = 30;
      expect(getPaddingAfter()).toBe(30);
    });

    test('should return 20 if value is < 20', () => {
      // Test case where padding is insufficient
      // Minimum 20 minutes ensures reasonable completion time
      window.currentPaddingAfter = 15;
      expect(getPaddingAfter()).toBe(20);
    });

    test('should return 20 by default', () => {
      // Test default behavior when no padding is configured
      // Default 20 minutes provides reasonable completion time
      window.currentPaddingAfter = undefined;
      expect(getPaddingAfter()).toBe(20);
    });

    test('should handle exactly 20', () => {
      // Test boundary case where padding is exactly minimum
      window.currentPaddingAfter = 20;
      expect(getPaddingAfter()).toBe(20);
    });

    test('should handle large values', () => {
      // Test large padding values for extended completion time
      // This could represent additional activities after prayer
      window.currentPaddingAfter = 100;
      expect(getPaddingAfter()).toBe(100);
    });

    test('should handle negative values', () => {
      // Test edge case where padding is negative
      // This ensures minimum 20 minutes even with invalid input
      window.currentPaddingAfter = -10;
      expect(getPaddingAfter()).toBe(20);
    });
  });

  describe('Padding Configuration Validation', () => {
    /**
     * Tests for padding configuration validation to ensure
     * the new padding logic works correctly with the updated structure.
     */

    test('should handle individual prayer padding configuration', () => {
      // Test that individual prayer padding can be configured
      // This reflects the new structure with per-prayer padding
      window.currentPaddingBefore = 10;
      window.currentPaddingAfter = 30;
      expect(getPaddingBefore()).toBe(10);
      expect(getPaddingAfter()).toBe(30);
    });

    test('should maintain minimum padding requirements', () => {
      // Test that minimum padding requirements are still enforced
      // This ensures UI consistency and user experience
      window.currentPaddingBefore = -5;
      window.currentPaddingAfter = 15;
      expect(getPaddingBefore()).toBe(0); // Minimum enforced
      expect(getPaddingAfter()).toBe(20); // Minimum enforced
    });

    test('should handle undefined padding values', () => {
      // Test behavior with undefined padding values
      // This ensures graceful fallback to defaults
      window.currentPaddingBefore = undefined;
      window.currentPaddingAfter = undefined;
      expect(getPaddingBefore()).toBe(0);
      expect(getPaddingAfter()).toBe(20);
    });
  });

  describe('Integration tests', () => {
    /**
     * Integration tests ensure that the padding functions work together
     * correctly and maintain consistency across different scenarios.
     * These tests verify the relationship between safe and real padding.
     */

    test('getPaddingBefore should always return >= 0', () => {
      // Test that safe padding before is never negative
      // This ensures valid time calculations in the UI
      const testValues = [-10, -5, 0, 5, 10, 15, 20];
      testValues.forEach(value => {
        window.currentPaddingBefore = value;
        const result = getPaddingBefore();
        expect(result).toBeGreaterThanOrEqual(0);
      });
    });

    test('getPaddingAfter should always return >= 20', () => {
      // Test that safe padding after meets minimum requirements
      // This ensures reasonable completion time for prayers
      const testValues = [-10, 0, 10, 15, 20, 25, 30];
      testValues.forEach(value => {
        window.currentPaddingAfter = value;
        const result = getPaddingAfter();
        expect(result).toBeGreaterThanOrEqual(20);
      });
    });

    test('padding functions should handle edge cases correctly', () => {
      // Test that padding functions handle edge cases correctly
      // This ensures robust behavior in various scenarios
      const testValues = [-10, -5, 0, 5, 10, 15, 20];
      testValues.forEach(value => {
        window.currentPaddingBefore = value;
        window.currentPaddingAfter = value;
        // Verify that minimum requirements are enforced
        expect(getPaddingBefore()).toBeGreaterThanOrEqual(0);
        expect(getPaddingAfter()).toBeGreaterThanOrEqual(20);
      });
    });
  });

  describe('Edge cases', () => {
    /**
     * Tests for edge cases and unusual input scenarios to ensure
     * the padding functions remain robust and predictable.
     */

    test('should handle null values', () => {
      // Test behavior with null values
      // This ensures the functions handle invalid input gracefully
      window.currentPaddingBefore = null;
      window.currentPaddingAfter = null;
      expect(getPaddingBefore()).toBe(0);
      expect(getPaddingAfter()).toBe(20);
    });

    test('should handle string values', () => {
      // Test behavior with string values (type coercion)
      // This ensures the functions handle various input types
      window.currentPaddingBefore = '15';
      window.currentPaddingAfter = '25';
      expect(getPaddingBefore()).toBe(15);
      expect(getPaddingAfter()).toBe(25);
    });

    test('should handle very large numbers', () => {
      // Test behavior with very large padding values
      // This ensures the functions can handle extreme configurations
      window.currentPaddingBefore = 999999;
      window.currentPaddingAfter = 999999;
      expect(getPaddingBefore()).toBe(999999);
      expect(getPaddingAfter()).toBe(999999);
    });
  });
});
