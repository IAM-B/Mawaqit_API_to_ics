/**
 * Compact Map Module
 * Handles the initialization of compact maps for mosque locations
 */

// Global variable to store the current map instance
let currentMap = null;

function initializeCompactMap(containerId, lat, lng, mosqueName) {
  console.log('Initializing compact map:', { containerId, lat, lng, mosqueName });
  
  if (!lat || !lng) {
    console.log('Missing coordinates, skipping map initialization');
    return;
  }
  
  // Destroy existing map if it exists
  if (currentMap) {
    console.log('Destroying existing map');
    currentMap.remove();
    currentMap = null;
  }
  
  // Create new map
  currentMap = L.map(containerId).setView([lat, lng], 15);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(currentMap);
  
  L.marker([lat, lng])
    .addTo(currentMap)
    .bindPopup(mosqueName)
    .openPopup();
    
  console.log('Map initialized successfully');
}

// Make function globally accessible
window.initializeCompactMap = initializeCompactMap;
