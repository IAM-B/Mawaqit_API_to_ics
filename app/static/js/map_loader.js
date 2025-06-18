/**
 * Map Loader Module
 * Handles the initialization and management of the mosque map interface
 * Integrates with OpenStreetMap and manages mosque markers and interactions
 */
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements for mosque and country selection
  const mosqueSelectEl = document.getElementById("mosque-select");
  const countrySelectEl = document.getElementById("country-select");

  // Initialize the map with a default view
  const map = L.map("mosque-map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // Create a marker cluster group for better performance with many markers
  const markerCluster = L.markerClusterGroup();
  map.addLayer(markerCluster);

  // Store markers by mosque slug for easy access
  const markers = {};

  /**
   * Attempts to select a mosque in the dropdown after it's loaded
   * @param {Object} mosqueSelect - The TomSelect instance for mosque selection
   * @param {string} mosqueSlug - The slug of the mosque to select
   */
  function selectMosqueAfterLoad(mosqueSelect, mosqueSlug) {
    let attempts = 0;
    const maxAttempts = 20;

    const wait = setInterval(() => {
      const options = Object.keys(mosqueSelect.options || {});
      if (options.includes(mosqueSlug)) {
        mosqueSelect.setValue(mosqueSlug, true);
        clearInterval(wait);

        const marker = markers[mosqueSlug];
        if (marker) {
          map.setView(marker.getLatLng(), 250);
          marker.openPopup();
        }
      } else if (++attempts > maxAttempts) {
        console.warn(`⚠️ Impossible de sélectionner la mosquée : ${mosqueSlug}`);
        clearInterval(wait);
      }
    }, 300);
  }

  /**
   * Loads all mosques and creates markers for each one
   * Fetches countries and their associated mosques from the server
   */
  async function loadAllMosques() {
    const countries = await (await fetch("/get_countries")).json();

    for (const country of countries) {
      const mosques = await (await fetch(`/get_mosques?country=${country.code}`)).json();

      mosques.forEach((mosque) => {
        if (!mosque.lat || !mosque.lng) return;

        // Create popup content with mosque information
        const popupContent = `
          <div class="popup-content">
            <strong>${mosque.name}</strong><br>
            ${mosque.city || ""}<br>
            ${mosque.address || ""}<br>
            <img src="${mosque.image1}" alt="mosquée" class="popup-image" />
            <br>
            <button class="btn-sync-mosque" data-country="${country.code}" data-slug="${mosque.slug}">
              Sélectionner cette mosquée
            </button>
          </div>
        `;

        // Create and add marker to the map
        const marker = L.marker([mosque.lat, mosque.lng]).bindPopup(popupContent);
        markerCluster.addLayer(marker);
        markers[mosque.slug] = marker;
      });
    }
  }

  // Event delegation for mosque selection from map
  map.on("popupopen", (e) => {
    const btn = e.popup.getElement().querySelector(".btn-sync-mosque");
    if (!btn) return;

    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const countryCode = btn.dataset.country;
      const mosqueSlug = btn.dataset.slug;
      const countrySelect = countrySelectEl.tomselect;
      const mosqueSelect = mosqueSelectEl.tomselect;

      // Update country selection
      countrySelect.setValue(countryCode, true);

      // Fetch and update mosque options
      fetch(`/get_mosques?country=${countryCode}`)
        .then((res) => res.json())
        .then((mosques) => {
          mosqueSelect.clearOptions();
          mosqueSelect.enable();
          mosqueSelect.addOptions(
            mosques.map((m) => ({
              value: m.slug || m.id || m.name,
              text: m.text || m.name,
              name: m.name,
              slug: m.slug,
              city: m.city,
              address: m.address,
              zipcode: m.zipcode,
            }))
          );

          selectMosqueAfterLoad(mosqueSelect, mosqueSlug);
        });
    });
  });

  // Update map view when mosque is selected manually
  mosqueSelectEl.addEventListener("change", () => {
    const mosqueSlug = mosqueSelectEl.value;
    const marker = markers[mosqueSlug];
    if (marker) {
      map.setView(marker.getLatLng(), 250);
      marker.openPopup();
    }
  });

  // Auto-focus on selected country
  countrySelectEl.addEventListener("change", () => {
    const code = countrySelectEl.value;
    fetch(`/get_mosques?country=${code}`)
      .then((res) => res.json())
      .then((mosques) => {
        const first = mosques.find((m) => m.lat && m.lng);
        if (first) map.setView([first.lat, first.lng], 6);
      });
  });

  // Initial load of all mosques
  loadAllMosques();
});
