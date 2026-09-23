/**
 * Module: legal.js
 * Description: Handles Cookie Consent Banner (Google Consent Mode v2 compliant)
 * and Legal Compliance Modals (Aviso de Privacidad, Términos y Condiciones, Marco Legal COFEPRIS)
 */

export function initLegalSystem() {
  initCookieConsent();
  initLegalModals();
}

/**
 * Cookie Consent Manager compliant with Google Consent Mode v2 and Meta standards
 */
function initCookieConsent() {
  const banner = document.getElementById('alm-cookie-banner');
  const btnAcceptAll = document.getElementById('cookie-accept-all');
  const btnAcceptEssential = document.getElementById('cookie-accept-essential');
  const btnOpenPrivacy = document.getElementById('cookie-privacy-link');

  if (!banner) return;

  const savedConsent = localStorage.getItem('alm_cookie_consent');

  // Configure Google Consent Mode v2 default
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  if (!savedConsent) {
    // Default: Denied until user interaction
    gtag('consent', 'default', {
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'analytics_storage': 'denied',
      'wait_for_update': 500
    });

    // Show banner after brief delay
    setTimeout(() => {
      banner.classList.remove('hidden');
      banner.classList.add('flex');
    }, 1200);
  } else if (savedConsent === 'all') {
    gtag('consent', 'default', {
      'ad_storage': 'granted',
      'ad_user_data': 'granted',
      'ad_personalization': 'granted',
      'analytics_storage': 'granted'
    });
  } else {
    gtag('consent', 'default', {
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'analytics_storage': 'denied'
    });
  }

  // Accept all cookies
  if (btnAcceptAll) {
    btnAcceptAll.addEventListener('click', () => {
      localStorage.setItem('alm_cookie_consent', 'all');
      gtag('consent', 'update', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted',
        'analytics_storage': 'granted'
      });
      banner.classList.add('hidden');
      banner.classList.remove('flex');
    });
  }

  // Accept only essential cookies
  if (btnAcceptEssential) {
    btnAcceptEssential.addEventListener('click', () => {
      localStorage.setItem('alm_cookie_consent', 'essential');
      gtag('consent', 'update', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'denied'
      });
      banner.classList.add('hidden');
      banner.classList.remove('flex');
    });
  }

  // Privacy link inside banner
  if (btnOpenPrivacy) {
    btnOpenPrivacy.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('modal-privacy');
    });
  }
}

/**
 * Modals for Privacy Policy, Terms & Conditions, and Legal Regulatory Framework
 */
function initLegalModals() {
  // Triggers across the page
  document.querySelectorAll('[data-legal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const targetType = trigger.getAttribute('data-legal');
      if (targetType === 'privacy') openModal('modal-privacy');
      if (targetType === 'terms') openModal('modal-terms');
      if (targetType === 'compliance') openModal('modal-compliance');
    });
  });

  // Close buttons
  document.querySelectorAll('.legal-modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.legal-modal');
      if (modal) closeModal(modal.id);
    });
  });

  // Close on backdrop click
  document.querySelectorAll('.legal-modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.legal-modal:not(.hidden)').forEach(modal => {
        closeModal(modal.id);
      });
    }
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.classList.add('overflow-hidden');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  // Only remove overflow-hidden if no other modals are active
  const remaining = document.querySelectorAll('.legal-modal:not(.hidden)');
  if (remaining.length === 0) {
    document.body.classList.remove('overflow-hidden');
  }
}
