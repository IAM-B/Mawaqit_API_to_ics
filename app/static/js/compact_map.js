/**
 * Compact Map Module
 * Handles the initialization of compact maps for mosque locations
 */

function initializeCompactMap(containerId, lat, lng, mosqueName) {
  console.log('Initializing compact map:', { containerId, lat, lng, mosqueName });
  
  if (!lat || !lng) {
    console.log('Missing coordinates, skipping map initialization');
    return;
  }
  
  const map = L.map(containerId).setView([lat, lng], 15);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  
  L.marker([lat, lng])
    .addTo(map)
    .bindPopup(mosqueName)
    .openPopup();
    
  console.log('Map initialized successfully');
}

// Auto-initialize if data is available
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, checking for map container...');
  
  const mapContainer = document.getElementById('mosque-location-map');
  console.log('Map container found:', mapContainer);
  
  if (mapContainer) {
    const lat = mapContainer.dataset.lat;
    const lng = mapContainer.dataset.lng;
    const name = mapContainer.dataset.name;
    
    console.log('Map data from attributes:', { lat, lng, name });
    
    if (lat && lng) {
      initializeCompactMap(
        'mosque-location-map',
        parseFloat(lat),
        parseFloat(lng),
        name || 'Mosquée'
      );
    } else {
      console.log('No coordinates found in data attributes');
    }
  } else {
    console.log('Map container not found');
  }
}); 