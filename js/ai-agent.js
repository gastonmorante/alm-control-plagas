/**
 * ALM CONTROL DE PLAGAS - AI AGENT WIDGET (Gemini 1.5 Pro Bridge)
 * Lead Developer: Gastón | NegocioUp
 */

(function () {
  const SYSTEM_KNOWLEDGE = {
    cofepris: "ALM Control de Plagas opera estrictamente bajo Licencia Sanitaria expedida por la COFEPRIS y cumple con la Norma Oficial Mexicana NOM-256-SSA1-2012. Todos nuestros tratamientos incluyen Certificado Oficial de Fumigación válido ante inspecciones sanitarias estatales y federales.",
    silos: "Para el sector industrial, agrícola y de transporte de carga en Veracruz, realizamos tratamiento especializado de fumigación de silos, bodegas de almacenamiento de granos y desinfección sanitaria de flotillas y remolques, protegiendo contra picudos, gorgojos y roedores.",
    seguridad: "Utilizamos exclusivamente productos ecológicos de baja toxicidad registrados ante COFEPRIS. Proporcionamos ficha técnica de seguridad y tiempos de reingreso seguros (habitualmente de 2 a 4 horas según la técnica aplicada).",
    cobertura: "Brindamos atención inmediata en Córdoba, Fortín, Orizaba, Veracruz puerto, Boca del Río, Xalapa y Tierra Blanca.",
    contacto: "Nuestros teléfonos de atención técnica 24/7 son 271 140 7953 y 271 715 7830. ¿Deseas que agendemos una inspección en tu empresa?"
  };

  let chatHistory = [];
  let isChatOpen = false;

  document.addEventListener('DOMContentLoaded', () => {
    initChatWidgetUI();
  });

  function initChatWidgetUI() {
    const triggerBtn = document.getElementById('ai-chat-trigger');
    const modal = document.getElementById('ai-chat-modal');
    const closeBtn = document.getElementById('ai-chat-close');
    const sendBtn = document.getElementById('ai-chat-send');
    const inputField = document.getElementById('ai-chat-input');
    const messagesContainer = document.getElementById('ai-chat-messages');

    if (!triggerBtn || !modal) return;

    // Toggle Modal
    triggerBtn.addEventListener('click', () => {
      isChatOpen = !isChatOpen;
      if (isChatOpen) {
        modal.classList.add('active');
        inputField.focus();
        if (chatHistory.length === 0) {
          sendBotMessage("¡Hola! Soy el Asistente Técnico de ALM Control de Plagas. 🛡️\n\n¿En qué sector o plaga necesitas asistencia hoy? Puedo informarte sobre cumplimiento de la NOM-256, certificados COFEPRIS o tratamientos para transporte e industria.");
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
          <a href="https://wa.me/522711407953?text=${encodeURIComponent('Hola, me gustaría agendar una inspección técnica con ALM.')}" target="_blank" class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors">
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

  async function processUserQuery(query) {
    showTypingIndicator();
    const qLower = query.toLowerCase();

    // Check if Gemini API key is configured globally
    const apiKey = window.ALM_GEMINI_API_KEY || '';

    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
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
        sendBotMessage("Nuestras cotizaciones se calculan según el área (m² / m³), tipo de plaga y giro del establecimiento para garantizar la técnica más efectiva. ¿Te gustaría dejar tus datos en el formulario o hablar directo con un técnico por WhatsApp?", true);
      } else if (qLower.includes('cobertura') || qLower.includes('cordoba') || qLower.includes('orizaba') || qLower.includes('veracruz') || qLower.includes('xalapa')) {
        sendBotMessage(SYSTEM_KNOWLEDGE.cobertura, true);
      } else {
        sendBotMessage(`Con gusto podemos apoyarte en tu servicio de blindaje sanitario. En ALM Control de Plagas atendemos al sector industrial, comercial y residencial con garantía por escrito y productos autorizados por COFEPRIS.\n\n¿Quieres comunicarte con nuestro equipo técnico ahora mismo?`, true);
      }
    }, 900);
  }

  async function callGeminiApi(prompt, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
    const payload = {
      system_instruction: {
        parts: [{ text: "Eres el asistente técnico de ALM Control de Plagas en Veracruz, México. Responde siempre con profesionalismo, enfatizando el cumplimiento de la NOM-256-SSA1-2012, licencias COFEPRIS y el uso de productos ecológicos de baja toxicidad para silos, transporte de carga, plantas de alimentos y residencias." }]
      },
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
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
