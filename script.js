/* =========================================================
   Eoin Houstoun portfolio, v6
   Each feature is a small init function; one failing never
   blocks the rest. Content is visible without JS or GSAP.
   ========================================================= */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  [initTheme, initNav, initExpanders, initSlideshows, initProjects, initRailAccordions,
   initSpotlight, initConstellation, initMotion].forEach((fn) => {
    try { fn(); } catch (e) { console.warn(fn.name, e); }
  });
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});

/* ===== THEME TOGGLE ===== */
function initTheme() {
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const meta = document.querySelector('meta[name="theme-color"]');
  const apply = (theme) => {
    root.setAttribute('data-theme', theme);
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f5f7fa' : '#0a0a0a');
    if (btn) btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
  };
  apply(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  if (btn) btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('eh-theme', next); } catch (e) {}
    apply(next);
  });
}

/* ===== MOBILE NAV ===== */
function initNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;
  const set = (open) => {
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => set(!links.classList.contains('open')));
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  document.addEventListener('click', (e) => {
    if (links.classList.contains('open') && !links.contains(e.target) && !toggle.contains(e.target)) set(false);
  });
}

/* ===== DETAILS EXPANDERS ===== */
function initExpanders() {
  document.querySelectorAll('.expander-toggle').forEach((btn) => {
    const body = document.getElementById(btn.getAttribute('aria-controls'));
    if (!body) return;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      body.classList.toggle('open', open);
      const label = btn.querySelector('span');
      if (label) label.textContent = open ? 'Less' : 'Details';
    });
  });
}

/* ===== IMAGE SLIDESHOWS ===== */
function initSlideshows() {
  document.querySelectorAll('.slideshow').forEach((box) => {
    const slides = [...box.querySelectorAll('.slide')];
    const dotsBox = box.querySelector('.slide-dots');
    if (slides.length < 2) return;
    let current = 0;
    const dots = slides.map((_, i) => {
      if (!dotsBox) return null;
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Show image ${i + 1} of ${slides.length}`);
      dot.addEventListener('click', () => goTo(i));
      dotsBox.appendChild(dot);
      return dot;
    });
    function goTo(i) {
      slides[current].classList.remove('active');
      dots[current]?.classList.remove('active');
      current = i;
      slides[current].classList.add('active');
      dots[current]?.classList.add('active');
    }
    goTo(0);
    if (reduceMotion) return;
    const every = parseInt(box.dataset.interval, 10) || 4000;
    let timer = setInterval(() => goTo((current + 1) % slides.length), every);
    box.addEventListener('mouseenter', () => clearInterval(timer));
    box.addEventListener('mouseleave', () => { timer = setInterval(() => goTo((current + 1) % slides.length), every); });
  });
}

/* ===== PROJECT FILTERS + SHOW ALL ===== */
function initProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  const chips = [...document.querySelectorAll('.filter-chip')];
  const items = [...grid.querySelectorAll('.project-card, .extra-mini')];
  const more = document.getElementById('projectsToggle');

  chips.forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    grid.classList.toggle('filtered', f !== 'all');
    items.forEach((el) => { el.hidden = f !== 'all' && !el.dataset.cat.split(' ').includes(f); });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }));

  if (more) more.addEventListener('click', () => {
    const open = !grid.classList.contains('expanded');
    grid.classList.toggle('expanded', open);
    more.setAttribute('aria-expanded', String(open));
    more.innerHTML = open ? 'Show fewer projects' : 'Show all projects <span class="count">(+4)</span>';
    if (!open) document.getElementById('projects').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
}

/* ===== SIDE RAIL: accordions on narrow screens ===== */
function initRailAccordions() {
  const blocks = [...document.querySelectorAll('.rail-block')];
  const mq = window.matchMedia('(max-width: 900px)');
  const rail = document.getElementById('rail');
  const apply = () => blocks.forEach((b, i) => { b.open = !mq.matches || i === 0; });
  // Rail taller than the viewport: stick by its bottom edge instead of hiding the end
  const setTop = () => {
    if (!rail) return;
    const nav = document.getElementById('navbar')?.offsetHeight || 64;
    const top = Math.min(nav + 16, window.innerHeight - rail.offsetHeight - 16);
    rail.style.setProperty('--rail-top', `${top}px`);
  };
  apply(); setTop();
  mq.addEventListener('change', () => { apply(); setTop(); });
  window.addEventListener('resize', setTop);
  rail?.addEventListener('toggle', setTop, true);
}

/* ===== CURSOR SPOTLIGHT + CARD TILT ===== */
function initSpotlight() {
  if (reduceMotion || window.matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('.tile, .project-card').forEach((el) => {
    const tilt = el.classList.contains('project-card');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
      if (tilt) {
        const rx = (y / r.height - 0.5) * -3, ry = (x / r.width - 0.5) * 3;
        el.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      }
    });
    el.addEventListener('pointerleave', () => { if (tilt) el.style.transform = ''; });
  });
}

/* ===== NEURAL CONSTELLATION BACKGROUND =====
   Drifting nodes linked by faint lines; the cursor gently attracts
   nodes. Off for reduced motion, paused when the tab is hidden. */
function initConstellation() {
  const canvas = document.getElementById('constellation');
  if (!canvas) return;
  if (reduceMotion) { canvas.remove(); return; }
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [], linkDist;
  const mouse = { x: null, y: null };
  const RANGE = 160;
  const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';

  function build() {
    const dpr = window.devicePixelRatio || 1;
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(60, Math.max(24, Math.round((W * H) / 26000)));
    linkDist = Math.min(160, Math.max(100, W / 9));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
      r: 1 + Math.random() * 1.4,
    }));
  }
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 200); });
  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener('mouseleave', () => { mouse.x = null; });
  let running = true;
  document.addEventListener('visibilitychange', () => {
    const was = running; running = !document.hidden;
    if (running && !was) requestAnimationFrame(frame);
  });

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    ctx.clearRect(0, 0, W, H);
    const light = isLight();
    const rgb = light ? '0,111,138' : '0,212,255';
    const nodeAlpha = light ? 0.3 : 0.55;
    const lineBase = light ? 0.08 : 0.15;
    const maxD2 = linkDist * linkDist;
    for (const n of nodes) {
      if (mouse.x !== null) {
        const dx = mouse.x - n.x, dy = mouse.y - n.y, d2 = dx * dx + dy * dy;
        if (d2 > 1 && d2 < RANGE * RANGE) { const f = 0.01 / Math.sqrt(d2); n.vx += dx * f; n.vy += dy * f; }
      }
      n.vx = Math.max(-0.35, Math.min(0.35, n.vx));
      n.vy = Math.max(-0.35, Math.min(0.35, n.vy));
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) { n.vx *= -1; n.x = Math.max(0, Math.min(W, n.x)); }
      if (n.y < 0 || n.y > H) { n.vy *= -1; n.y = Math.max(0, Math.min(H, n.y)); }
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y, d2 = dx * dx + dy * dy;
        if (d2 < maxD2) {
          ctx.strokeStyle = `rgba(${rgb},${(lineBase * (1 - d2 / maxD2)).toFixed(3)})`;
          ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
        }
      }
    }
    ctx.fillStyle = `rgba(${rgb},${nodeAlpha})`;
    for (const n of nodes) { ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill(); }
  }
  build();
  requestAnimationFrame(frame);
}

/* ===== MOTION (GSAP) =====
   Everything starts visible with final values. Only when motion is
   allowed and GSAP loaded do we animate, and every tween ends by
   restoring the final state. */
function initMotion() {
  const bar = document.querySelector('.scroll-progress');
  if (bar) {
    const update = () => {
      const h = document.documentElement;
      bar.style.transform = `scaleX(${h.scrollTop / ((h.scrollHeight - window.innerHeight) || 1)})`;
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.ScrambleTextPlugin) gsap.registerPlugin(ScrambleTextPlugin);

  gsap.from('.bento > .tile', {
    y: 18, opacity: 0, duration: 0.55, stagger: 0.07, ease: 'power2.out', clearProps: 'opacity,transform',
  });

  const name = document.querySelector('[data-scramble]');
  if (name && window.ScrambleTextPlugin) {
    const text = name.textContent;
    gsap.to(name, { duration: 1.1, delay: 0.15, scrambleText: { text, chars: 'upperCase', speed: 0.6, revealDelay: 0.2 },
      onComplete: () => { name.textContent = text; } });
  }

  document.querySelectorAll('[data-count]').forEach((el) => {
    const to = parseFloat(el.dataset.to);
    if (Number.isNaN(to)) return;
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const fmt = (v) => `${el.dataset.prefix || ''}${v.toFixed(dec)}${el.dataset.suffix || ''}`;
    const state = { v: 0 };
    el.textContent = fmt(0);
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: () => gsap.to(state, {
        v: to, duration: 1.3, ease: 'power2.out',
        onUpdate: () => { el.textContent = fmt(state.v); },
        onComplete: () => { el.textContent = el.dataset.final; },
      }),
    });
  });

  // Deep links (/#contact): skip scroll reveals and re-land on the target once layout settles
  if (location.hash && document.querySelector(location.hash)) {
    let userMoved = false;
    ['wheel', 'touchstart', 'keydown'].forEach((ev) => window.addEventListener(ev, () => { userMoved = true; }, { once: true, passive: true }));
    const land = () => { if (!userMoved) document.querySelector(location.hash).scrollIntoView({ behavior: 'auto' }); };
    window.addEventListener('load', () => {
      ScrollTrigger.refresh();
      land();
      document.fonts?.ready.then(land);   // web fonts can reflow the page above the target
      setTimeout(land, 700);
    });
    return;
  }

  gsap.utils.toArray('.section-head, .project-card, .contrib-card, .people-card, .xp-row, .oss-card, .contact-card, .rail-block').forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen: leave it be
    gsap.from(el, {
      y: 22, opacity: 0, duration: 0.55, ease: 'power2.out', clearProps: 'opacity,transform',
      scrollTrigger: { trigger: el, start: 'top 94%', once: true },
    });
  });
}
