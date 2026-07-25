/**
 * ALM CONTROL DE PLAGAS - MAIN JAVASCRIPT
 * Lead Developer: Gastón | NegocioUp
 */

document.addEventListener('DOMContentLoaded', () => {
  initSanityCalculator();
  initFormHandler();
  initSmoothScroll();
  initCitySelector();
});

/* ==========================================
   1. CALCULADORA INTERACTIVA DE RIESGO COFEPRIS
   ========================================== */
function initSanityCalculator() {
  const sectorSelect = document.getElementById('calc-sector');
  const sizeInput = document.getElementById('calc-size');
  const sizeValueDisplay = document.getElementById('calc-size-val');
  const lastFumigationSelect = document.getElementById('calc-last-fumigation');

  const riskBadge = document.getElementById('calc-risk-badge');
  const fineEstimateDisplay = document.getElementById('calc-fine-estimate');
  const actionRecommendation = document.getElementById('calc-recommendation');
  const calcCtaBtn = document.getElementById('calc-cta-btn');

  if (!sectorSelect || !sizeInput) return;

  function calculateRisk() {
    const sector = sectorSelect.value;
    const size = parseInt(sizeInput.value, 10);
    const monthsSince = parseInt(lastFumigationSelect.value, 10);

    sizeValueDisplay.textContent = size.toLocaleString('es-MX') + ' m² / m³';

    // Base multiplier based on legal vulnerability per NOM-256 / NOM-251
    let riskLevel = 'MEDIO';
    let minFine = 226280; // 2,000 UMAS
    let maxFine = 678840; // 6,000 UMAS
    let riskColor = 'text-amber-500 bg-amber-50 border-amber-200';
    let recommendation = 'Requiere inspección sanitaria preventiva en los próximos 15 días.';

    if (sector === 'industrial_silos' || sector === 'transporte') {
      if (monthsSince >= 3 || size > 1000) {
        riskLevel = 'CRÍTICO - ALTO RIESGO DE CLAUSURA';
        riskColor = 'text-red-600 bg-red-50 border-red-300 animate-pulse';
        recommendation = '⚠️ Sujeto a clausura inmediata e inmovilización de granos/mercancía por SESVER/COFEPRIS.';
      } else {
        riskLevel = 'ALTO';
        riskColor = 'text-orange-600 bg-orange-50 border-orange-200';
        recommendation = 'Requiere certificado bimestral de fumigación NOM-256 para maniobras de carga y descarga.';
      }
    } else if (sector === 'alimentos_restaurantes' || sector === 'salud_hospitales') {
      if (monthsSince >= 2) {
        riskLevel = 'CRÍTICO';
        riskColor = 'text-red-600 bg-red-50 border-red-300';
        recommendation = 'Violación directa a NOM-251-SSA1-2009. Suspensión temporal de actividades probable.';
      } else {
        riskLevel = 'MEDIO - ALTO';
        riskColor = 'text-amber-600 bg-amber-50 border-amber-200';
        recommendation = 'Programar servicio mensual de Manejo Integrado de Plagas (MIP).';
      }
    } else {
      if (monthsSince >= 6) {
        riskLevel = 'MEDIO';
        riskColor = 'text-blue-600 bg-blue-50 border-blue-200';
        recommendation = 'Se recomienda refuerzo sanitario preventivo por temporada.';
      } else {
        riskLevel = 'BAJO (EN REGLA)';
        riskColor = 'text-green-600 bg-green-50 border-green-200';
        recommendation = 'Cumplimiento adecuado. Mantener bitácora al día.';
      }
    }

    // Format Fine output
    const minFineFormatted = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(minFine);
    const maxFineFormatted = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(maxFine);

    riskBadge.className = `inline-block px-3 py-1 text-xs sm:text-sm font-bold rounded-full border ${riskColor}`;
    riskBadge.textContent = riskLevel;

    fineEstimateDisplay.textContent = `${minFineFormatted} - ${maxFineFormatted} MXN (2,000 a 6,000 UMA)`;
    actionRecommendation.textContent = recommendation;
  }

  sectorSelect.addEventListener('change', calculateRisk);
  sizeInput.addEventListener('input', calculateRisk);
  lastFumigationSelect.addEventListener('change', calculateRisk);

  if (calcCtaBtn) {
    calcCtaBtn.addEventListener('click', () => {
      const formSection = document.getElementById('cotizacion');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
        const commentsField = document.getElementById('lead-comentarios');
        if (commentsField) {
          commentsField.value = `[Evaluación desde Calculadora COFEPRIS]\nSector: ${sectorSelect.options[sectorSelect.selectedIndex].text}\nSuperficie: ${sizeInput.value}m²\nÚltima fumigación: ${lastFumigationSelect.options[lastFumigationSelect.selectedIndex].text}`;
        }
      }
    });
  }

  calculateRisk();
}

/* ==========================================
   2. CAPTURA Y ENVÍO DE FORMULARIO DE LEADS
   ========================================== */
function initFormHandler() {
  const form = document.getElementById('alm-lead-form');
  const submitBtn = document.getElementById('form-submit-btn');
  const btnText = document.getElementById('form-btn-text');
  const btnSpinner = document.getElementById('form-btn-spinner');
  const statusAlert = document.getElementById('form-status-alert');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset alert state
    statusAlert.classList.add('hidden');
    statusAlert.className = 'mt-4 p-4 rounded-xl text-sm font-medium hidden';

    // Show loading spinner
    submitBtn.disabled = true;
    btnText.textContent = 'Enviando Solicitud...';
    btnSpinner.classList.remove('hidden');

    const formData = new FormData(form);
    const data = {
      nombre: formData.get('nombre'),
      empresa: formData.get('empresa') || 'Particular / No especificado',
      telefono: formData.get('telefono'),
      ciudad: formData.get('ciudad'),
      servicio: formData.get('servicio'),
      comentarios: formData.get('comentarios') || '',
      origen: 'Landing Page ALM 2026',
      timestamp: new Date().toISOString()
    };

    // Google Apps Script Web App Endpoint URL (Gastón config key)
    const GAS_WEBAPP_URL = window.ALM_GAS_ENDPOINT || '';

    try {
      if (GAS_WEBAPP_URL && GAS_WEBAPP_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL') {
        await fetch(GAS_WEBAPP_URL, {
          method: 'POST',
          mode: 'no-cors', // standard for Apps Script Web App cross-origin posts
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else {
        // Simulated network delay for local preview
        await new Promise(resolve => setTimeout(resolve, 1200));
      }

      // Success notification
      statusAlert.className = 'mt-4 p-4 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 block';
      statusAlert.innerHTML = `
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <div>
            <p class="font-bold text-base">¡Solicitud recibida con éxito!</p>
            <p class="text-xs text-emerald-700">Un técnico certificado de ALM se comunicará contigo en breve al <strong>${data.telefono}</strong> para coordinar la inspección sanitaria.</p>
          </div>
        </div>
      `;

      form.reset();

      // Send conversion ping to WhatsApp if requested
      setTimeout(() => {
        const msg = encodeURIComponent(`Hola ALM Control de Plagas. Acabo de solicitar una cotización en su sitio web.\nNombre: ${data.nombre}\nEmpresa: ${data.empresa}\nCiudad: ${data.ciudad}\nServicio: ${data.servicio}`);
        const waUrl = `https://wa.me/522711407953?text=${msg}`;
        const waLink = document.createElement('a');
        waLink.href = waUrl;
        waLink.target = '_blank';
        waLink.click();
      }, 2000);

    } catch (err) {
      console.error('Error enviando formulario:', err);
      statusAlert.className = 'mt-4 p-4 rounded-xl text-sm font-medium bg-amber-50 text-amber-800 border border-amber-200 block';
      statusAlert.innerHTML = `
        <p class="font-bold">Nota de conexión:</p>
        <p class="text-xs">Tu mensaje se ha preparado. Puedes comunicarte directamente al WhatsApp de respuesta rápida: <a href="https://wa.me/522711407953" target="_blank" class="underline font-bold">271 140 7953</a>.</p>
      `;
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Solicitar Inspección y Cotización';
      btnSpinner.classList.add('hidden');
    }
  });
}

/* ==========================================
   3. NAVEGACIÓN Y DESPLAZAMIENTO SUAVE
   ========================================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

/* ==========================================
   4. SELECTOR DINÁMICO DE COBERTURAS REGIONALES
   ========================================== */
function initCitySelector() {
  const cityButtons = document.querySelectorAll('.city-pill');
  const cityTitle = document.getElementById('selected-city-name');
  const cityPhone = document.getElementById('selected-city-phone');

  if (!cityButtons.length) return;

  cityButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      cityButtons.forEach(b => b.classList.remove('bg-navy-900', 'text-white', 'border-accent-green'));
      cityButtons.forEach(b => b.classList.add('bg-white', 'text-slate-700', 'border-slate-200'));

      btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
      btn.classList.add('bg-navy-900', 'text-white', 'border-accent-green');

      const cityName = btn.dataset.city;
      if (cityTitle) cityTitle.textContent = cityName;
      if (cityPhone) cityPhone.textContent = 'Atención directa: 271 140 7953 / 271 715 7830';
    });
  });
}
