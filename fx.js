/* ==========================================================================
   FLIPPY STUDIO — AMBIENT ENGINE & MULTI-THEME CONTROLLER
   Obsidian Jade (jade) · Molten Crimson (crimson) · Botanical Alabaster (light)
   ========================================================================== */
(function () {
  'use strict';

  const THEME_ORDER = ['jade', 'crimson', 'light'];
  const THEME_LABELS = {
    jade: 'Jade',
    crimson: 'Crimson',
    light: 'Light'
  };
  const THEME_META_COLORS = {
    jade: '#050908',
    crimson: '#090608',
    light: '#edf3f0'
  };
  const THEME_STAR_RGB = {
    jade: ['16, 217, 136', '240, 180, 76'],
    crimson: ['244, 63, 94', '251, 146, 60'],
    light: ['8, 153, 96', '184, 122, 20']
  };

  function getActiveTheme() {
    const t = document.documentElement.getAttribute('data-theme');
    return THEME_ORDER.includes(t) ? t : 'jade';
  }

  function applyTheme(theme) {
    const next = THEME_ORDER.includes(theme) ? theme : 'jade';
    document.documentElement.setAttribute('data-theme', next);
    const meta = document.getElementById('metaThemeColor');
    if (meta) meta.setAttribute('content', THEME_META_COLORS[next] || '#050908');
    const badge = document.getElementById('themeNameBadge');
    if (badge) badge.textContent = THEME_LABELS[next] || 'Jade';

    try {
      localStorage.setItem('flippy_v3_theme', next);
    } catch (e) {}

    ['graphIframe', 'graphIframe2'].forEach((id) => {
      const frame = document.getElementById(id);
      if (frame && frame.contentWindow) {
        try {
          frame.contentWindow.postMessage({ type: 'SET_THEME', theme: next }, '*');
        } catch (e) {}
      }
    });

    window.dispatchEvent(new CustomEvent('flippy:themechange', { detail: { theme: next } }));
  }

  function cycleTheme() {
    const cur = getActiveTheme();
    const idx = THEME_ORDER.indexOf(cur);
    applyTheme(THEME_ORDER[(idx + 1) % THEME_ORDER.length]);
  }

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const mobileThemeToggleBtn = document.getElementById('mobileThemeToggleBtn');
  if (themeToggleBtn) themeToggleBtn.addEventListener('click', cycleTheme);
  if (mobileThemeToggleBtn) mobileThemeToggleBtn.addEventListener('click', cycleTheme);

  // Sync initial label & Graph iframes
  const initBadge = document.getElementById('themeNameBadge');
  if (initBadge) initBadge.textContent = THEME_LABELS[getActiveTheme()] || 'Jade';

  ['graphIframe', 'graphIframe2'].forEach((id) => {
    const frame = document.getElementById(id);
    if (frame) {
      frame.addEventListener('load', () => {
        try {
          frame.contentWindow.postMessage({ type: 'SET_THEME', theme: getActiveTheme() }, '*');
        } catch (e) {}
      });
    }
  });

  // Cursor Aura
  const cursorAura = document.getElementById('cursorAura');
  if (cursorAura) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let auraX = mouseX;
    let auraY = mouseY;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!cursorAura.classList.contains('on')) cursorAura.classList.add('on');
    });

    function animateAura() {
      auraX += (mouseX - auraX) * 0.15;
      auraY += (mouseY - auraY) * 0.15;
      cursorAura.style.transform = `translate3d(${auraX}px, ${auraY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(animateAura);
    }
    animateAura();
  }

  // Theme-Reactive Star & Ember Particle Field
  const canvas = document.getElementById('fxStars');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    const stars = [];

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    class Star {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * Math.max(width, 1);
        this.size = Math.random() * 1.45 + 0.2;
        this.gold = Math.random() < 0.26;
      }

      update() {
        this.z -= 0.42;
        if (this.z <= 0) {
          this.z = Math.max(width, 1);
          this.x = Math.random() * width;
          this.y = Math.random() * height;
        }
      }

      draw(palette, alphaScale) {
        const focal = width / this.z;
        const x = (this.x - width / 2) * focal + width / 2;
        const y = (this.y - height / 2) * focal + height / 2;
        const s = this.size * focal;
        const alpha = Math.max(0, Math.min(1, (1 - this.z / width) * alphaScale));
        const rgb = this.gold ? palette[1] : palette[0];

        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < 170; i++) {
      stars.push(new Star());
    }

    function animateStars() {
      ctx.clearRect(0, 0, width, height);
      const cur = getActiveTheme();
      const palette = THEME_STAR_RGB[cur] || THEME_STAR_RGB.jade;
      const alphaScale = cur === 'light' ? 0.35 : 0.85;
      for (let i = 0; i < stars.length; i++) {
        stars[i].update();
        stars[i].draw(palette, alphaScale);
      }
      requestAnimationFrame(animateStars);
    }

    animateStars();
  }
})();
