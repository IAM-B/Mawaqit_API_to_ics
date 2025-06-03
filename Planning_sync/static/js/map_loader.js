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

  // Met à jour le formulaire en fonction du pays et de la mosquée sélectionnés
  function selectMosqueInForm(countryCode, mosqueSlug) {
    if (!countryCode || !mosqueSlug) return;

    countrySelectEl.value = countryCode;
    countrySelectEl.dispatchEvent(new Event("change"));

    // attendre chargement des mosquées
    setTimeout(() => {
      const option = Array.from(mosqueSelectEl.options).find(
        (opt) => opt.value === mosqueSlug
      );
      if (option) {
        mosqueSelectEl.value = mosqueSlug;
        mosqueSelectEl.dispatchEvent(new Event("change"));
      }
    }, 500);
  }

  // Charge toutes les mosquées avec leurs marqueurs
  async function loadAllMosques() {
    const res = await fetch("/get_countries");
    const countries = await res.json();

    for (const country of countries) {
      const res = await fetch(`/get_mosques?country=${country.code}`);
      const mosques = await res.json();

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
    if (btn) {
      btn.addEventListener("click", () => {
        const country = btn.dataset.country;
        const slug = btn.dataset.slug;
        selectMosqueInForm(country, slug);
      });
    }
  });

  // Mise à jour de la carte lors de la sélection manuelle
  mosqueSelectEl.addEventListener("change", () => {
    const mosqueSlug = mosqueSelectEl.value;
    const marker = markers[mosqueSlug];
    if (marker) {
      map.setView(marker.getLatLng(), 13);
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
