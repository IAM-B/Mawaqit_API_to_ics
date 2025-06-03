document.addEventListener("DOMContentLoaded", () => {
  const countrySelectEl = document.getElementById("country-select");
  const mosqueSelectEl = document.getElementById("mosque-select");

  const mosqueSelect = new TomSelect(mosqueSelectEl, {
    placeholder: "Choisir une mosquée...",
    valueField: "value",
    labelField: "text",
    searchField: ["text"],
    options: [],
    shouldLoad: () => false, // désactive chargement async auto
    render: {
      no_results: () => '<div class="no-results">Aucune mosquée trouvée</div>'
    }
  });

  const countrySelect = new TomSelect(countrySelectEl, {
    placeholder: "Choisir un pays...",
    onChange: (value) => {
      if (!value) return;

      fetch(`/get_mosques?country=${value}`)
        .then(res => res.json())
        .then(mosques => {
          mosqueSelect.clearOptions();
          mosqueSelect.enable();
          mosqueSelect.addOptions(
            mosques.map(m => ({
              value: m.slug || m.id || m.name,
              text: m.name
            }))
          );
        });
    }
  });

  // Charger les pays
  fetch("/get_countries")
    .then(res => res.json())
    .then(countries => {
      countrySelect.addOptions(
        countries.map(c => ({ value: c.code, text: c.name }))
      );
    });
});
