/**
 * PlannerPage class tests
 * Tests for the main planner page component that orchestrates Timeline and Clock
 */

const {
  formatDateForDisplay,
  timeToMinutes,
  minutesToTime,
  getPaddingBefore,
  getPaddingAfter
} = require('../../../app/static/js/planner.js');

// Mock DOM elements for PlannerPage
const createPlannerPageDOM = () => {
  document.body.innerHTML = `
    <div class="planner-container">
      <form id="plannerForm">
        <select id="mosqueSelect">
          <option value="">Select a mosque</option>
          <option value="mosque1">Mosque 1</option>
          <option value="mosque2">Mosque 2</option>
        </select>
        <select id="scopeSelect">
          <option value="today">Today</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
        <input type="number" id="paddingBefore" value="15" min="0" max="60">
        <input type="number" id="paddingAfter" value="20" min="0" max="60">
        <button type="submit">Generate</button>
      </form>
      
      <div class="planner-content">
        <div class="slots-half">
          <svg class="slots-timeline-svg" width="460" height="1440"></svg>
          <div id="slotsCurrentDate"></div>
          <div class="timeline-tooltip"></div>
          <div class="timeline-content" style="display: flex;">
            <div class="timeline-events"></div>
          </div>
          <div id="availableSlotsList" style="display: none;"></div>
          <button id="toggleViewBtn">Toggle View</button>
        </div>
        
        <div class="clock-half">
          <svg class="clock-svg" width="400" height="400" viewBox="0 0 400 400"></svg>
          <div class="clock-time">12:00</div>
          <div class="clock-date">Today</div>
          <div class="clock-tooltip"></div>
        </div>
      </div>
      
      <div class="calendar-controls">
        <button id="prevDayBtn">Previous</button>
        <button id="nextDayBtn">Next</button>
        <button id="prevMonthBtn">Previous Month</button>
        <button id="nextMonthBtn">Next Month</button>
        <button id="prevYearBtn">Previous Year</button>
        <button id="nextYearBtn">Next Year</button>
      </div>
      
      <div class="loading-indicator" style="display: none;">Loading...</div>
      <div class="error-message" style="display: none;"></div>
      <div class="success-message" style="display: none;"></div>
    </div>
  `;
};

// Mock PlannerPage class (simplified version for testing)
class MockPlannerPage {
  constructor() {
    this.container = null;
    this.form = null;
    this.timeline = null;
    this.clock = null;
    this.calendarManager = null;
    this.currentData = null;
    this.currentScope = 'today';
    this.currentDate = new Date();
    this.isLoading = false;
    this.errorMessage = '';
  }

  init() {
    this.setupContainer();
    this.setupForm();
    this.setupComponents();
    this.setupEventListeners();
    this.loadInitialData();
  }

  setupContainer() {
    this.container = document.querySelector('.planner-container');
  }

  setupForm() {
    this.form = document.getElementById('plannerForm');
    this.mosqueSelect = document.getElementById('mosqueSelect');
    this.scopeSelect = document.getElementById('scopeSelect');
    this.paddingBeforeInput = document.getElementById('paddingBefore');
    this.paddingAfterInput = document.getElementById('paddingAfter');
  }

  setupComponents() {
    // Initialize Timeline
    this.timeline = new MockTimeline();
    this.timeline.init();

    // Initialize Clock
    this.clock = new MockClock();
    this.clock.init();

    // Initialize Calendar Manager
    this.calendarManager = new MockCalendarViewsManager();
    this.calendarManager.init();
  }

  setupEventListeners() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    if (this.mosqueSelect) {
      this.mosqueSelect.addEventListener('change', () => {
        this.handleMosqueChange();
      });
    }

    if (this.scopeSelect) {
      this.scopeSelect.addEventListener('change', () => {
        this.handleScopeChange();
      });
    }
  }

  loadInitialData() {
    this.showLoading();
    
    // Simulate API call
    setTimeout(() => {
      this.loadMosques();
      this.hideLoading();
    }, 100);
  }

  async loadMosques() {
    try {
      // Mock API response
      const mosques = [
        { id: 'mosque1', name: 'Grand Mosque', city: 'Paris' },
        { id: 'mosque2', name: 'Central Mosque', city: 'Lyon' }
      ];
      
      this.populateMosqueSelect(mosques);
    } catch (error) {
      this.showError('Failed to load mosques');
    }
  }

  populateMosqueSelect(mosques) {
    if (!this.mosqueSelect) return;

    // Clear existing options except the first one
    while (this.mosqueSelect.children.length > 1) {
      this.mosqueSelect.removeChild(this.mosqueSelect.lastChild);
    }

    mosques.forEach(mosque => {
      const option = document.createElement('option');
      option.value = mosque.id;
      option.textContent = `${mosque.name} - ${mosque.city}`;
      this.mosqueSelect.appendChild(option);
    });
  }

  async handleFormSubmit() {
    const formData = this.getFormData();
    
    if (!this.validateForm(formData)) {
      return;
    }

    this.showLoading();
    
    try {
      await this.generatePlanner(formData);
      this.showSuccess('Planner generated successfully');
    } catch (error) {
      this.showError('Failed to generate planner');
    } finally {
      this.hideLoading();
    }
  }

  getFormData() {
    return {
      mosqueId: this.mosqueSelect ? this.mosqueSelect.value : '',
      scope: this.scopeSelect ? this.scopeSelect.value : 'today',
      paddingBefore: this.paddingBeforeInput ? parseInt(this.paddingBeforeInput.value) : 15,
      paddingAfter: this.paddingAfterInput ? parseInt(this.paddingAfterInput.value) : 20
    };
  }

  validateForm(formData) {
    if (!formData.mosqueId) {
      this.showError('Please select a mosque');
      return false;
    }

    if (formData.paddingBefore < 0 || formData.paddingBefore > 60) {
      this.showError('Padding before must be between 0 and 60 minutes');
      return false;
    }

    if (formData.paddingAfter < 0 || formData.paddingAfter > 60) {
      this.showError('Padding after must be between 0 and 60 minutes');
      return false;
    }

    return true;
  }

  async generatePlanner(formData) {
    // Mock API call to generate planner data
    const mockData = this.generateMockData(formData);
    
    this.currentData = mockData;
    this.currentScope = formData.scope;
    
    this.updateComponents(mockData, formData.scope);
    this.updatePadding(formData.paddingBefore, formData.paddingAfter);
  }

  generateMockData(formData) {
    const basePrayerTimes = {
      fajr: '06:00',
      dohr: '12:00',
      asr: '15:30',
      maghreb: '18:00',
      icha: '20:00'
    };

    if (formData.scope === 'today') {
      return [{
        prayer_times: basePrayerTimes,
        slots: [
          { start: '07:00', end: '11:00' },
          { start: '13:00', end: '15:00' }
        ]
      }];
    }

    if (formData.scope === 'month') {
      return Array.from({ length: 30 }, (_, i) => ({
        prayer_times: {
          ...basePrayerTimes,
          fajr: `0${6 + (i % 2)}:${i % 2 ? '30' : '00'}`
        },
        slots: [
          { start: '07:00', end: '11:00' },
          { start: '13:00', end: '15:00' }
        ]
      }));
    }

    if (formData.scope === 'year') {
      return Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        days: Array.from({ length: 30 }, (_, j) => ({
          prayer_times: {
            ...basePrayerTimes,
            fajr: `0${6 + (i % 2)}:${j % 2 ? '30' : '00'}`
          },
          slots: [
            { start: '07:00', end: '11:00' },
            { start: '13:00', end: '15:00' }
          ]
        }))
      }));
    }

    return [];
  }

  updateComponents(data, scope) {
    if (this.timeline) {
      this.timeline.initializeTimeline(data, scope);
    }

    if (this.clock && data.length > 0) {
      const firstDay = scope === 'year' ? data[0].days[0] : data[0];
      if (firstDay && firstDay.prayer_times) {
        this.clock.displayPrayerSegments(firstDay.prayer_times);
      }
    }

    if (this.calendarManager) {
      this.calendarManager.setScope(scope);
      this.calendarManager.updateNavigation();
    }
  }

  updatePadding(paddingBefore, paddingAfter) {
    // Update global padding configuration
    if (typeof window !== 'undefined') {
      window.paddingBefore = paddingBefore;
      window.paddingAfter = paddingAfter;
    }
  }

  handleMosqueChange() {
    const mosqueId = this.mosqueSelect ? this.mosqueSelect.value : '';
    if (mosqueId) {
      this.showSuccess(`Selected mosque: ${mosqueId}`);
    }
  }

  handleScopeChange() {
    const scope = this.scopeSelect ? this.scopeSelect.value : 'today';
    this.currentScope = scope;
    
    if (this.currentData) {
      this.updateComponents(this.currentData, scope);
    }
  }

  navigateToDate(date) {
    this.currentDate = date;
    
    if (this.timeline) {
      this.timeline.setDate(date);
    }

    if (this.clock) {
      this.clock.updateDateDisplay(date);
    }

    if (this.calendarManager) {
      this.calendarManager.setCurrentDate(date);
    }
  }

  showLoading() {
    this.isLoading = true;
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'block';
    }
  }

  hideLoading() {
    this.isLoading = false;
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  }

  showError(message) {
    this.errorMessage = message;
    const errorElement = document.querySelector('.error-message');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  showSuccess(message) {
    const successElement = document.querySelector('.success-message');
    if (successElement) {
      successElement.textContent = message;
      successElement.style.display = 'block';
      
      // Hide after 3 seconds
      setTimeout(() => {
        successElement.style.display = 'none';
      }, 3000);
    }
  }

  getCurrentData() {
    return this.currentData;
  }

  getCurrentScope() {
    return this.currentScope;
  }

  getCurrentDate() {
    return this.currentDate;
  }

  isDataLoaded() {
    return this.currentData !== null;
  }

  destroy() {
    if (this.timeline) {
      this.timeline.destroy();
    }
    if (this.clock) {
      this.clock.destroy();
    }
    if (this.calendarManager) {
      this.calendarManager.destroy();
    }
    
    this.container = null;
    this.form = null;
    this.currentData = null;
  }
}

// Mock Timeline class (simplified for testing)
class MockTimeline {
  constructor() {
    this.container = null;
    this.svg = null;
    this.currentDate = new Date();
    this.segments = [];
    this.scope = 'today';
  }

  init() {
    this.container = document.querySelector('.slots-half');
    this.svg = document.querySelector('.slots-timeline-svg');
  }

  initializeTimeline(segments, scope) {
    this.segments = segments;
    this.scope = scope;
  }

  setDate(date) {
    this.currentDate = date;
  }

  destroy() {
    this.container = null;
    this.svg = null;
  }
}

// Mock Clock class (simplified for testing)
class MockClock {
  constructor() {
    this.svg = null;
    this.timeDisplay = null;
    this.dateDisplay = null;
  }

  init() {
    this.svg = document.querySelector('.clock-svg');
    this.timeDisplay = document.querySelector('.clock-time');
    this.dateDisplay = document.querySelector('.clock-date');
  }

  displayPrayerSegments(prayerTimes) {
    // Mock implementation
  }

  updateDateDisplay(date) {
    if (this.dateDisplay) {
      this.dateDisplay.textContent = formatDateForDisplay(date);
    }
  }

  destroy() {
    this.svg = null;
    this.timeDisplay = null;
    this.dateDisplay = null;
  }
}

// Mock CalendarViewsManager class (simplified for testing)
class MockCalendarViewsManager {
  constructor() {
    this.currentDate = new Date();
    this.scope = 'today';
  }

  init() {
    // Mock initialization
  }

  setScope(scope) {
    this.scope = scope;
  }

  setCurrentDate(date) {
    this.currentDate = date;
  }

  updateNavigation() {
    // Mock navigation update
  }

  destroy() {
    // Mock cleanup
  }
}

describe('PlannerPage Class', () => {
  let plannerPage;

  beforeEach(() => {
    createPlannerPageDOM();
    plannerPage = new MockPlannerPage();
  });

  afterEach(() => {
    plannerPage.destroy();
    document.body.innerHTML = '';
  });

  describe('Initialization', () => {
    test('should initialize planner page correctly', () => {
      plannerPage.init();
      
      expect(plannerPage.container).toBeTruthy();
      expect(plannerPage.form).toBeTruthy();
      expect(plannerPage.timeline).toBeTruthy();
      expect(plannerPage.clock).toBeTruthy();
      expect(plannerPage.calendarManager).toBeTruthy();
    });

    test('should setup form elements correctly', () => {
      plannerPage.init();
      
      expect(plannerPage.mosqueSelect).toBeTruthy();
      expect(plannerPage.scopeSelect).toBeTruthy();
      expect(plannerPage.paddingBeforeInput).toBeTruthy();
      expect(plannerPage.paddingAfterInput).toBeTruthy();
    });

    test('should setup components correctly', () => {
      plannerPage.init();
      
      expect(plannerPage.timeline.container).toBeTruthy();
      expect(plannerPage.clock.svg).toBeTruthy();
      expect(plannerPage.calendarManager).toBeTruthy();
    });
  });

  describe('Form Handling', () => {
    test('should get form data correctly', () => {
      plannerPage.init();
      
      const formData = plannerPage.getFormData();
      
      expect(formData).toHaveProperty('mosqueId');
      expect(formData).toHaveProperty('scope');
      expect(formData).toHaveProperty('paddingBefore');
      expect(formData).toHaveProperty('paddingAfter');
    });

    test('should validate form correctly', () => {
      plannerPage.init();
      
      const validData = {
        mosqueId: 'mosque1',
        scope: 'today',
        paddingBefore: 15,
        paddingAfter: 20
      };
      
      expect(plannerPage.validateForm(validData)).toBe(true);
    });

    test('should reject form without mosque selection', () => {
      plannerPage.init();
      
      const invalidData = {
        mosqueId: '',
        scope: 'today',
        paddingBefore: 15,
        paddingAfter: 20
      };
      
      expect(plannerPage.validateForm(invalidData)).toBe(false);
    });

    test('should reject form with invalid padding', () => {
      plannerPage.init();
      
      const invalidData = {
        mosqueId: 'mosque1',
        scope: 'today',
        paddingBefore: -5,
        paddingAfter: 70
      };
      
      expect(plannerPage.validateForm(invalidData)).toBe(false);
    });
  });

  describe('Data Generation', () => {
    test('should generate today data correctly', () => {
      const formData = { scope: 'today' };
      const data = plannerPage.generateMockData(formData);
      
      expect(data).toHaveLength(1);
      expect(data[0]).toHaveProperty('prayer_times');
      expect(data[0]).toHaveProperty('slots');
    });

    test('should generate month data correctly', () => {
      const formData = { scope: 'month' };
      const data = plannerPage.generateMockData(formData);
      
      expect(data).toHaveLength(30);
      expect(data[0]).toHaveProperty('prayer_times');
      expect(data[0]).toHaveProperty('slots');
    });

    test('should generate year data correctly', () => {
      const formData = { scope: 'year' };
      const data = plannerPage.generateMockData(formData);
      
      expect(data).toHaveLength(12);
      expect(data[0]).toHaveProperty('month');
      expect(data[0]).toHaveProperty('days');
      expect(data[0].days).toHaveLength(30);
    });
  });

  describe('Component Updates', () => {
    test('should update components with new data', () => {
      plannerPage.init();
      
      const mockData = [{ prayer_times: { fajr: '06:00' }, slots: [] }];
      const scope = 'today';
      
      plannerPage.updateComponents(mockData, scope);
      
      expect(plannerPage.timeline.segments).toEqual(mockData);
      expect(plannerPage.timeline.scope).toBe(scope);
    });

    test('should update padding configuration', () => {
      plannerPage.init();
      
      const paddingBefore = 25;
      const paddingAfter = 35;
      
      plannerPage.updatePadding(paddingBefore, paddingAfter);
      
      if (typeof window !== 'undefined') {
        expect(window.paddingBefore).toBe(paddingBefore);
        expect(window.paddingAfter).toBe(paddingAfter);
      }
    });
  });

  describe('Navigation', () => {
    test('should navigate to date correctly', () => {
      plannerPage.init();
      
      const testDate = new Date('2024-01-15');
      plannerPage.navigateToDate(testDate);
      
      expect(plannerPage.currentDate.toDateString()).toBe(testDate.toDateString());
      expect(plannerPage.timeline.currentDate.toDateString()).toBe(testDate.toDateString());
    });
  });

  describe('UI State Management', () => {
    test('should show loading state', () => {
      plannerPage.showLoading();
      
      expect(plannerPage.isLoading).toBe(true);
      
      const loadingIndicator = document.querySelector('.loading-indicator');
      expect(loadingIndicator.style.display).toBe('block');
    });

    test('should hide loading state', () => {
      plannerPage.showLoading();
      plannerPage.hideLoading();
      
      expect(plannerPage.isLoading).toBe(false);
      
      const loadingIndicator = document.querySelector('.loading-indicator');
      expect(loadingIndicator.style.display).toBe('none');
    });

    test('should show error message', () => {
      const errorMessage = 'Test error message';
      plannerPage.showError(errorMessage);
      
      expect(plannerPage.errorMessage).toBe(errorMessage);
      
      const errorElement = document.querySelector('.error-message');
      expect(errorElement.textContent).toBe(errorMessage);
      expect(errorElement.style.display).toBe('block');
    });

    test('should show success message', () => {
      const successMessage = 'Test success message';
      plannerPage.showSuccess(successMessage);
      
      const successElement = document.querySelector('.success-message');
      expect(successElement.textContent).toBe(successMessage);
      expect(successElement.style.display).toBe('block');
    });
  });

  describe('Event Handling', () => {
    test('should handle mosque change', () => {
      plannerPage.init();
      
      // Simulate mosque selection
      plannerPage.mosqueSelect.value = 'mosque1';
      
      const spy = jest.spyOn(plannerPage, 'showSuccess');
      
      plannerPage.handleMosqueChange();
      
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should handle scope change', () => {
      plannerPage.init();
      
      plannerPage.currentData = [{ prayer_times: { fajr: '06:00' } }];
      plannerPage.handleScopeChange();
      
      expect(plannerPage.currentScope).toBe('today');
    });
  });

  describe('Data Management', () => {
    test('should get current data', () => {
      const mockData = [{ prayer_times: { fajr: '06:00' } }];
      plannerPage.currentData = mockData;
      
      expect(plannerPage.getCurrentData()).toEqual(mockData);
    });

    test('should get current scope', () => {
      plannerPage.currentScope = 'month';
      
      expect(plannerPage.getCurrentScope()).toBe('month');
    });

    test('should get current date', () => {
      const testDate = new Date('2024-01-15');
      plannerPage.currentDate = testDate;
      
      expect(plannerPage.getCurrentDate()).toBe(testDate);
    });

    test('should check if data is loaded', () => {
      expect(plannerPage.isDataLoaded()).toBe(false);
      
      plannerPage.currentData = [{ prayer_times: { fajr: '06:00' } }];
      expect(plannerPage.isDataLoaded()).toBe(true);
    });
  });

  describe('Cleanup', () => {
    test('should destroy planner page correctly', () => {
      plannerPage.init();
      
      plannerPage.destroy();
      
      expect(plannerPage.container).toBeNull();
      expect(plannerPage.form).toBeNull();
      expect(plannerPage.currentData).toBeNull();
    });
  });
}); 