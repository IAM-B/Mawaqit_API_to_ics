document.addEventListener("DOMContentLoaded", () => {
  const countrySelect = document.getElementById("country-select");
  const mosqueSelect = document.getElementById("mosque-select");

  // Chargement des pays
  fetch("/get_countries")
    .then(res => res.json())
    .then(countries => {
      countries.forEach(({ code, name }) => {
        const option = document.createElement("option");
        option.value = code;
        option.textContent = name;
        countrySelect.appendChild(option);
      });
    });

  // Quand un pays est sélectionné
  countrySelect.addEventListener("change", () => {
    const countryCode = countrySelect.value;
    mosqueSelect.innerHTML = '<option value="">-- Sélectionner une mosquée --</option>';
    mosqueSelect.disabled = true;

    if (!countryCode) return;

    fetch(`/get_mosques?country=${countryCode}`)
      .then(res => res.json())
      .then(mosques => {
        mosques.forEach(mosque => {
          const option = document.createElement("option");
          option.value = mosque.slug || mosque.id || mosque.name;
          option.textContent = mosque.name;
          mosqueSelect.appendChild(option);
        });
        mosqueSelect.disabled = false;
      });
  });

  // Quand une mosquée est sélectionnée
  mosqueSelect.addEventListener("change", () => {
    const selected = mosqueSelect.value;
    console.log("Mosquée sélectionnée :", selected);
    // On peux ici appeler un endpoint pour sauvegarder ou stocker la sélection
  });
});