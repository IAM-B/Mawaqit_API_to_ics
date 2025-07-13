// Mosque search dropdowns (TomSelect for country and mosque)

/**
 * Initialize TomSelect dropdowns for mosque and country search
 */
export function initMosqueSearchDropdowns () {
  const countrySelectEl = document.getElementById('country-select');
  const mosqueSelectEl = document.getElementById('mosque-select');
  if (!countrySelectEl || !mosqueSelectEl) return;
  // Dropdown mosquée
  const mosqueSelect = new TomSelect(mosqueSelectEl, {
    placeholder: 'Choisir une mosquée...',
    valueField: 'value',
    labelField: 'text',
    searchField: ['name', 'slug', 'city', 'address', 'zipcode'],
    options: [],
    shouldLoad: () => false,
    render: {
      no_results: () => '<div class="no-results">Aucune mosquée trouvée</div>'
    },
    onChange: (value) => {
      if (!value) return;
      const selectedOption = mosqueSelect.options[value];
      if (selectedOption) {
        document.getElementById('mosque_lat').value = selectedOption.lat || '';
        document.getElementById('mosque_lng').value = selectedOption.lng || '';
        document.getElementById('mosque_name').value = selectedOption.name || '';
        document.getElementById('mosque_address').value = selectedOption.address || '';
      }
    }
  });
  // Dropdown pays
  const countrySelect = new TomSelect(countrySelectEl, {
    placeholder: 'Choisir un pays...',
    onChange: (value) => {
      if (!value) return;
      mosqueSelect.clear(true);
      mosqueSelect.clearOptions();
      mosqueSelect.disable();
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
        })
        .catch(error => {
          console.error('Error loading mosques:', error);
          mosqueSelect.enable();
        });
    }
  });
  // Initial loading of countries
  fetch('/get_countries')
    .then(res => res.json())
    .then(countries => {
      countrySelect.addOptions(
        countries.map(c => ({ value: c.code, text: c.name }))
      );
    })
    .catch(error => {
      console.error('Error loading countries:', error);
    });
  // Expose globally
  window.countrySelectInstance = countrySelect;
  window.mosqueSelectInstance = mosqueSelect;
}
