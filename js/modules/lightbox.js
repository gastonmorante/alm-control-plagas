/**
 * Module: lightbox.js
 * Description: React-Style Unified Media Lightbox (HD Videos & Full-Size Photo Zooming)
 */
export function initMediaLightbox() {
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

  // Global ESC key binding
  window.closeALMVideoModal = closeModal;
}
