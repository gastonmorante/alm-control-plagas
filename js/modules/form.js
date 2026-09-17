/**
 * Module: form.js
 * Description: Robust Lead Capture Form Handler with Google Apps Script Web App Integration
 */
export function initLeadForm() {
  const form = document.getElementById('alm-lead-form');
  const submitBtn = document.getElementById('form-submit-btn');
  const btnText = document.getElementById('form-btn-text');
  const btnSpinner = document.getElementById('form-btn-spinner');
  const statusAlert = document.getElementById('form-status-alert');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    statusAlert.classList.add('hidden');
    statusAlert.className = 'mt-4 p-4 rounded-xl text-sm font-medium hidden';

    submitBtn.disabled = true;
    btnText.textContent = 'Enviando Solicitud...';
    btnSpinner.classList.remove('hidden');

    const formData = new FormData(form);
    const data = {
      nombre: formData.get('nombre'),
      empresa: formData.get('empresa') || 'Particular / No especificado',
      telefono: formData.get('telefono'),
      email: formData.get('email') || 'No especificado',
      ciudad: formData.get('ciudad'),
      servicio: formData.get('servicio'),
      comentarios: formData.get('comentarios') || '',
      origen: 'Landing Page ALM 2026',
      timestamp: new Date().toISOString()
    };

    const GAS_WEBAPP_URL = window.ALM_GAS_ENDPOINT || '';
    const GHL_WEBHOOK_URL = window.ALM_GHL_WEBHOOK_URL || window.GHL_WEBHOOK_URL || '';

    try {
      const promises = [];

      if (GAS_WEBAPP_URL && GAS_WEBAPP_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL') {
        promises.push(fetch(GAS_WEBAPP_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }));
      }

      if (GHL_WEBHOOK_URL) {
        promises.push(fetch(GHL_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).catch(err => console.warn('GHL form dispatch notification:', err)));
      }

      if (promises.length > 0) {
        await Promise.allSettled(promises);
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      statusAlert.className = 'mt-4 p-4 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 block';
      statusAlert.innerHTML = `
        <div class="flex items-center gap-2 font-bold text-emerald-900 mb-1">
          <span class="material-symbols-outlined text-lg">check_circle</span>
          <span>¡Solicitud enviada con éxito!</span>
        </div>
        <p class="text-xs text-emerald-700">Un ingeniero técnico especialista de ALM se comunicará contigo al <strong>${data.telefono}</strong> en menos de 15 minutos para coordinar tu servicio y aplicar tu descuento del 5%.</p>
      `;

      form.reset();
    } catch (err) {
      console.error('Error al enviar formulario:', err);
      statusAlert.className = 'mt-4 p-4 rounded-xl text-sm font-medium bg-amber-50 text-amber-900 border border-amber-200 block';
      statusAlert.innerHTML = `
        <p class="font-bold">Hubo un detalle temporal de conexión.</p>
        <p class="text-xs mt-1">Por favor contáctanos directamente a nuestro WhatsApp oficial para atención inmediata: <a href="https://wa.me/5212711266662" class="underline font-bold">+52 1 271 126 6662</a>.</p>
      `;
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'SOLICITAR COTIZACIÓN CON 5% DE DESCUENTO';
      btnSpinner.classList.add('hidden');
    }
  });
}
