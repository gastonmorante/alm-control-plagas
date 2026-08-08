/**
 * Main Application Orchestrator
 * ALM Manejo de Plagas y Fumigaciones Fitosanitarias
 * Architecture: Clean Modular ES Engine + Backward Compatible Bundle
 */
import { initLogoRevealIntro } from './modules/intro.js';
import { initMediaLightbox } from './modules/lightbox.js';
import { initAntEasterEgg } from './modules/easter-egg.js';
import { initLeadForm } from './modules/form.js';
import { initCitySelector } from './modules/city-selector.js';

// Enforce scroll to top on refresh
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);

  // Initialize Core Subsystems
  initLogoRevealIntro();
  initMediaLightbox();
  initAntEasterEgg();
  initLeadForm();
  initCitySelector();
  initSmoothScroll();
  initKeyboardGlobal();
});

/* ==========================================
   Smooth Scrolling Navigation
   ========================================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ==========================================
   Global Escape Key & Accessibility Handler
   ========================================== */
function initKeyboardGlobal() {
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
