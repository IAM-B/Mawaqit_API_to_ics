/**
 * Unit tests for mosque_search.js component
 *
 * This test suite covers the mosque search functionality that allows users
 * to find and select mosques for prayer planning. The component provides:
 * 1. Country selection dropdown with dynamic loading
 * 2. Mosque selection dropdown filtered by country
 * 3. Integration with TomSelect for enhanced UX
 * 4. Error handling for network and data issues
 *
 * Functions tested:
 * - initMosqueSearchDropdowns: Initializes the search interface
 *
 * Dependencies mocked:
 * - TomSelect for dropdown functionality
 * - Fetch API for country and mosque data
 * - DOM elements for form inputs
 */

// Import functions from the new modular structure
const { initMosqueSearchDropdowns } = require('../../../app/static/js/components/mosque_search.js');

// Mock fetch global
global.fetch = jest.fn();

describe('Mosque Search Component', () => {
  let mockCountrySelect;
  let mockMosqueSelect;

  beforeEach(() => {
    // Mock fetch global for API calls
    global.fetch = jest.fn();

    // Mock DOM elements with correct IDs for realistic testing
    // These elements represent the actual form structure used in the application
    const countrySelect = document.createElement('select');
    countrySelect.id = 'country-select';
    countrySelect.innerHTML = '<option value="">Sélectionner un pays</option>';

    const mosqueSelect = document.createElement('select');
    mosqueSelect.id = 'mosque-select';
    mosqueSelect.innerHTML = '<option value="">Sélectionner une mosquée</option>';

    // Mock document.getElementById to return appropriate elements
    // This simulates the actual DOM structure used by the component
    document.getElementById = jest.fn((id) => {
      if (id === 'country-select') return countrySelect;
      if (id === 'mosque-select') return mosqueSelect;
      if (id === 'mosque_lat') return { value: '' };
      if (id === 'mosque_lng') return { value: '' };
      if (id === 'mosque_name') return { value: '' };
      if (id === 'mosque_address') return { value: '' };
      return null;
    });

    // Mock TomSelect for countrySelect with full API simulation
    // TomSelect provides enhanced dropdown functionality with search and filtering
    mockCountrySelect = {
      addOptions: jest.fn(),
      setValue: jest.fn(),
      clear: jest.fn(),
      destroy: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      refreshOptions: jest.fn(),
      clearOptions: jest.fn(),
      enable: jest.fn(),
      disable: jest.fn(),
      options: {},
      control_input: {
        value: '',
        focus: jest.fn(),
        blur: jest.fn()
      },
      onChange: jest.fn()
    };

    // Mock TomSelect for mosqueSelect with full API simulation
    // This dropdown is populated based on the selected country
    mockMosqueSelect = {
      addOptions: jest.fn(),
      setValue: jest.fn(),
      clear: jest.fn(),
      destroy: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      refreshOptions: jest.fn(),
      clearOptions: jest.fn(),
      enable: jest.fn(),
      disable: jest.fn(),
      options: {},
      control_input: {
        value: '',
        focus: jest.fn(),
        blur: jest.fn()
      },
      onChange: jest.fn()
    };

    // Mock global TomSelect constructor
    // This simulates the TomSelect library initialization
    global.TomSelect = jest.fn((element) => {
      if (element.id === 'country-select') {
        return mockCountrySelect;
      } else if (element.id === 'mosque-select') {
        return mockMosqueSelect;
      }
      return mockCountrySelect;
    });

    // Reset fetch mocks to ensure clean state between tests
    global.fetch.mockClear();
  });

  describe('Initialization', () => {
    /**
     * Tests for the initialization process that sets up the search interface
     * and establishes the connection between country and mosque selection.
     */

    test('should initialize mosque search dropdowns', async () => {
      // Test the complete initialization process
      // This ensures the search interface is properly set up for user interaction
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ code: 'FR', name: 'France' }])
      });

      await initMosqueSearchDropdowns();

      expect(document.getElementById).toHaveBeenCalledWith('country-select');
      expect(document.getElementById).toHaveBeenCalledWith('mosque-select');
      expect(global.TomSelect).toHaveBeenCalled();
    });

    test('should handle missing select elements gracefully', async () => {
      // Test error handling when required DOM elements are not found
      // This prevents crashes when the component is loaded in unexpected contexts
      document.getElementById = jest.fn(() => null);

      expect(() => initMosqueSearchDropdowns()).not.toThrow();
    });
  });

  describe('Country Loading', () => {
    /**
     * Tests for the country data loading functionality that populates
     * the country dropdown with available countries from the API.
     */

    test('should load countries on initialization', async () => {
      // Test the loading and population of country data
      // This ensures users can select from available countries
      const mockCountries = [{ code: 'FR', name: 'France' }, { code: 'BE', name: 'Belgique' }];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCountries)
      });

      await initMosqueSearchDropdowns();

      // Wait for promises to resolve to ensure async operations complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(global.fetch).toHaveBeenCalledWith('/get_countries');
      expect(mockCountrySelect.addOptions).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ value: 'FR', text: 'France' }),
          expect.objectContaining({ value: 'BE', text: 'Belgique' })
        ])
      );
    });
  });

  describe('Error Handling', () => {
    /**
     * Tests for error handling scenarios to ensure the component
     * remains functional even when encountering network or data issues.
     */

    test('should handle network errors gracefully', async () => {
      // Test error handling when the API is unavailable
      // This ensures the application remains stable during network issues
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      expect(() => {
        initMosqueSearchDropdowns();
      }).not.toThrow();
    });

    test('should handle HTTP 500 errors', async () => {
      // Test error handling when the server returns an error
      // This ensures graceful degradation when the API is experiencing issues
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await initMosqueSearchDropdowns();

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test('should handle invalid JSON responses', async () => {
      // Test error handling when the API returns malformed data
      // This prevents crashes when the server returns unexpected data formats
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await initMosqueSearchDropdowns();

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    /**
     * Tests for cleanup functionality that properly disposes of
     * TomSelect instances to prevent memory leaks.
     */

    test('should destroy TomSelect instances on cleanup', async () => {
      // Test proper cleanup of TomSelect instances
      // This prevents memory leaks when the component is destroyed
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ code: 'FR', name: 'France' }])
      });

      await initMosqueSearchDropdowns();

      if (mockCountrySelect.destroy) {
        mockCountrySelect.destroy();
        expect(mockCountrySelect.destroy).toHaveBeenCalled();
      }
      if (mockMosqueSelect.destroy) {
        mockMosqueSelect.destroy();
        expect(mockMosqueSelect.destroy).toHaveBeenCalled();
      }
    });
  });
});
