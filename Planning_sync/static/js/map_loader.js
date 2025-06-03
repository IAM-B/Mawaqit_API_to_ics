document.addEventListener("DOMContentLoaded", () => {
  const mosqueSelectEl = document.getElementById("mosque-select");
  const countrySelectEl = document.getElementById("country-select");

  // Initialiser la carte
  const map = L.map("mosque-map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  let markers = [];

  // Fonction pour afficher un marqueur enrichi
  function displayMosqueMarker(mosque) {
    if (!mosque.lat || !mosque.lng) return;

    markers.forEach((m) => map.removeLayer(m));
    markers = [];

    const popupContent = `
      <div style="text-align:center;">
        <strong>${mosque.name}</strong><br>
        ${mosque.city || ''}<br>
        ${mosque.address || ''}<br>
        <img src="${mosque.image1}" alt="mosquée" style="width:100%;max-width:150px;margin-top:5px;border-radius:6px;" />
      </div>
    `;

    const marker = L.marker([mosque.lat, mosque.lng])
      .addTo(map)
      .bindPopup(popupContent)
      .openPopup();

    markers.push(marker);
    map.setView([mosque.lat, mosque.lng], 13);
  }

  // Sélection d'une mosquée
  mosqueSelectEl.addEventListener("change", () => {
    const selectedMosqueId = mosqueSelectEl.value;
    const selectedCountry = countrySelectEl.value;

    if (!selectedMosqueId || !selectedCountry) return;

    fetch(`/get_mosques?country=${selectedCountry}`)
      .then((res) => res.json())
      .then((mosques) => {
        const mosque = mosques.find((m) =>
          m.slug === selectedMosqueId ||
          m.id === selectedMosqueId ||
          m.name === selectedMosqueId
        );

        if (mosque) displayMosqueMarker(mosque);
      });
  });

  // Focus automatique sur un pays
  countrySelectEl.addEventListener("change", () => {
    const country = countrySelectEl.value;
    if (!country) return;

    fetch(`/get_mosques?country=${country}`)
      .then((res) => res.json())
      .then((mosques) => {
        const first = mosques.find((m) => m.lat && m.lng);
        if (first) map.setView([first.lat, first.lng], 6);
      });
  });
});
