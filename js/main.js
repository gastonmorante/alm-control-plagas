// Force page to always start at the Hero section on refresh/reload
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);
  initLogoRevealIntro();
  initFormHandler();
  initSmoothScroll();
  initCitySelector();
  initKeyboardAccessibility();
  initVideoModal();
  initAntCursorFollower();
});

/* ==========================================
   0. AFTER EFFECTS STYLE INTRO LOGO REVEAL (6 SECONDS TOTAL DURATION)
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

  // Calibrated Particle Engine for 6-Second Presentation
  const colors = ['#4CAF50', '#E67E22', '#3498DB', '#FFFFFF', '#81C784'];
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 300,
      y: canvas.height / 2 + (Math.random() - 0.5) * 300,
      radius: Math.random() * 2.5 + 0.8,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 1.0,
      vy: (Math.random() - 0.5) * 1.0,
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
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.restore();

      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.0018; // Smooth, slow fade suited for 6-second presentation

      if (p.alpha <= 0) {
        p.x = canvas.width / 2 + (Math.random() - 0.5) * 250;
        p.y = canvas.height / 2 + (Math.random() - 0.5) * 250;
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
    }, 900); // 0.9s cubic-bezier fade-out finishes smoothly
  }

  // Exact 6.0 Seconds Total Duration (Triggers fade-out at 5.1s, fully dismisses at 6.0s)
  setTimeout(dismissIntro, 5100);
}

/* ==========================================
   1. CAPTURA Y ENVÍO DE FORMULARIO DE LEADS
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
/* ==========================================
   5. REPRODUCTOR Y LIGHTBOX MULTIMEDIA REACT-STYLE (VIDEOS & FOTOGRAFÍAS)
   ========================================== */
function initVideoModal() {
  const videoModal = document.getElementById('video-modal');
  const vlogPlayer = document.getElementById('vlog-player');
  const photoPlayer = document.getElementById('lightbox-photo-player');
  const modalBadge = document.getElementById('modal-media-badge');
  const videoTitle = document.getElementById('modal-media-title');
  const modalCaption = document.getElementById('modal-media-caption');
  const closeBtn = document.getElementById('close-video-btn');
  const closeBtnBottom = document.getElementById('close-video-btn-bottom');
  const ctaBtn = document.getElementById('video-modal-cta');

  if (!videoModal) return;

  const VIDEOS = {
    silos: {
      src: './videos/video_silos.mp4',
      title: 'Demostración Técnica: Fitosanidad y Control en Silos de Granos',
      badge: 'Caso en Video ALM',
      caption: 'Tratamiento fitosanitario y desgasificación en silos y plantas de almacenamiento.'
    },
    pipas: {
      src: './videos/video_pipas.mp4',
      title: 'Demostración Técnica: Tratamientos Fitosanitarios en Pipas y Tolvas',
      badge: 'Caso en Video ALM',
      caption: 'Sanitización y control fitosanitario certificado en transporte de grado alimenticio.'
    }
  };

  function openVideo(videoKey) {
    const info = VIDEOS[videoKey] || VIDEOS.silos;
    
    if (photoPlayer) photoPlayer.classList.add('hidden');
    if (vlogPlayer) {
      vlogPlayer.classList.remove('hidden');
      vlogPlayer.src = info.src;
      vlogPlayer.load();
    }

    if (modalBadge) {
      modalBadge.textContent = info.badge;
      modalBadge.className = 'bg-accent-orange text-white text-[10px] sm:text-xs font-extrabold px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider shrink-0 shadow';
    }
    if (videoTitle) videoTitle.textContent = info.title;
    if (modalCaption) modalCaption.textContent = info.caption;

    videoModal.classList.remove('hidden');
    videoModal.classList.add('flex');

    if (vlogPlayer) {
      const playPromise = vlogPlayer.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Reproducción asistida por política de navegador:', err);
          vlogPlayer.muted = true;
          vlogPlayer.play().catch(e => console.error('Play error:', e));
        });
      }
    }
  }

  function openPhoto(src, title) {
    if (vlogPlayer) {
      vlogPlayer.pause();
      vlogPlayer.classList.add('hidden');
    }
    if (photoPlayer) {
      photoPlayer.src = src;
      photoPlayer.alt = title;
      photoPlayer.classList.remove('hidden');
    }

    if (modalBadge) {
      modalBadge.textContent = 'Fotografía de Operación ALM';
      modalBadge.className = 'bg-emerald-600 text-white text-[10px] sm:text-xs font-extrabold px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider shrink-0 shadow';
    }
    if (videoTitle) videoTitle.textContent = title || 'Operación Técnica en Campo ALM';
    if (modalCaption) modalCaption.textContent = 'Personal técnico certificado con equipo de protección y productos avalados por COFEPRIS.';

    videoModal.classList.remove('hidden');
    videoModal.classList.add('flex');
  }

  function closeModal() {
    if (vlogPlayer) {
      vlogPlayer.pause();
      vlogPlayer.currentTime = 0;
    }
    videoModal.classList.add('hidden');
    videoModal.classList.remove('flex');
  }

  // Bind all gallery media cards (videos and photos)
  const galleryCards = document.querySelectorAll('.gallery-media-card');
  galleryCards.forEach(card => {
    card.addEventListener('click', () => {
      const type = card.getAttribute('data-type');
      if (type === 'video') {
        const key = card.getAttribute('data-key') || 'silos';
        openVideo(key);
      } else if (type === 'image') {
        const src = card.getAttribute('data-src');
        const title = card.getAttribute('data-title');
        openPhoto(src, title);
      }
    });
  });

  // Also bind external video demo buttons
  const externalVideoButtons = [
    document.getElementById('open-video-link-silos'),
    document.getElementById('open-video-btn-silos-card'),
    document.getElementById('open-video-btn-pipas-card')
  ];
  externalVideoButtons.forEach(btn => {
    if (btn && !btn.classList.contains('gallery-media-card')) {
      btn.addEventListener('click', () => openVideo('silos'));
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (closeBtnBottom) closeBtnBottom.addEventListener('click', closeModal);
  if (ctaBtn) ctaBtn.addEventListener('click', closeModal);

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
   7. HORMIGUITA INTERACTIVA SEGUIDORA DE CURSOR CON ANIMACIÓN DE PATITAS (PC & MOBILE)
   ========================================== */
function initAntCursorFollower() {
  let antContainer = document.getElementById('ant-cursor-container');
  if (!antContainer) {
    antContainer = document.createElement('div');
    antContainer.id = 'ant-cursor-container';
    antContainer.className = 'fixed top-0 left-0 pointer-events-none z-50 transition-opacity duration-500 opacity-0';
    antContainer.innerHTML = `
      <div id="ant-follower" class="w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center filter drop-shadow-md">
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
          <!-- Ant Animated Legs (6 Legs) -->
          <path id="ant-leg-l1" d="M 40 40 Q 20 30 10 40" fill="none" stroke="#081129" stroke-width="4" stroke-linecap="round" />
          <path id="ant-leg-r1" d="M 60 40 Q 80 30 90 40" fill="none" stroke="#081129" stroke-width="4" stroke-linecap="round" />
          <path id="ant-leg-l2" d="M 40 48 Q 15 48 5 55" fill="none" stroke="#081129" stroke-width="4" stroke-linecap="round" />
          <path id="ant-leg-r2" d="M 60 48 Q 85 48 95 55" fill="none" stroke="#081129" stroke-width="4" stroke-linecap="round" />
          <path id="ant-leg-l3" d="M 40 56 Q 20 70 12 80" fill="none" stroke="#081129" stroke-width="4" stroke-linecap="round" />
          <path id="ant-leg-r3" d="M 60 56 Q 80 70 88 80" fill="none" stroke="#081129" stroke-width="4" stroke-linecap="round" />
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
  let stepCycle = 0;
  let idleTimeout = null;

  const legL1 = antContainer.querySelector('#ant-leg-l1');
  const legR1 = antContainer.querySelector('#ant-leg-r1');
  const legL2 = antContainer.querySelector('#ant-leg-l2');
  const legR2 = antContainer.querySelector('#ant-leg-r2');
  const legL3 = antContainer.querySelector('#ant-leg-l3');
  const legR3 = antContainer.querySelector('#ant-leg-r3');

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

  // --- EASTER EGG: Ant Physical Collision Detection Engine with Ing. Justino Avatar ---
  const antFollowerEl = antContainer.querySelector('#ant-follower');
  const avatarContainerEl = document.getElementById('justino-avatar-container');
  const avatarImgEl = document.getElementById('justino-avatar-img');

  // Preload reaction image immediately to guarantee zero-latency, zero-flicker swap
  const reactionImgObj = new Image();
  reactionImgObj.src = './justino_reaccion.jpg';

  const defaultImgSrc = './ing_justino_gonzalez.jpg';
  const reactionImgSrc = './justino_reaccion.jpg';

  /**
   * Continuous 2D Bounding Box (AABB) Collision Detection
   * Evaluates physical overlap between ant follower DOM bounding rect and Justino's avatar DOM bounding rect.
   * Runs in animation loop (requestAnimationFrame) independent of raw mouse pointer hover.
   */
  function checkAntAvatarCollision() {
    if (!antFollowerEl || !avatarContainerEl || !avatarImgEl) return;

    // Fetch live screen viewport bounding rectangles
    const antRect = antFollowerEl.getBoundingClientRect();
    const avatarRect = avatarContainerEl.getBoundingClientRect();

    // Check 2D Axis-Aligned Bounding Box Overlap
    const isColliding = !(
      antRect.right < avatarRect.left ||
      antRect.left > avatarRect.right ||
      antRect.bottom < avatarRect.top ||
      antRect.top > avatarRect.bottom
    );

    if (isColliding) {
      // Swap avatar image to reaction photo when ant physically touches the avatar
      if (!avatarImgEl.src.includes('justino_reaccion.jpg')) {
        avatarImgEl.src = reactionImgSrc;
      }
      avatarContainerEl.classList.add('ring-4', 'ring-emerald-400/60', 'scale-105');
    } else {
      // Immediately restore original avatar photo when ant steps away
      if (avatarImgEl.src.includes('justino_reaccion.jpg')) {
        avatarImgEl.src = defaultImgSrc;
      }
      avatarContainerEl.classList.remove('ring-4', 'ring-emerald-400/60', 'scale-105');
    }
  }

  // Smooth Motion Loop with Realistic Ant Leg Wiggling Animation & Collision Detection
  function animLoop() {
    const dx = targetX - posX;
    const dy = targetY - posY;
    const dist = Math.hypot(dx, dy);

    if (dist > 1.5) {
      posX += dx * 0.09;
      posY += dy * 0.09;
      const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      currentAngle += (targetAngle - currentAngle) * 0.15;

      // Leg Walking Dynamics (Alternating Tripod Gait)
      stepCycle += Math.min(dist * 0.18, 0.45);
      const swing1 = Math.sin(stepCycle) * 7;
      const swing2 = Math.cos(stepCycle) * 7;

      if (legL1) legL1.setAttribute('d', `M 40 40 Q 20 ${30 + swing1} 10 ${40 + swing1}`);
      if (legR1) legR1.setAttribute('d', `M 60 40 Q 80 ${30 - swing1} 90 ${40 - swing1}`);
      if (legL2) legL2.setAttribute('d', `M 40 48 Q 15 ${48 - swing2} 5 ${55 - swing2}`);
      if (legR2) legR2.setAttribute('d', `M 60 48 Q 85 ${48 + swing2} 95 ${55 + swing2}`);
      if (legL3) legL3.setAttribute('d', `M 40 56 Q 20 ${70 + swing1} 12 ${80 + swing1}`);
      if (legR3) legR3.setAttribute('d', `M 60 56 Q 80 ${70 - swing1} 88 ${80 - swing1}`);
    }

    antContainer.style.transform = `translate3d(${posX}px, ${posY}px, 0px) rotate(${currentAngle}deg)`;
    
    // Evaluate Easter Egg collision on every animation frame
    checkAntAvatarCollision();

    requestAnimationFrame(animLoop);
  }

  requestAnimationFrame(animLoop);
}
