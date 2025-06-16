document.addEventListener("DOMContentLoaded", () => {
  const mosqueSelectEl = document.getElementById("mosque-select");
  const countrySelectEl = document.getElementById("country-select");

  const map = L.map("mosque-map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  const markerCluster = L.markerClusterGroup();
  map.addLayer(markerCluster);

  const markers = {};

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

  // Charge toutes les mosquées avec leurs marqueurs
  async function loadAllMosques() {
    const countries = await (await fetch("/get_countries")).json();

    for (const country of countries) {
      const mosques = await (await fetch(`/get_mosques?country=${country.code}`)).json();

      mosques.forEach((mosque) => {
        if (!mosque.lat || !mosque.lng) return;

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

        const marker = L.marker([mosque.lat, mosque.lng]).bindPopup(popupContent);
        markerCluster.addLayer(marker);
        markers[mosque.slug] = marker;
      });
    }
  }

  // Délégation d’événement pour synchronisation à partir de la carte
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
              zipcode: m.zipcode,
            }))
          );

          selectMosqueAfterLoad(mosqueSelect, mosqueSlug);
        });
    });
  });

  // Mise à jour de la carte lors de la sélection manuelle
  mosqueSelectEl.addEventListener("change", () => {
    const mosqueSlug = mosqueSelectEl.value;
    const marker = markers[mosqueSlug];
    if (marker) {
      map.setView(marker.getLatLng(), 250);
      marker.openPopup();
    }
  });

  // Focus automatique sur le pays sélectionné
  countrySelectEl.addEventListener("change", () => {
    const code = countrySelectEl.value;
    fetch(`/get_mosques?country=${code}`)
      .then((res) => res.json())
      .then((mosques) => {
        const first = mosques.find((m) => m.lat && m.lng);
        if (first) map.setView([first.lat, first.lng], 6);
      });
  });

  loadAllMosques();
});
