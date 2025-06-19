/**
 * Mosque Search Module
 * Handles the initialization and management of mosque search functionality
 * Integrates with TomSelect for enhanced dropdown functionality
 */
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements for country and mosque selection
  const countrySelectEl = document.getElementById("country-select");
  const mosqueSelectEl = document.getElementById("mosque-select");

  /**
   * Initialize mosque selection dropdown with TomSelect
   * Configures search fields and rendering options
   */
  const mosqueSelect = new TomSelect(mosqueSelectEl, {
    placeholder: "Choisir une mosquée...",
    valueField: "value",
    labelField: "text",
    searchField: ["name", "slug", "city", "address", "zipcode"],
    options: [],
    shouldLoad: () => false,
    render: {
      no_results: () => '<div class="no-results">Aucune mosquée trouvée</div>'
    },
    onChange: (value) => {
      if (!value) return;
      
      // Get selected mosque data
      const selectedOption = mosqueSelect.options[value];
      if (selectedOption) {
        // Store coordinates in hidden fields
        document.getElementById('mosque_lat').value = selectedOption.lat || '';
        document.getElementById('mosque_lng').value = selectedOption.lng || '';
        document.getElementById('mosque_name').value = selectedOption.name || '';
        document.getElementById('mosque_address').value = selectedOption.address || '';
      }
    }
  });

  /**
   * Initialize country selection dropdown with TomSelect
   * Handles country change events and updates mosque options
   */
  const countrySelect = new TomSelect(countrySelectEl, {
    placeholder: "Choisir un pays...",
    onChange: (value) => {
      if (!value) return;

      // Clear and disable mosque selection while loading
      mosqueSelect.clear(true);
      mosqueSelect.clearOptions();
      mosqueSelect.disable();
  
      // Fetch and update mosque options for selected country
      fetch(`/get_mosques?country=${value}`)
        .then(res => res.json())
        .then(mosques => {
          mosqueSelect.enable();
          mosqueSelect.addOptions(
            mosques.map(m => ({
              value: m.slug || m.id || m.name,
              text: m.text || m.name,
              name: m.name,
              slug: m.slug,
              city: m.city,
              address: m.address,
              zipcode: m.zipcode,
              lat: m.lat,
              lng: m.lng
            }))
          );
        });
    }
  });

  // Load initial country list
  fetch("/get_countries")
    .then(res => res.json())
    .then(countries => {
      countrySelect.addOptions(
        countries.map(c => ({ value: c.code, text: c.name }))
      );
    });
});
