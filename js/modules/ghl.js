/**
 * Module: ghl.js
 * Description: GoHighLevel (GHL) CRM Integration & WhatsApp Service Quote Dispatcher
 * ALM Control de Plagas & Fumigaciones Fitosanitarias
 */

export function initGHLServiceIntegration() {
  const WHATSAPP_PHONE = window.ALM_WHATSAPP_PHONE || '5212711266662';

  const SERVICE_MESSAGES = {
    'Residencial': 'Hola ALM Control de Plagas, me interesa solicitar una cotización para el servicio Residencial (casas y departamentos).',
    'Comercial y Hospedaje': 'Hola ALM Control de Plagas, me interesa solicitar una cotización para el servicio Comercial y Hospedaje (restaurantes, hoteles, escuelas, hospitales o comercios).',
    'Silos y Bodegas': 'Hola ALM Control de Plagas, me interesa solicitar una cotización para el servicio en Silos y Bodegas (fumigación fitosanitaria y desgasificación con Fosfuro).',
    'Cajas Secas y Contenedores': 'Hola ALM Control de Plagas, me interesa solicitar una cotización para Fumigación de Cajas Secas y Contenedores (transporte de carga / FFCC).'
  };

  /**
   * Dispatches lead/event telemetry to GoHighLevel webhook and Google Apps Script
   */
  async function dispatchGHLQuoteLead(serviceName, customMsg) {
    const ghlWebhook = window.ALM_GHL_WEBHOOK_URL || window.GHL_WEBHOOK_URL || '';
    const payload = {
      event: 'service_quote_request',
      service: serviceName,
      message: customMsg,
      channel: 'WhatsApp',
      phone_target: WHATSAPP_PHONE,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      source: 'Landing Page ALM - Ficha de Servicios'
    };

    // 1. Dispatch to GoHighLevel (GHL) Webhook if configured
    if (ghlWebhook) {
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
          navigator.sendBeacon(ghlWebhook, blob);
        } else {
          fetch(ghlWebhook, {
            method: 'POST',
            mode: 'no-cors',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).catch(e => console.warn('GHL dispatch notification:', e));
        }
      } catch (err) {
        console.warn('GHL webhook error:', err);
      }
    }

    // 2. Also record in Google Apps Script if endpoint is configured
    const gasWebhook = window.ALM_GAS_ENDPOINT;
    if (gasWebhook && gasWebhook !== 'YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL') {
      try {
        fetch(gasWebhook, {
          method: 'POST',
          mode: 'no-cors',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});
      } catch (e) {}
    }
  }

  // Bind all service quote buttons
  const quoteButtons = document.querySelectorAll('.alm-service-quote-btn');
  quoteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const serviceName = btn.getAttribute('data-service') || 'General';
      const customMsg = btn.getAttribute('data-message') || SERVICE_MESSAGES[serviceName] || ('Hola ALM Control de Plagas, me interesa solicitar una cotización para el servicio de ' + serviceName + '.');

      // Dispatch async tracking
      dispatchGHLQuoteLead(serviceName, customMsg);

      // Ensure target URL is correct
      const targetUrl = 'https://wa.me/' + WHATSAPP_PHONE + '?text=' + encodeURIComponent(customMsg);
      btn.setAttribute('href', targetUrl);
    });
  });
}
