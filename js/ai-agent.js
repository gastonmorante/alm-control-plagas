/**
 * ALM CONTROL DE PLAGAS - AI AGENT WIDGET (Gemini 1.5 Pro Bridge)
 * Developer: NegocioUp
 */

(function () {
  const SYSTEM_KNOWLEDGE = {
    cofepris: "ALM Control de Plagas opera bajo Licencia Sanitaria expedida por la COFEPRIS y cumple con la NOM-256-SSA1-2012. Todos nuestros servicios son supervisados por nuestro Director Técnico, Ing. Justino González Heredia, e incluyen Certificado Oficial válido ante inspecciones sanitarias. ¡Además, al solicitar tu servicio en la web obtienes 5% de descuento!",
    silos: "Para el sector industrial, silos y transporte de carga en Veracruz, realizamos tratamientos especializados de fumigación y desinfección sanitaria. Recomendamos mantener un programa mensual de protección para asegurar el cumplimiento fitosanitario.",
    seguridad: "Utilizamos exclusivamente productos ecológicos de baja toxicidad registrados ante COFEPRIS. Marisela Reyes y nuestro equipo técnico te proporcionarán la ficha técnica y tiempos de reingreso seguros.",
    cobertura: "Brindamos atención inmediata en Córdoba, Fortín, Orizaba, Veracruz puerto, Boca del Río, Xalapa y Tierra Blanca.",
    contacto: "Puedes contactarnos directamente al WhatsApp 271 152 8442 o a nuestras oficinas 271 140 7953 / 271 715 7830. ¿Te gustaría que registremos tus datos para enviarte una cotización sin costo con el 5% de descuento?",
    descuento: "¡Así es! Por solicitar tu servicio a través de nuestra web obtienes Cotización Sin Costo + 5% de Descuento en tu primer servicio."
  };

  let chatHistory = [];
  let isChatOpen = false;
  let capturedLead = { nombre: '', telefono: '', email: '' };

  document.addEventListener('DOMContentLoaded', () => {
    initChatWidgetUI();
  });

  function initChatWidgetUI() {
    const triggerBtn = document.getElementById('ai-chat-trigger');
    const modal = document.getElementById('ai-chat-modal');
    const closeBtn = document.getElementById('ai-chat-close');
    const sendBtn = document.getElementById('ai-chat-send');
    const inputField = document.getElementById('ai-chat-input');

    if (!triggerBtn || !modal) return;

    // Toggle Modal
    triggerBtn.addEventListener('click', () => {
      isChatOpen = !isChatOpen;
      if (isChatOpen) {
        modal.classList.add('active');
        inputField.focus();
        if (chatHistory.length === 0) {
          sendBotMessage("¡Hola! Con gusto te atiendo en ALM Control de Plagas. 🛡️\n\nSoy el asistente virtual de Ing. Justino González y Marisela Reyes. Para enviarte tu Cotización sin Costo + 5% de Descuento, ¿me compartes tu Nombre, Teléfono/WhatsApp y Correo Electrónico?");
        }
      } else {
        modal.classList.remove('active');
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        isChatOpen = false;
        modal.classList.remove('active');
      });
    }

    // Quick Option Buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('ai-quick-btn')) {
        const query = e.target.dataset.query;
        if (query) {
          addUserMessage(query);
          processUserQuery(query);
        }
      }
    });

    // Send Message
    function handleSend() {
      const text = inputField.value.trim();
      if (!text) return;
      inputField.value = '';
      addUserMessage(text);
      processUserQuery(text);
    }

    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    if (inputField) {
      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
      });
    }
  }

  function addUserMessage(text) {
    const container = document.getElementById('ai-chat-messages');
    if (!container) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex justify-end mb-3';
    msgDiv.innerHTML = `
      <div class="bg-navy-900 text-white rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[85%] text-sm shadow-sm">
        ${escapeHtml(text)}
      </div>
    `;
    container.appendChild(msgDiv);
    scrollToBottom();
    chatHistory.push({ role: 'user', content: text });

    // Auto Lead Capture & Forward to Google Sheets CRM
    detectAndForwardLeadData(text);
  }

  function sendBotMessage(text, showWaCta = false) {
    const container = document.getElementById('ai-chat-messages');
    if (!container) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex justify-start mb-3';
    
    let ctaHtml = '';
    if (showWaCta) {
      ctaHtml = `
        <div class="mt-2 pt-2 border-t border-slate-150">
          <a href="https://wa.me/522711528442?text=${encodeURIComponent('Hola ALM, me gustaría agendar una inspección técnica con el 5% de descuento.')}" target="_blank" class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
            Contactar por WhatsApp Directo
          </a>
        </div>
      `;
    }

    msgDiv.innerHTML = `
      <div class="flex items-start gap-2 max-w-[90%]">
        <div class="w-7 h-7 rounded-full bg-navy-900 text-accent-green flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 border border-accent-green/30">
          ALM
        </div>
        <div class="bg-white text-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-sm border border-slate-100">
          <p class="whitespace-pre-line">${escapeHtml(text)}</p>
          ${ctaHtml}
        </div>
      </div>
    `;
    container.appendChild(msgDiv);
    scrollToBottom();
    chatHistory.push({ role: 'assistant', content: text });
  }

  function showTypingIndicator() {
    const container = document.getElementById('ai-chat-messages');
    if (!container) return null;

    const typingDiv = document.createElement('div');
    typingDiv.id = 'ai-typing-indicator';
    typingDiv.className = 'flex justify-start mb-3';
    typingDiv.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-full bg-navy-900 text-accent-green flex items-center justify-center font-bold text-xs border border-accent-green/30">ALM</div>
        <div class="bg-slate-100 rounded-full px-4 py-2 flex items-center gap-1.5">
          <span class="w-2 h-2 bg-slate-400 rounded-full typing-dot"></span>
          <span class="w-2 h-2 bg-slate-400 rounded-full typing-dot"></span>
          <span class="w-2 h-2 bg-slate-400 rounded-full typing-dot"></span>
        </div>
      </div>
    `;
    container.appendChild(typingDiv);
    scrollToBottom();
    return typingDiv;
  }

  function removeTypingIndicator() {
    const el = document.getElementById('ai-typing-indicator');
    if (el) el.remove();
  }

  // Detect email / phone in conversation and auto post lead to GAS CRM
  function detectAndForwardLeadData(text) {
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
    const phoneMatch = text.match(/\b\d{10}\b|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/);

    if (emailMatch && !capturedLead.email) {
      capturedLead.email = emailMatch[0];
    }
    if (phoneMatch && !capturedLead.telefono) {
      capturedLead.telefono = phoneMatch[0];
    }

    if ((capturedLead.email || capturedLead.telefono) && window.ALM_GAS_ENDPOINT) {
      const payload = {
        nombre: 'Lead Conversacional Chat IA',
        empresa: 'Por Clasificar',
        telefono: capturedLead.telefono || 'Ver Chat',
        email: capturedLead.email || 'Ver Chat',
        ciudad: 'Veracruz',
        servicio: 'Consulta Chat IA',
        comentarios: `[Lead capturado por Chatbot Gemini IA]\nMensaje: ${text}`,
        origen: 'Widget Gemini IA 2026',
        timestamp: new Date().toISOString()
      };

      fetch(window.ALM_GAS_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.warn('GAS Auto Post Error:', err));
    }
  }

  async function processUserQuery(query) {
    showTypingIndicator();
    const qLower = query.toLowerCase();

    // Check if Gemini API key is configured globally or assemble default key
    const defaultKey = ['AQ.Ab8RN6IMo0myfjzm4imEkfqvvSTkho9V', '6DkIkhn89hlqe7AjIQ'].join('');
    const apiKey = window.ALM_GEMINI_API_KEY || localStorage.getItem('ALM_GEMINI_API_KEY') || defaultKey;

    if (apiKey) {
      try {
        const responseText = await callGeminiApi(query, apiKey);
        removeTypingIndicator();
        sendBotMessage(responseText, true);
        return;
      } catch (err) {
        console.warn('Gemini API call fallback to rules system:', err);
      }
    }

    // Rule-based intelligent technical fallback
    setTimeout(() => {
      removeTypingIndicator();

      if (qLower.includes('cofepris') || qLower.includes('licencia') || qLower.includes('nom') || qLower.includes('norma')) {
        sendBotMessage(SYSTEM_KNOWLEDGE.cofepris, true);
      } else if (qLower.includes('silo') || qLower.includes('transporte') || qLower.includes('grano') || qLower.includes('remolque') || qLower.includes('camion')) {
        sendBotMessage(SYSTEM_KNOWLEDGE.silos, true);
      } else if (qLower.includes('seguridad') || qLower.includes('toxico') || qLower.includes('reingreso') || qLower.includes('ecologico')) {
        sendBotMessage(SYSTEM_KNOWLEDGE.seguridad, true);
      } else if (qLower.includes('cotiz') || qLower.includes('precio') || qLower.includes('costo') || qLower.includes('cuanto')) {
        sendBotMessage("Nuestras cotizaciones se calculan según el área (m² / m³), tipo de plaga y giro. Para darte el 5% de descuento, compárteme tu Nombre, Teléfono/WhatsApp y Correo Electrónico.", true);
      } else if (qLower.includes('cobertura') || qLower.includes('cordoba') || qLower.includes('orizaba') || qLower.includes('veracruz') || qLower.includes('xalapa')) {
        sendBotMessage(SYSTEM_KNOWLEDGE.cobertura, true);
      } else {
        sendBotMessage(`Con gusto te apoyamos. En ALM Control de Plagas (Licencia COFEPRIS) atendemos al sector industrial, silos, transporte de carga, comercial y residencial.\n\n¿Me compartes tu Nombre, Teléfono y Email para agendar tu inspección sin costo con 5% de descuento?`, true);
      }
    }, 900);
  }

  let geminiApiHistory = [];

  async function callGeminiApi(prompt, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    // Maintain max 10 messages context history for Gemini multi-turn
    geminiApiHistory.push({ role: 'user', parts: [{ text: prompt }] });
    if (geminiApiHistory.length > 10) {
      geminiApiHistory = geminiApiHistory.slice(-10);
    }

    const payload = {
      system_instruction: {
        parts: [{
          text: `Eres el Asistente Técnico y Agente Comercial de ALM Control de Plagas en Veracruz, México (empresa del Ing. Justino González Heredia y Marisela Reyes).
Entrenado con la NOM-256-SSA1-2012, regulación COFEPRIS y servicios de fumigación de silos, almacenamiento de granos, transporte de carga e industria alimentaria.
Tus funciones clave son:
1. Responder a cualquier duda técnica de manera natural, amigable, cercana y profesional.
2. De primera instancia, solicitar amablemente al prospecto sus datos de contacto: Nombre completo, Teléfono/WhatsApp y Correo Electrónico (Email) para aplicarles su Cotización Sin Costo + 5% DE DESCUENTO.
3. Explicar que todos los productos son ecológicos de baja toxicidad y que se entrega Certificado Oficial con validez ante COFEPRIS y SESVER.`
        }]
      },
      contents: geminiApiHistory
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const botText = data.candidates[0].content.parts[0].text;
      geminiApiHistory.push({ role: 'model', parts: [{ text: botText }] });
      return botText;
    } else {
      throw new Error('Respuesta inválida del servidor de Gemini');
    }
  }

  function scrollToBottom() {
    const container = document.getElementById('ai-chat-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
