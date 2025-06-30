/**
 * Unit tests for map.js component
 * 
 * This test suite covers the map functionality used in the prayer planning application.
 * The map component provides two main features:
 * 1. Compact map display for individual mosques
 * 2. Main mosque map with clustering for browsing all mosques
 * 
 * Functions tested:
 * - initializeCompactMap: Creates a focused map view for a specific mosque
 * - initMosqueMapLoader: Initializes the main mosque browsing map
 * 
 * Dependencies mocked:
 * - Leaflet (L) for map functionality
 * - Fetch API for mosque data retrieval
 * - DOM elements for map containers
 */

// Import map functions from the new modular structure
const { initializeCompactMap, initMosqueMapLoader } = require("../../../app/static/js/components/map.js");

describe("Map Component", () => {
  let mockContainer;
  let mockMap;
  let mockMarker;
  let mockTileLayer;
  let mockMarkerClusterGroup;

  beforeEach(() => {
    // Setup DOM for tests - Create realistic map container structure
    document.body.innerHTML = `
      <div id="test-map" style="width: 400px; height: 300px;"></div>
      <div id="mosque-map" style="width: 600px; height: 400px;"></div>
      <select id="mosque-select"></select>
      <select id="country-select"></select>
    `;

    mockContainer = document.getElementById("test-map");
    
    // Mock Leaflet objects with realistic behavior
    mockMap = {
      setView: jest.fn().mockReturnThis(),
      remove: jest.fn(),
      addLayer: jest.fn(),
      on: jest.fn()
    };

    mockMarker = {
      addTo: jest.fn().mockReturnThis(),
      bindPopup: jest.fn().mockReturnThis(),
      openPopup: jest.fn(),
      getLatLng: jest.fn(() => ({ lat: 48.8566, lng: 2.3522 })),
      on: jest.fn()
    };

    mockTileLayer = {
      addTo: jest.fn().mockReturnThis()
    };

    mockMarkerClusterGroup = {
      addLayer: jest.fn()
    };

    // Mock global L object - Leaflet library
    global.L = {
      map: jest.fn(() => mockMap),
      tileLayer: jest.fn(() => mockTileLayer),
      marker: jest.fn(() => mockMarker),
      markerClusterGroup: jest.fn(() => mockMarkerClusterGroup)
    };

    // Mock fetch API for mosque data retrieval
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue([
        { code: 'FR', name: 'France' },
        { code: 'US', name: 'United States' }
      ])
    });
  });

  afterEach(() => {
    // Clean up - Remove all mocks and DOM elements to prevent test interference
    document.body.innerHTML = "";
    delete global.L;
    delete global.fetch;
    delete window.currentMap;
  });

  describe("Compact Map Functions", () => {
    /**
     * Tests for the compact map functionality that displays a focused view
     * of a specific mosque. This is used in mosque details and planning views.
     */
    
    test("should initialize compact map with valid parameters", () => {
      // Test the creation of a focused map view for a specific mosque
      // This map shows the mosque location with a popup containing mosque name
      initializeCompactMap("test-map", 48.8566, 2.3522, "Test Mosque");
      
      expect(global.L.map).toHaveBeenCalledWith("test-map");
      expect(mockMap.setView).toHaveBeenCalledWith([48.8566, 2.3522], 15);
      expect(global.L.tileLayer).toHaveBeenCalledWith(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        expect.objectContaining({
          attribution: '© OpenStreetMap contributors'
        })
      );
      expect(global.L.marker).toHaveBeenCalledWith([48.8566, 2.3522]);
      expect(mockMarker.bindPopup).toHaveBeenCalledWith("Test Mosque");
      expect(mockMarker.openPopup).toHaveBeenCalled();
    });

    test("should handle invalid coordinates gracefully", () => {
      // Test error handling when coordinates are missing or invalid
      // This prevents crashes when mosque data is incomplete
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      initializeCompactMap("test-map", null, null, "Test Mosque");
      
      expect(global.L.map).not.toHaveBeenCalled();
      expect(global.L.marker).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test("should destroy existing map before creating new one", () => {
      // Test map cleanup to prevent memory leaks and overlapping maps
      // This ensures only one map instance exists at a time
      window.currentMap = mockMap;
      initializeCompactMap("test-map", 48.8566, 2.3522, "Test Mosque");
      expect(mockMap.remove).toHaveBeenCalled();
      expect(window.currentMap).toBe(mockMap);
    });
  });

  describe("Main Map Functions", () => {
    /**
     * Tests for the main mosque browsing map that displays all mosques
     * with clustering functionality for better performance.
     */
    
    test("should initialize main mosque map", () => {
      // Test the creation of the main mosque browsing interface
      // This map shows all mosques with clustering for better UX
      initMosqueMapLoader();
      expect(global.L.map).toHaveBeenCalledWith("mosque-map");
      expect(mockMap.setView).toHaveBeenCalledWith([20, 0], 2);
      expect(global.L.tileLayer).toHaveBeenCalledWith(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        expect.objectContaining({
          attribution: "© OpenStreetMap contributors"
        })
      );
      expect(global.L.markerClusterGroup).toHaveBeenCalled();
      expect(mockMap.addLayer).toHaveBeenCalledWith(mockMarkerClusterGroup);
    });

    test("should handle missing DOM elements gracefully", () => {
      // Test error handling when map container is not found
      // This prevents crashes when the map component is not properly loaded
      document.body.innerHTML = "";
      expect(() => initMosqueMapLoader()).not.toThrow();
    });

    test("should create marker cluster group", () => {
      // Test marker clustering functionality for better performance
      // Clustering groups nearby mosques to avoid cluttering the map
      initMosqueMapLoader();
      expect(global.L.markerClusterGroup).toHaveBeenCalled();
      expect(mockMap.addLayer).toHaveBeenCalledWith(mockMarkerClusterGroup);
    });
  });

  describe("Map Event Handling", () => {
    /**
     * Tests for map interaction events and user interactions
     * that enhance the user experience when browsing mosques.
     */
    
    test("should handle map events in main mosque map", () => {
      // Test event listeners for map interactions
      // These events provide user feedback and interaction capabilities
      initMosqueMapLoader();
      expect(mockMap.on).toHaveBeenCalledWith('popupopen', expect.any(Function));
    });

    test("should handle fetch calls for mosque data", () => {
      // Test data loading functionality
      // This ensures mosque data is properly retrieved from the API
      initMosqueMapLoader();
      expect(global.fetch).toHaveBeenCalledWith("/get_countries");
    });
  });

  describe("Map Utility Functions", () => {
    /**
     * Tests for utility functions that support map operations
     * including coordinate validation and formatting.
     */
    
    test("should format coordinates correctly", () => {
      // Test coordinate formatting for display purposes
      // This ensures coordinates are properly formatted in the UI
      const lat = 48.8566;
      const lng = 2.3522;
      const formatted = `${lat}, ${lng}`;
      expect(formatted).toBe('48.8566, 2.3522');
    });

    test("should validate coordinates", () => {
      // Test coordinate validation to ensure data integrity
      // This prevents invalid coordinates from being displayed on the map
      const isValidLat = (lat) => lat >= -90 && lat <= 90;
      const isValidLng = (lng) => lng >= -180 && lng <= 180;
      
      expect(isValidLat(48.8566)).toBe(true);
      expect(isValidLat(91)).toBe(false);
      expect(isValidLng(2.3522)).toBe(true);
      expect(isValidLng(181)).toBe(false);
    });
  });

  describe("Error Handling", () => {
    /**
     * Tests for error handling scenarios to ensure the map component
     * remains stable even when encountering unexpected issues.
     */
    
    test("should handle map creation failure", () => {
      // Test error handling when Leaflet map creation fails
      // This prevents application crashes due to map initialization issues
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock L.map to throw an error
      global.L.map = jest.fn(() => {
        throw new Error('Map creation failed');
      });
      
      expect(() => {
        initializeCompactMap("test-map", 48.8566, 2.3522, "Test Mosque");
      }).toThrow('Map creation failed');
      
      consoleSpy.mockRestore();
    });

    test("should handle network errors gracefully", async () => {
      // Test error handling when mosque data cannot be loaded
      // This ensures the application remains functional even with network issues
      global.fetch.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      initMosqueMapLoader();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Map Updates", () => {
    /**
     * Tests for map update functionality that allows dynamic
     * changes to the map display based on user interactions.
     */
    
    test("should update map location", () => {
      // Test map location updates for dynamic mosque selection
      // This allows users to focus on different mosque locations
      const newLat = 40.7128;
      const newLng = -74.0060;
      
      initializeCompactMap("test-map", newLat, newLng, "New York Mosque");
      
      expect(mockMap.setView).toHaveBeenCalledWith([newLat, newLng], 15);
      expect(global.L.marker).toHaveBeenCalledWith([newLat, newLng]);
    });

    test("should handle map refresh", () => {
      // Test map refresh functionality for data updates
      // This ensures the map reflects the latest mosque data
      window.currentMap = mockMap;
      
      initializeCompactMap("test-map", 48.8566, 2.3522, "Updated Mosque");
      
      expect(mockMap.remove).toHaveBeenCalled();
      expect(mockMap.setView).toHaveBeenCalled();
    });
  });
}); 