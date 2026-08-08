/**
 * Module: city-selector.js
 * Description: Dynamic City Telephone Routing and Geolocation Selection
 */
export function initCitySelector() {
  const citySelect = document.getElementById('ciudad-select');
  const cityPhoneDisplay = document.getElementById('city-phone-display');
  const cityPhoneLink = document.getElementById('city-phone-link');

  const CITIES = {
    cordoba: { phone: '271 152 8442', raw: '522711528442', name: 'Córdoba' },
    orizaba: { phone: '272 123 4567', raw: '522711528442', name: 'Orizaba' },
    veracruz: { phone: '229 987 6543', raw: '522711528442', name: 'Veracruz Puerto' },
    bocadelrio: { phone: '229 987 6543', raw: '522711528442', name: 'Boca del Río' },
    fortin: { phone: '271 152 8442', raw: '522711528442', name: 'Fortín' }
  };

  if (!citySelect) return;

  citySelect.addEventListener('change', (e) => {
    const val = e.target.value;
    const selected = CITIES[val] || CITIES.cordoba;

    if (cityPhoneDisplay) {
      cityPhoneDisplay.textContent = selected.phone;
    }
    if (cityPhoneLink) {
      cityPhoneLink.href = `https://wa.me/${selected.raw}?text=Hola%20ALM,%20me%20comunico%20desde%20${encodeURIComponent(selected.name)}%20para%20un%20servicio%20de%20fumigación.`;
    }
  });
}
