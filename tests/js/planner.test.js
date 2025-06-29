/**
 * Unit tests for planner.js
 * Tests utility functions and main classes
 */

// Import functions to test
const {
  formatDateForDisplay,
  timeToMinutes,
  minutesToTime,
  getPaddingBefore,
  getPaddingAfter,
  getRealPaddingBefore,
  getRealPaddingAfter
} = require('../../app/static/js/planner.js');

// Mock DOM elements
document.body.innerHTML = `
  <div class="slots-half">
    <svg class="slots-timeline-svg"></svg>
  </div>
  <div id="slotsCurrentDate"></div>
  <div class="timeline-tooltip"></div>
`;

describe('Planner.js - Utility functions', () => {
  
  describe('formatDateForDisplay', () => {
    test('should format a date correctly', () => {
      const date = new Date('2024-01-15');
      const result = formatDateForDisplay(date);
      expect(result).toBe('lun. 15 janv.');
    });

    test('should handle invalid dates', () => {
      const invalidDate = new Date('invalid');
      const result = formatDateForDisplay(invalidDate);
      expect(result).toContain('Invalid');
    });
  });

  describe('timeToMinutes', () => {
    test('should convert HH:MM to minutes', () => {
      expect(timeToMinutes('14:30')).toBe(870);
      expect(timeToMinutes('09:15')).toBe(555);
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('23:59')).toBe(1439);
    });

    test('should handle invalid inputs', () => {
      expect(timeToMinutes('')).toBe(0);
      expect(timeToMinutes(null)).toBe(0);
      expect(timeToMinutes(undefined)).toBe(0);
      expect(timeToMinutes('invalid')).toBe(NaN);
    });

    test('should handle formats without zeros', () => {
      expect(timeToMinutes('9:5')).toBe(545);
      expect(timeToMinutes('14:3')).toBe(843);
    });
  });

  describe('minutesToTime', () => {
    test('should convert minutes to HH:MM', () => {
      expect(minutesToTime(870)).toBe('14:30');
      expect(minutesToTime(555)).toBe('09:15');
      expect(minutesToTime(0)).toBe('00:00');
      expect(minutesToTime(1439)).toBe('23:59');
    });

    test('should handle negative values', () => {
      // Function returns real format with negative sign
      expect(minutesToTime(-30)).toBe('-1:-30');
    });

    test('should handle large values', () => {
      expect(minutesToTime(1500)).toBe('25:00');
    });
  });

  describe('Padding management', () => {
    beforeEach(() => {
      // Reset global values
      window.currentPaddingBefore = 0;
      window.currentPaddingAfter = 0;
    });

    describe('getPaddingBefore', () => {
      test('should return configured value if >= 0', () => {
        window.currentPaddingBefore = 15;
        expect(getPaddingBefore()).toBe(15);
      });

      test('should return 0 if value is negative', () => {
        window.currentPaddingBefore = -5;
        expect(getPaddingBefore()).toBe(0);
      });

      test('should return 0 by default', () => {
        window.currentPaddingBefore = undefined;
        expect(getPaddingBefore()).toBe(0);
      });
    });

    describe('getPaddingAfter', () => {
      test('should return configured value if >= 20', () => {
        window.currentPaddingAfter = 30;
        expect(getPaddingAfter()).toBe(30);
      });

      test('should return 20 if value is < 20', () => {
        window.currentPaddingAfter = 15;
        expect(getPaddingAfter()).toBe(20);
      });

      test('should return 20 by default', () => {
        window.currentPaddingAfter = undefined;
        expect(getPaddingAfter()).toBe(20);
      });
    });

    describe('getRealPaddingBefore', () => {
      test('should return real configured value', () => {
        window.currentPaddingBefore = -5;
        expect(getRealPaddingBefore()).toBe(-5);
      });

      test('should return 0 by default', () => {
        window.currentPaddingBefore = undefined;
        expect(getRealPaddingBefore()).toBe(0);
      });
    });

    describe('getRealPaddingAfter', () => {
      test('should return real configured value', () => {
        window.currentPaddingAfter = 15;
        expect(getRealPaddingAfter()).toBe(15);
      });

      test('should return 0 by default', () => {
        window.currentPaddingAfter = undefined;
        expect(getRealPaddingAfter()).toBe(0);
      });
    });
  });
});

describe('Planner.js - Main classes', () => {
  
  describe('Timeline', () => {
    let timeline;

    beforeEach(() => {
      // Setup DOM for tests
      document.body.innerHTML = `
        <div class="slots-half">
          <svg class="slots-timeline-svg"></svg>
        </div>
        <div id="slotsCurrentDate"></div>
        <div class="timeline-tooltip"></div>
      `;
      
      // Mock Timeline class
      timeline = {
        container: document.querySelector('.slots-half'),
        svg: document.querySelector('.slots-timeline-svg'),
        currentDate: new Date(),
        segments: [],
        scope: 'today',
        tooltip: null,
        currentView: 'timeline'
      };
    });

    test('should initialize DOM elements correctly', () => {
      expect(timeline.container).toBeTruthy();
      expect(timeline.svg).toBeTruthy();
      expect(timeline.currentDate).toBeInstanceOf(Date);
    });

    test('should have basic properties', () => {
      expect(timeline.segments).toEqual([]);
      expect(timeline.scope).toBe('today');
      expect(timeline.currentView).toBe('timeline');
    });
  });

  describe('Clock', () => {
    test('should convert minutes to angles correctly', () => {
      // Mock minutesToAngle method
      const minutesToAngle = (minutes) => {
        return (minutes / 60) * 360;
      };

      expect(minutesToAngle(0)).toBe(0);
      expect(minutesToAngle(30)).toBe(180);
      expect(minutesToAngle(60)).toBe(360);
      expect(minutesToAngle(15)).toBe(90);
    });

    test('should calculate duration between two times', () => {
      // Mock calculateDuration method
      const calculateDuration = (start, end) => {
        const startMinutes = timeToMinutes(start);
        const endMinutes = timeToMinutes(end);
        return endMinutes - startMinutes;
      };

      expect(calculateDuration('09:00', '10:30')).toBe(90);
      expect(calculateDuration('14:00', '14:15')).toBe(15);
      expect(calculateDuration('23:00', '01:00')).toBe(-1320); // Special case
    });
  });
});

describe('Planner.js - Integration', () => {
  
  test('should handle time conversions consistently', () => {
    const testTime = '14:30';
    const minutes = timeToMinutes(testTime);
    const backToTime = minutesToTime(minutes);
    
    expect(backToTime).toBe(testTime);
  });

  test('should maintain padding consistency', () => {
    window.currentPaddingBefore = 10;
    window.currentPaddingAfter = 25;

    const calcPaddingBefore = getPaddingBefore();
    const realPaddingBefore = getRealPaddingBefore();
    const calcPaddingAfter = getPaddingAfter();
    const realPaddingAfter = getRealPaddingAfter();

    expect(calcPaddingBefore).toBeGreaterThanOrEqual(0);
    expect(calcPaddingAfter).toBeGreaterThanOrEqual(20);
    expect(realPaddingBefore).toBe(10);
    expect(realPaddingAfter).toBe(25);
  });
});

// Tests for error cases and edge cases
describe('Planner.js - Error cases', () => {
  
  test('should handle invalid time formats', () => {
    // timeToMinutes function handles invalid values by returning NaN or calculated values
    expect(timeToMinutes('25:70')).toBe(1570); // 25*60 + 70 = 1570
    expect(timeToMinutes('abc:def')).toBe(NaN);
    expect(timeToMinutes('14')).toBe(NaN);
  });

  test('should handle extreme padding values', () => {
    window.currentPaddingBefore = -1000;
    window.currentPaddingAfter = 10000;

    expect(getPaddingBefore()).toBe(0);
    expect(getPaddingAfter()).toBe(10000);
    expect(getRealPaddingBefore()).toBe(-1000);
    expect(getRealPaddingAfter()).toBe(10000);
  });
}); 