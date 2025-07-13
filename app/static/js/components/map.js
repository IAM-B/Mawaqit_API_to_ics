// Map component for compact and main mosque maps (OpenStreetMap/Leaflet)

/**
 * Initialize the compact map (Leaflet)
 */
export function initializeCompactMap (containerId, lat, lng, mosqueName) {
  if (!lat || !lng) {
    return;
  }
  // Destroy the existing map if needed
  if (window.currentMap) {
    window.currentMap.remove();
    window.currentMap = null;
  }
  // Create a new map
  window.currentMap = L.map(containerId).setView([lat, lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(window.currentMap);
  L.marker([lat, lng])
    .addTo(window.currentMap)
    .bindPopup(mosqueName)
    .openPopup();
}

/**
 * Initialize the main mosque map with clusters and interactions
 */
export function initMosqueMapLoader () {
  const mosqueSelectEl = document.getElementById('mosque-select');
  const countrySelectEl = document.getElementById('country-select');
  if (!mosqueSelectEl || !countrySelectEl) return;
  // OSM map
  const map = L.map('mosque-map').setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  // Clusters
  const markerCluster = L.markerClusterGroup();
  map.addLayer(markerCluster);
  // Markers by slug
  const markers = {};
  // Select a mosque after loading
  function selectMosqueAfterLoad (mosqueSelect, mosqueSlug) {
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
  // Load all mosques and create markers
  async function loadAllMosques () {
    try {
      const countries = await (await fetch('/get_countries')).json();
      for (const country of countries) {
        try {
          const mosques = await (await fetch(`/get_mosques?country=${country.code}`)).json();
          mosques.forEach((mosque) => {
            if (!mosque.lat || !mosque.lng) return;
            const popupContent = `
          <div class="popup-content" style="min-width:220px;max-width:320px;padding:1em 1.2em;background:var(--form-bg,#1a1a1a);color:var(--text-color,#e2e8f0);border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.25);">
            <div style="display:flex;align-items:center;gap:0.5em;margin-bottom:0.5em;">
              <i class="fa-solid fa-mosque" style="font-size:1.3em;color:var(--primary,#d4af37);"></i>
              <strong style="font-size:1.1em;">${mosque.name}</strong>
            </div>
            <div style="color:var(--text-muted,#a0aec0);font-size:0.95em;margin-bottom:0.3em;">
              ${mosque.city ? `<span><i class='fa-solid fa-location-dot'></i> ${mosque.city}</span><br>` : ''}
              ${mosque.address ? `<span><i class='fa-solid fa-map-pin'></i> ${mosque.address}</span><br>` : ''}
            </div>
            ${mosque.image1 ? `<img id="popup-img-${mosque.slug}" src="${mosque.image1}" alt="mosquée" class="popup-image" style="width:100%;max-height:120px;object-fit:cover;border-radius:6px;margin:0.5em 0;" />` : ''}
            <hr style="border:0;border-top:1px solid var(--border-color,#333);margin:0.5em 0;">
            <button class="btn-sync-mosque" data-country="${country.code}" data-slug="${mosque.slug}" style="display:block;width:100%;margin-top:0.7em;padding:0.5em 0;background:var(--primary,#d4af37);color:#222;border:none;border-radius:6px;font-weight:600;cursor:pointer;transition:background 0.2s;font-size:1em;">
              <i class="fa-solid fa-check"></i> Sélectionner cette mosquée
            </button>
          </div>
        `;
            const marker = L.marker([mosque.lat, mosque.lng]).bindPopup(popupContent);
            markerCluster.addLayer(marker);
            markers[mosque.slug] = marker;
          });
        } catch (err) {
          console.error('Error loading mosques for country', country.code, err);
        }
      }
    } catch (err) {
      console.error('Error loading countries or mosques', err);
    }
  }
  // Event delegation for selection from the map
  map.on('popupopen', (e) => {
    const btn = e.popup.getElement().querySelector('.btn-sync-mosque');
    if (!btn) return;
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const countryCode = btn.dataset.country;
      const mosqueSlug = btn.dataset.slug;
      const countrySelect = countrySelectEl.tomselect;
      const mosqueSelect = mosqueSelectEl.tomselect;
      countrySelect.setValue(countryCode, true);
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
              zipcode: m.zipcode
            }))
          );
          selectMosqueAfterLoad(mosqueSelect, mosqueSlug);
        });
    });
    // Correction of the popup position after image loading
    const img = e.popup.getElement().querySelector('img[id^="popup-img-"]');
    if (img) {
      if (!img.complete) {
        img.addEventListener('load', () => {
          e.popup.update();
        });
      } else {
        setTimeout(() => e.popup.update(), 50);
      }
    }
  });
  // Update the map view when manually selecting
  mosqueSelectEl.addEventListener('change', () => {
    const mosqueSlug = mosqueSelectEl.value;
    const marker = markers[mosqueSlug];
    if (marker) {
      map.setView(marker.getLatLng(), 250);
      marker.openPopup();
    }
  });
  // Auto-focus on the selected country
  countrySelectEl.addEventListener('change', () => {
    const code = countrySelectEl.value;
    fetch(`/get_mosques?country=${code}`)
      .then((res) => res.json())
      .then((mosques) => {
        const first = mosques.find((m) => m.lat && m.lng);
        if (first) map.setView([first.lat, first.lng], 6);
      });
  });
  // Initial loading of all mosques
  loadAllMosques().catch(err => console.error('Error loading initial mosques', err));
}
