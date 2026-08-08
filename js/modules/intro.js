/**
 * Module: intro.js
 * Description: 6-Second Atmospheric Splash Screen & Canvas Particle Engine
 */
export function initLogoRevealIntro() {
  const overlay = document.getElementById('intro-overlay');
  const canvas = document.getElementById('intro-canvas');

  if (!overlay || !canvas) return;

  const ctx = canvas.getContext('2d');
  let animationFrameId;
  const particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

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
      p.alpha -= 0.0018;

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
    }, 900);
  }

  // Exact 6.0 Seconds Total Presentation (Triggers fade-out at 5.1s)
  setTimeout(dismissIntro, 5100);
}
