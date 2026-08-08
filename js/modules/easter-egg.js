/**
 * Module: easter-egg.js
 * Description: Continuous 2D AABB Physical Collision Detection Engine
 *              between Ant Follower and Ing. Justino's Avatar.
 */
export function initAntEasterEgg() {
  let antContainer = document.getElementById('ant-cursor-container');
  if (!antContainer) {
    antContainer = document.createElement('div');
    antContainer.id = 'ant-cursor-container';
    antContainer.className = 'fixed top-0 left-0 pointer-events-none z-50 transition-opacity duration-500 opacity-0';
    antContainer.innerHTML = `
      <div id="ant-follower" class="w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center filter drop-shadow-md">
        <svg viewBox="0 0 100 100" class="w-full h-full fill-navy-950 stroke-accent-orange">
          <ellipse cx="50" cy="20" rx="10" ry="12" fill="#081129" />
          <path d="M 45 12 Q 35 2 25 5" fill="none" stroke="#E67E22" stroke-width="4" stroke-linecap="round" />
          <path d="M 55 12 Q 65 2 75 5" fill="none" stroke="#E67E22" stroke-width="4" stroke-linecap="round" />
          <circle cx="44" cy="18" r="2.5" fill="#4CAF50" />
          <circle cx="56" cy="18" r="2.5" fill="#4CAF50" />
          <ellipse cx="50" cy="45" rx="12" ry="14" fill="#0D1B3E" />
          <ellipse cx="50" cy="78" rx="16" ry="20" fill="#081129" />
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

  window.addEventListener('pointermove', (e) => {
    updatePosition(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      updatePosition(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  const antFollowerEl = antContainer.querySelector('#ant-follower');
  const avatarContainerEl = document.getElementById('justino-avatar-container');
  const avatarImgEl = document.getElementById('justino-avatar-img');

  const defaultImgSrc = './ing_justino_gonzalez.jpg';
  const reactionImgSrc = './justino_reaccion.jpg';

  // Zero-latency image preload
  const reactionPreload = new Image();
  reactionPreload.src = reactionImgSrc;

  function checkAntAvatarCollision() {
    if (!antFollowerEl || !avatarContainerEl || !avatarImgEl) return;

    const antRect = antFollowerEl.getBoundingClientRect();
    const avatarRect = avatarContainerEl.getBoundingClientRect();

    const isColliding = !(
      antRect.right < avatarRect.left ||
      antRect.left > avatarRect.right ||
      antRect.bottom < avatarRect.top ||
      antRect.top > avatarRect.bottom
    );

    if (isColliding) {
      if (!avatarImgEl.src.includes('justino_reaccion.jpg')) {
        avatarImgEl.src = reactionImgSrc;
      }
      avatarContainerEl.classList.add('ring-4', 'ring-emerald-400/60', 'scale-105');
    } else {
      if (avatarImgEl.src.includes('justino_reaccion.jpg')) {
        avatarImgEl.src = defaultImgSrc;
      }
      avatarContainerEl.classList.remove('ring-4', 'ring-emerald-400/60', 'scale-105');
    }
  }

  function animLoop() {
    const dx = targetX - posX;
    const dy = targetY - posY;
    const dist = Math.hypot(dx, dy);

    if (dist > 1.5) {
      posX += dx * 0.09;
      posY += dy * 0.09;
      const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      currentAngle += (targetAngle - currentAngle) * 0.15;

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
    checkAntAvatarCollision();
    requestAnimationFrame(animLoop);
  }

  requestAnimationFrame(animLoop);
}
