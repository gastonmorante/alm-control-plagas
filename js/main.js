// Force page to always start at the Hero section on refresh/reload
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);
  initLogoRevealIntro();
  initSanityCalculator();
  initFormHandler();
  initSmoothScroll();
  initCitySelector();
  initKeyboardAccessibility();
  initVideoModal();
  initAntCursorFollower();
});

/* ==========================================
   0. AFTER EFFECTS STYLE INTRO LOGO REVEAL
   ========================================== */
function initLogoRevealIntro() {
  const overlay = document.getElementById('intro-overlay');
  const canvas = document.getElementById('intro-canvas');

  if (!overlay || !canvas) return;

  const ctx = canvas.getContext('2d');
  let animationFrameId;
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Particle Engine
  const colors = ['#4CAF50', '#E67E22', '#3498DB', '#FFFFFF'];
  for (let i = 0; i < 45; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2 + (Math.random() - 0.5) * 200,
      radius: Math.random() * 3 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 2.5,
      vy: (Math.random() - 0.5) * 2.5,
      alpha: Math.random() * 0.7 + 0.3
    });
  }

  function renderParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.restore();

      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.003;

      if (p.alpha <= 0) {
        p.x = canvas.width / 2 + (Math.random() - 0.5) * 150;
        p.y = canvas.height / 2 + (Math.random() - 0.5) * 150;
        p.alpha = Math.random() * 0.7 + 0.3;
      }
    });

    animationFrameId = requestAnimationFrame(renderParticles);
  }

  renderParticles();

  function dismissIntro() {
    overlay.style.pointerEvents = 'none';
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.style.display = 'none';
      cancelAnimationFrame(animationFrameId);
    }, 600);
  }

  // Auto dismiss triggers fade-out at 2.4s and fully completes at 3.0s total
  setTimeout(dismissIntro, 2400);
}

/* ==========================================
   1. CALCULADORA INTERACTIVA DE RIESGO COFEPRIS
   ========================================== */function initSanityCalculator() {
  const sectorSelect = document.getElementById('calc-sector');
  const sizeInput = document.getElementById('calc-size');
  const sizeValueDisplay = document.getElementById('calc-size-val');
  const lastFumigationSelect = document.getElementById('calc-last-fumigation');
  const licenseSelect = document.getElementById('calc-license');

  const riskBadge = document.getElementById('calc-risk-badge');
  const fineEstimateDisplay = document.getElementById('calc-fine-estimate');
  const actionRecommendation = document.getElementById('calc-recommendation');
  const calcCtaBtn = document.getElementById('calc-cta-btn');

  if (!sectorSelect || !sizeInput) return;

  function calculateRisk() {
    const sector = sectorSelect.value;
    const size = parseInt(sizeInput.value, 10);
    const monthsSince = parseInt(lastFumigationSelect.value, 10);
    const license = licenseSelect ? licenseSelect.value : 'incompleta';

    sizeValueDisplay.textContent = size.toLocaleString('es-MX') + ' m² / m³';

    // Legal parameters calculation based on Ley General de Salud Arts 194, 198, 417, 421 & NOM-256-SSA1-2012
    let riskLevel = 'MEDIO - REQUIERE PREVENCIÓN';
    let minFine = 226280; // 2,000 UMAS
    let maxFine = 678840; // 6,000 UMAS
    let riskColor = 'text-amber-600 bg-amber-50 border-amber-300';
    let recommendation = 'Se recomienda inspección técnica y actualización de bitácora sanitaria en los próximos 15 días.';

    const isIndustrialOrLogistics = (sector === 'industrial_silos' || sector === 'transporte');

    if (license === 'ninguna' || (isIndustrialOrLogistics && monthsSince >= 2) || (monthsSince >= 7)) {
      riskLevel = '🚨 CRÍTICO - RIESGO DE CLAUSURA E INMOVILIZACIÓN';
      riskColor = 'text-red-600 bg-red-50 border-red-300 font-extrabold animate-pulse';
      minFine = 350000;
      maxFine = 678840;
      recommendation = '⚠️ EXPOSICIÓN ALTA A SANCIÓN (Arts. 417 y 421 Ley General de Salud). Carecer de certificado mensual/trimestral o bitácora NOM-256 autoriza a COFEPRIS/SESVER a suspender actividades o inmovilizar granos/mercancía. ¡Regularízate hoy con 5% OFF!';
    } else if (license === 'incompleta' || monthsSince >= 3) {
      riskLevel = '⚠️ ALTO - VULNERABLE A INSPECION SESVER';
      riskColor = 'text-orange-600 bg-orange-50 border-orange-300 font-bold';
      minFine = 226280;
      maxFine = 450000;
      recommendation = 'Excedido el periodo de mantenimiento recomendado. Se requiere emisión urgente de Certificado Fitosanitario Oficial con validez COFEPRIS para evitar observaciones en bitácora.';
    } else if (license === 'vigente' && monthsSince === 1) {
      riskLevel = '✅ ESTATUS EN REGLA (PROTEGIDO)';
      riskColor = 'text-emerald-700 bg-emerald-50 border-emerald-300 font-bold';
      minFine = 0;
      maxFine = 0;
      recommendation = '¡Excelente! Tu establecimiento cuenta con blindaje sanitario activo. Recuerda renovar tu certificado según la frecuencia de tu giro (mensual para silos/transporte, trimestral comercial).';
    }

    // Format Fine output
    let fineText = `${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(minFine)} - ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(maxFine)} MXN (2,000 a 6,000 UMA)`;
    if (minFine === 0) {
      fineText = '$0 MXN (Sin Exposición a Sanción Sanitaria)';
    }

    riskBadge.className = `inline-block px-3 py-1 text-xs sm:text-sm rounded-full border ${riskColor}`;
    riskBadge.textContent = riskLevel;

    fineEstimateDisplay.textContent = fineText;
    actionRecommendation.textContent = recommendation;
  }

  sectorSelect.addEventListener('change', calculateRisk);
  sizeInput.addEventListener('input', calculateRisk);
  lastFumigationSelect.addEventListener('change', calculateRisk);
  if (licenseSelect) licenseSelect.addEventListener('change', calculateRisk);

  if (calcCtaBtn) {
    calcCtaBtn.addEventListener('click', () => {
      const formSection = document.getElementById('cotizacion');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
        const commentsField = document.querySelector('textarea[name="comentarios"]');
        if (commentsField) {
          commentsField.value = `[Evaluación desde Calculadora COFEPRIS]\nGiro: ${sectorSelect.options[sectorSelect.selectedIndex].text}\nSuperficie/Capacidad: ${sizeInput.value}m²\nÚltima Fumigación: ${lastFumigationSelect.options[lastFumigationSelect.selectedIndex].text}\nEstatus Licencia: ${licenseSelect ? licenseSelect.options[licenseSelect.selectedIndex].text : 'N/A'}`;
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
      email: formData.get('email') || 'No especificado',
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
        const msg = encodeURIComponent(`Hola ALM Control de Plagas. Acabo de solicitar una cotización en su sitio web.\nNombre: ${data.nombre}\nEmpresa: ${data.empresa}\nEmail: ${data.email}\nCiudad: ${data.ciudad}\nServicio: ${data.servicio}`);
        const waUrl = `https://wa.me/522711528442?text=${msg}`;
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
        <p class="text-xs">Tu mensaje se ha preparado. Puedes comunicarte directamente al WhatsApp de respuesta rápida: <a href="https://wa.me/522711528442" target="_blank" class="underline font-bold">271 152 8442</a>.</p>
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
      if (cityPhone) cityPhone.textContent = 'Atención WhatsApp & Directa: 271 152 8442 / 271 140 7953';
    });
  });
}

/* ==========================================
   5. REPRODUCTOR INTERACTIVO Y MODAL DE VIDEO
   ========================================== */
function initVideoModal() {
  const openSilosCardBtn = document.getElementById('open-video-btn-silos');
  const openSilosLinkBtn = document.getElementById('open-video-link-silos');
  const openPipasCardBtn = document.getElementById('open-video-btn-pipas');
  const openPipasLinkBtn = document.getElementById('open-video-link-pipas');

  const videoModal = document.getElementById('video-modal');
  const vlogPlayer = document.getElementById('vlog-player');
  const videoTitle = videoModal ? videoModal.querySelector('h3') : null;
  const closeBtn = document.getElementById('close-video-btn');
  const closeBtnBottom = document.getElementById('close-video-btn-bottom');
  const ctaBtn = document.getElementById('video-modal-cta');

  if (!videoModal || !vlogPlayer) return;

  const VIDEOS = {
    silos: {
      src: './videos/video_silos.mp4',
      title: 'Demostración Técnica: Fitosanidad y Control en Silos de Granos'
    },
    pipas: {
      src: './videos/video_pipas.mp4',
      title: 'Demostración Técnica: Blindaje Fitosanitario en Pipas y Tolvas'
    }
  };

  function openModal(videoKey) {
    const info = VIDEOS[videoKey] || VIDEOS.silos;
    vlogPlayer.src = info.src;
    vlogPlayer.load();

    if (videoTitle) videoTitle.textContent = info.title;

    videoModal.classList.remove('hidden');
    videoModal.classList.add('flex');

    const playPromise = vlogPlayer.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Reproducción asistida por política de navegador:', err);
        // If unmuted playback is restricted, play muted as fallback
        vlogPlayer.muted = true;
        vlogPlayer.play().catch(e => console.error('Play error:', e));
      });
    }
  }

  function closeModal() {
    vlogPlayer.pause();
    vlogPlayer.currentTime = 0;
    videoModal.classList.add('hidden');
    videoModal.classList.remove('flex');
  }

  if (openSilosCardBtn) openSilosCardBtn.addEventListener('click', () => openModal('silos'));
  if (openSilosLinkBtn) openSilosLinkBtn.addEventListener('click', () => openModal('silos'));
  if (openPipasCardBtn) openPipasCardBtn.addEventListener('click', () => openModal('pipas'));
  if (openPipasLinkBtn) openPipasLinkBtn.addEventListener('click', () => openModal('pipas'));

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (closeBtnBottom) closeBtnBottom.addEventListener('click', closeModal);

  if (ctaBtn) {
    ctaBtn.addEventListener('click', closeModal);
  }

  // Close when clicking dark backdrop outside modal box
  videoModal.addEventListener('click', (e) => {
    if (e.target === videoModal) {
      closeModal();
    }
  });

  // Store closeModal globally for ESC key handler
  window.closeALMVideoModal = closeModal;
}

/* ==========================================
   6. ACCESIBILIDAD Y TECLA ESCAPE
   ========================================== */
function initKeyboardAccessibility() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const aiModal = document.getElementById('ai-chat-modal');
      if (aiModal && aiModal.classList.contains('active')) {
        aiModal.classList.remove('active');
      }
      if (window.closeALMVideoModal) {
        window.closeALMVideoModal();
      }
    }
  });
}

/* ==========================================
   7. HORMIGUITA INTERACTIVA SEGUIDORA DE CURSOR (PC & MOBILE)
   ========================================== */
function initAntCursorFollower() {
  let antContainer = document.getElementById('ant-cursor-container');
  if (!antContainer) {
    antContainer = document.createElement('div');
    antContainer.id = 'ant-cursor-container';
    antContainer.className = 'fixed top-0 left-0 pointer-events-none z-50 transition-opacity duration-500 opacity-0';
    antContainer.innerHTML = `
      <div id="ant-follower" class="w-7 h-7 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center filter drop-shadow-md">
        <svg viewBox="0 0 100 100" class="w-full h-full fill-navy-950 stroke-accent-orange">
          <!-- Ant Head -->
          <ellipse cx="50" cy="20" rx="10" ry="12" fill="#081129" />
          <!-- Ant Antennas -->
          <path d="M 45 12 Q 35 2 25 5" fill="none" stroke="#E67E22" stroke-width="4" stroke-linecap="round" />
          <path d="M 55 12 Q 65 2 75 5" fill="none" stroke="#E67E22" stroke-width="4" stroke-linecap="round" />
          <!-- Ant Eyes -->
          <circle cx="44" cy="18" r="2.5" fill="#4CAF50" />
          <circle cx="56" cy="18" r="2.5" fill="#4CAF50" />
          <!-- Ant Thorax -->
          <ellipse cx="50" cy="45" rx="12" ry="14" fill="#0D1B3E" />
          <!-- Ant Abdomen -->
          <ellipse cx="50" cy="78" rx="16" ry="20" fill="#081129" />
          <!-- Ant Legs -->
          <path d="M 40 40 Q 20 30 10 40" fill="none" stroke="#081129" stroke-width="4" stroke-linecap="round" />
          <path d="M 60 40 Q 80 30 90 40" fill="none" stroke="#081129" stroke-width="4" stroke-linecap="round" />
          <path d="M 40 48 Q 15 48 5 55" fill="none" stroke="#081129" stroke-width="4" stroke-linecap="round" />
          <path d="M 60 48 Q 85 48 95 55" fill="none" stroke="#081129" stroke-width="4" stroke-linecap="round" />
          <path d="M 40 56 Q 20 70 12 80" fill="none" stroke="#081129" stroke-width="4" stroke-linecap="round" />
          <path d="M 60 56 Q 80 70 88 80" fill="none" stroke="#081129" stroke-width="4" stroke-linecap="round" />
        </svg>
      </div>
    `;
    document.body.appendChild(antContainer);
  }

  let posX = window.innerWidth / 2;
  let posY = window.innerHeight / 2;
  let targetX = posX;
  let targetY = posY;
  let currentAngle = 0;
  let idleTimeout = null;

  function updatePosition(x, y) {
    targetX = x;
    targetY = y;
    antContainer.classList.remove('opacity-0');
    antContainer.classList.add('opacity-90');

    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
      antContainer.classList.remove('opacity-90');
      antContainer.classList.add('opacity-0');
    }, 3500);
  }

  // Mouse / Pointer Listener
  window.addEventListener('pointermove', (e) => {
    updatePosition(e.clientX, e.clientY);
  }, { passive: true });

  // Touch Listeners for Mobile devices
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      updatePosition(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      updatePosition(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  // Smooth Motion Loop
  function animLoop() {
    const dx = targetX - posX;
    const dy = targetY - posY;
    const dist = Math.hypot(dx, dy);

    if (dist > 1.5) {
      posX += dx * 0.08;
      posY += dy * 0.08;
      const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      currentAngle += (targetAngle - currentAngle) * 0.12;
    }

    antContainer.style.transform = `translate3d(${posX}px, ${posY}px, 0px) rotate(${currentAngle}deg)`;
    requestAnimationFrame(animLoop);
  }

  requestAnimationFrame(animLoop);
}
