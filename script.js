/* ============================================================
   Eoin Houstoun — Portfolio JavaScript
   - Typing animation (hero titles)
   - Scroll-triggered fade-in (Intersection Observer)
   - Navbar scroll state
   - Mobile navigation toggle
   - Smooth anchor scroll
   ============================================================ */

/* ===== TYPING ANIMATION ===== */
(function initTypingEffect() {
  const titles = [
    'Data Scientist',
    'AI Engineer',
    'ML Researcher',
    'Published Researcher',
  ];

  const el = document.getElementById('typingText');
  if (!el) return;

  let titleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  // Timing constants (ms)
  const TYPE_SPEED   = 75;
  const DELETE_SPEED = 45;
  const PAUSE_END    = 1800; // pause before deleting
  const PAUSE_START  = 300;  // pause before typing next

  function type() {
    const current = titles[titleIndex];

    if (isDeleting) {
      // Remove a character
      el.textContent = current.slice(0, charIndex - 1);
      charIndex--;

      if (charIndex === 0) {
        isDeleting = false;
        titleIndex = (titleIndex + 1) % titles.length;
        setTimeout(type, PAUSE_START);
        return;
      }
      setTimeout(type, DELETE_SPEED);

    } else {
      // Add a character
      el.textContent = current.slice(0, charIndex + 1);
      charIndex++;

      if (charIndex === current.length) {
        isDeleting = true;
        setTimeout(type, PAUSE_END);
        return;
      }
      setTimeout(type, TYPE_SPEED);
    }
  }

  // Small initial delay so page has loaded
  setTimeout(type, 800);
})();


/* ===== SCROLL FADE-IN (Intersection Observer) ===== */
(function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Only animate once
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  elements.forEach((el, i) => {
    // Stagger sibling cards within the same grid
    const parent = el.parentElement;
    const siblings = parent ? parent.querySelectorAll('.fade-in') : [];
    const siblingIndex = Array.from(siblings).indexOf(el);
    if (siblingIndex > 0) {
      el.style.transitionDelay = `${siblingIndex * 0.08}s`;
    }

    observer.observe(el);
  });
})();


/* ===== NAVBAR SCROLL BEHAVIOUR ===== */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let lastScroll = 0;

  function onScroll() {
    const scrollY = window.scrollY;

    // Add 'scrolled' class to solidify background
    if (scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScroll = scrollY;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();


/* ===== MOBILE NAVIGATION TOGGLE ===== */
(function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  if (!toggle || !links) return;

  function openMenu() {
    links.classList.add('open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // prevent background scroll
  }

  function closeMenu() {
    links.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  // Close menu when any nav link is clicked
  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !links.contains(e.target)) {
      closeMenu();
    }
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
})();


/* ===== SMOOTH ANCHOR SCROLL ===== */
(function initSmoothScroll() {
  // Accounts for fixed navbar height
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const navHeight = document.getElementById('navbar')?.offsetHeight ?? 72;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;

      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });
})();


/* ===== IMAGE SLIDESHOWS ===== */
(function initSlideshows() {
  document.querySelectorAll('.slideshow').forEach((container) => {
    const slides = container.querySelectorAll('.slide');
    const dotsContainer = container.querySelector('.slide-dots');
    if (slides.length < 2) return;

    const interval = parseInt(container.dataset.interval) || 3500;
    let current = 0;

    // Build dot indicators
    if (dotsContainer) {
      slides.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
      });
    }

    const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : [];

    const isSlideType = container.classList.contains('slideshow--slide');

    function goTo(index) {
      const prev = current;
      slides[prev].classList.remove('active');
      if (dots[prev]) dots[prev].classList.remove('active');

      // For slide-from-right: outgoing slide exits left
      if (isSlideType) {
        slides[prev].classList.add('exit-left');
        setTimeout(() => slides[prev].classList.remove('exit-left'), 650);
      }

      current = index;
      slides[current].classList.add('active');
      if (dots[current]) dots[current].classList.add('active');
    }

    function next() {
      goTo((current + 1) % slides.length);
    }

    setInterval(next, interval);
  });
})();


/* ===== ABOUT DATA VISUALISATION (canvas) =====
   Loops two scenes:
   A. A forecast line drawing left-to-right with a widening 95% CI band
   B. Samples raining down and stacking into a normal distribution,
      with the bell curve fading in over the histogram
*/
(function initDataViz() {
  const canvas = document.getElementById('dataViz');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const caption = document.getElementById('vizCaption');

  const ACCENT = '#00d4ff';
  const GREEN  = '#00ff87';

  let W, H;
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Seeded RNG so the loop is deterministic
  let seed = 42;
  function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function gauss() { return (rand() + rand() + rand() + rand() + rand() + rand() - 3) / 3; }

  // Scene A series (precomputed walk)
  const N = 80;
  const series = [];
  let v = 0.5;
  for (let i = 0; i < N; i++) {
    v += Math.sin(i / 9) * 0.012 + gauss() * 0.02 + 0.002;
    v = Math.max(0.18, Math.min(0.88, v));
    series.push(v);
  }

  // Scene B state
  const BINS = 21;
  const TOTAL_SAMPLES = 240;
  let bins, balls, spawned;
  function resetB() { bins = new Array(BINS).fill(0); balls = []; spawned = 0; seed = 1337; }

  // Scene C: gradient descent path on a rotated elliptical loss bowl (precomputed)
  const C_PATH = [];
  (function buildPath() {
    let x = 0.86, y = 0.16, vx = 0, vy = 0;
    const cx = 0.42, cy = 0.62, a = 1.0, b = 2.6, rot = 0.6;
    const cos = Math.cos(rot), sin = Math.sin(rot);
    for (let i = 0; i < 70; i++) {
      C_PATH.push({ x, y });
      const dx = x - cx, dy = y - cy;
      const u = cos * dx + sin * dy, v = -sin * dx + cos * dy;
      const gu = 2 * a * u, gv = 2 * b * v;
      vx = 0.8 * vx - 0.024 * (cos * gu - sin * gv);
      vy = 0.8 * vy - 0.024 * (sin * gu + cos * gv);
      x += vx; y += vy;
    }
  })();

  let phase = 'A';
  let t0 = null;
  const A_DUR = 6000, A_HOLD = 1400, B_DUR = 7000, B_HOLD = 2000, C_DUR = 6000, C_HOLD = 1600;

  function drawAxes(pad) {
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad / 2);
    ctx.lineTo(pad, H - pad);
    ctx.lineTo(W - pad / 2, H - pad);
    ctx.stroke();
  }

  function drawA(p) {
    const pad = 32;
    drawAxes(pad);
    const n = Math.max(2, Math.floor(p * N));
    const xw = W - pad - 14;
    const yh = H - pad * 1.9;
    const X = (i) => pad + xw * (i / (N - 1));
    const Y = (val) => (H - pad) - yh * val;

    // Widening CI band
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const ci = 0.025 + 0.11 * (i / N);
      const y = Y(Math.min(0.95, series[i] + ci));
      i ? ctx.lineTo(X(i), y) : ctx.moveTo(X(i), y);
    }
    for (let i = n - 1; i >= 0; i--) {
      const ci = 0.025 + 0.11 * (i / N);
      ctx.lineTo(X(i), Y(Math.max(0.05, series[i] - ci)));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 212, 255, 0.10)';
    ctx.fill();

    // Mean line with glow
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      i ? ctx.lineTo(X(i), Y(series[i])) : ctx.moveTo(X(i), Y(series[i]));
    }
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 212, 255, 0.6)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Leading dot
    ctx.beginPath();
    ctx.arc(X(n - 1), Y(series[n - 1]), 3.5, 0, Math.PI * 2);
    ctx.fillStyle = GREEN;
    ctx.fill();
  }

  function drawB(p) {
    const pad = 32;
    drawAxes(pad);
    const xw = W - pad - 14;
    const binW = xw / BINS;
    const floor = H - pad;
    const unit = 4.4; // stacked-sample height in px

    // Spawn new samples up to the target for this progress
    const target = Math.floor(p * TOTAL_SAMPLES);
    while (spawned < target) {
      const g = Math.max(-1, Math.min(1, gauss()));
      const bin = Math.round(((g + 1) / 2) * (BINS - 1));
      balls.push({ bin, y: pad / 2, v: 1.6 + rand() * 1.4 });
      spawned++;
    }

    // Falling samples
    ctx.fillStyle = ACCENT;
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      const restY = floor - bins[b.bin] * unit - 2;
      b.y += b.v;
      b.v += 0.28;
      if (b.y >= restY) { bins[b.bin]++; balls.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(pad + binW * (b.bin + 0.5), b.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Histogram bars
    for (let i = 0; i < BINS; i++) {
      const h = bins[i] * unit;
      if (!h) continue;
      const x = pad + binW * i + 1;
      const grad = ctx.createLinearGradient(0, floor - h, 0, floor);
      grad.addColorStop(0, 'rgba(0, 212, 255, 0.85)');
      grad.addColorStop(1, 'rgba(0, 212, 255, 0.22)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, floor - h, binW - 2, h);
    }

    // Bell curve fades in once the histogram has shape
    if (p > 0.45) {
      const alpha = Math.min(1, (p - 0.45) / 0.3);
      const sigma = 0.34;
      const peak = TOTAL_SAMPLES * 0.155 * unit;
      ctx.beginPath();
      for (let x = 0; x <= 100; x++) {
        const z = (x / 100) * 2 - 1;
        const yv = Math.exp(-(z * z) / (2 * sigma * sigma));
        const px = pad + xw * (x / 100);
        const py = floor - yv * peak;
        x ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.strokeStyle = 'rgba(0, 255, 135, ' + (0.9 * alpha) + ')';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawC(p) {
    const pad = 26;
    const cx = 0.42, cy = 0.62, a = 1.0, b = 2.6, rot = 0.6;
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const X = (ux) => pad + (W - 2 * pad) * ux;
    const Y = (uy) => pad / 2 + (H - 2 * pad) * uy;

    // Contour rings of the loss surface
    for (let l = 1; l <= 6; l++) {
      const r = l * 0.115;
      ctx.beginPath();
      for (let t = 0; t <= 64; t++) {
        const ang = (t / 64) * Math.PI * 2;
        const u = (r * Math.cos(ang)) / Math.sqrt(a);
        const v = (r * Math.sin(ang)) / Math.sqrt(b);
        const px = X(cx + cos * u - sin * v);
        const py = Y(cy + sin * u + cos * v);
        t ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0, 212, 255, ' + (0.22 - l * 0.025) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Minimum marker
    ctx.beginPath();
    ctx.arc(X(cx), Y(cy), 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();

    // Descent trail
    const n = Math.max(2, Math.floor(p * C_PATH.length));
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const px = X(C_PATH[i].x), py = Y(C_PATH[i].y);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = 'rgba(0, 255, 135, 0.5)';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Step markers
    for (let i = 0; i < n; i += 4) {
      ctx.beginPath();
      ctx.arc(X(C_PATH[i].x), Y(C_PATH[i].y), 1.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 135, 0.5)';
      ctx.fill();
    }

    // The ball
    const lead = C_PATH[n - 1];
    ctx.beginPath();
    ctx.arc(X(lead.x), Y(lead.y), 5, 0, Math.PI * 2);
    ctx.fillStyle = ACCENT;
    ctx.shadowColor = 'rgba(0, 212, 255, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  resetB();

  // Only animate while visible (saves battery, pauses offscreen)
  let visible = false;
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
  }, { threshold: 0.1 }).observe(canvas);

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) { t0 = null; return; }
    if (t0 === null) t0 = now;
    const el = now - t0;
    ctx.clearRect(0, 0, W, H);

    if (phase === 'A') {
      drawA(Math.min(1, el / A_DUR));
      if (el > A_DUR + A_HOLD) {
        phase = 'B'; t0 = now; resetB();
        if (caption) caption.textContent = 'Sampling · N(μ, σ²)';
      }
    } else if (phase === 'B') {
      drawB(Math.min(1, el / B_DUR));
      if (el > B_DUR + B_HOLD) {
        phase = 'C'; t0 = now;
        if (caption) caption.textContent = 'Gradient descent · minimising loss';
      }
    } else {
      // Ease-out so the ball decelerates into the minimum
      const raw = Math.min(1, el / C_DUR);
      drawC(1 - Math.pow(1 - raw, 2.2));
      if (el > C_DUR + C_HOLD) {
        phase = 'A'; t0 = now;
        if (caption) caption.textContent = 'Forecast · 95% CI';
      }
    }
  }
  requestAnimationFrame(frame);
})();


/* ===== K-MEANS LIVE CLUSTERING (skills section) ===== */
(function initKMeans() {
  const canvas = document.getElementById('kmeansViz');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hint = document.getElementById('kmeansHint');

  const COLORS = ['#00d4ff', '#00ff87', '#a78bfa', '#fbbf24', '#f472b6'];
  const GREY = 'rgba(255, 255, 255, 0.35)';
  const K = 5;

  let W, H;
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Seeded RNG: same dataset every visit
  let seed = 7;
  function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function gauss() { return (rand() + rand() + rand() - 1.5) / 1.5; }

  // Five latent blobs: varied size, spread, and one stretched diagonal cluster.
  // Overlapping enough that the structure is NOT obvious until k-means finds it.
  const BLOBS = [
    { x: 0.24, y: 0.30, sx: 0.085, sy: 0.085, rot: 0,    n: 42 },
    { x: 0.62, y: 0.22, sx: 0.16,  sy: 0.045, rot: 0.5,  n: 46 }, // stretched diagonal
    { x: 0.78, y: 0.62, sx: 0.07,  sy: 0.11,  rot: 0,    n: 38 },
    { x: 0.38, y: 0.68, sx: 0.13,  sy: 0.06,  rot: -0.4, n: 40 }, // wide and flat
    { x: 0.52, y: 0.45, sx: 0.05,  sy: 0.05,  rot: 0,    n: 24 }, // tight core in the middle of everything
  ];
  const pts = [];
  BLOBS.forEach((b) => {
    const cos = Math.cos(b.rot), sin = Math.sin(b.rot);
    for (let i = 0; i < b.n; i++) {
      const u = gauss() * b.sx, v = gauss() * b.sy;
      pts.push({
        x: Math.min(0.97, Math.max(0.03, b.x + cos * u - sin * v)),
        y: Math.min(0.95, Math.max(0.05, b.y + sin * u + cos * v)),
        cl: -1,
      });
    }
  });

  // Centroids animate between Lloyd iterations
  let centroids = [];
  let running = false;
  let iterTimer = null;

  function resetState() {
    running = false;
    clearTimeout(iterTimer);
    pts.forEach((p) => { p.cl = -1; });
    centroids = [];
    if (hint) hint.textContent = 'hover to cluster';
  }

  function startKMeans() {
    if (running) return;
    running = true;

    // k-means++ initialisation: spread the starting centroids apart
    const first = pts[Math.floor(Math.random() * pts.length)];
    centroids = [{ x: first.x, y: first.y, tx: first.x, ty: first.y }];
    while (centroids.length < K) {
      let bestP = null, bestD = -1;
      // Sample candidates weighted toward points far from existing centroids
      for (let t = 0; t < 24; t++) {
        const p = pts[Math.floor(Math.random() * pts.length)];
        let d = Infinity;
        centroids.forEach((c) => {
          d = Math.min(d, (p.x - c.x) ** 2 + (p.y - c.y) ** 2);
        });
        if (d > bestD) { bestD = d; bestP = p; }
      }
      centroids.push({ x: bestP.x, y: bestP.y, tx: bestP.x, ty: bestP.y });
    }

    let iter = 0;
    let prevInertia = Infinity;
    function step() {
      // Assign + accumulate inertia (within-cluster sum of squares)
      let inertia = 0;
      pts.forEach((p) => {
        let best = 0, bd = Infinity;
        centroids.forEach((c, i) => {
          const d = (p.x - c.tx) ** 2 + (p.y - c.ty) ** 2;
          if (d < bd) { bd = d; best = i; }
        });
        p.cl = best;
        inertia += bd;
      });
      // Update targets (centroids glide there in the draw loop)
      centroids.forEach((c, i) => {
        const mine = pts.filter((p) => p.cl === i);
        if (mine.length) {
          c.tx = mine.reduce((s, p) => s + p.x, 0) / mine.length;
          c.ty = mine.reduce((s, p) => s + p.y, 0) / mine.length;
        }
      });
      iter++;
      if (hint) hint.textContent = 'iter ' + iter + ' · inertia ' + (inertia * 100).toFixed(2);

      // Converge when inertia stops improving (or hard cap)
      const improved = prevInertia - inertia > 5e-6;
      prevInertia = inertia;
      if (iter < 16 && (improved || iter < 6)) {
        iterTimer = setTimeout(step, 300);
      } else {
        if (hint) hint.textContent = 'converged ✓ · k=' + K + ' · ' + iter + ' iters';
      }
    }
    step();
  }

  // Hover to cluster, leave to reset
  canvas.addEventListener('mouseenter', () => { resetState(); startKMeans(); });
  canvas.addEventListener('mouseleave', () => { resetState(); if (hint) hint.textContent = 'hover to cluster'; });
  canvas.addEventListener('touchstart', () => { resetState(); startKMeans(); }, { passive: true });

  // Auto-demo loop when idle and visible
  let visible = false;
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
  }, { threshold: 0.15 }).observe(canvas);

  setInterval(() => {
    if (!visible || running) return;
    startKMeans();
    setTimeout(() => { if (!canvas.matches(':hover')) resetState(); }, 6500);
  }, 10000);

  const X = (u) => 14 + (W - 28) * u;
  const Y = (u) => 12 + (H - 24) * u;

  function draw() {
    requestAnimationFrame(draw);
    if (!visible) return;
    ctx.clearRect(0, 0, W, H);

    // Points
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(X(p.x), Y(p.y), 3, 0, Math.PI * 2);
      ctx.fillStyle = p.cl === -1 ? GREY : COLORS[p.cl];
      ctx.fill();
    });

    // Centroids glide toward their targets
    centroids.forEach((c, i) => {
      c.x += (c.tx - c.x) * 0.16;
      c.y += (c.ty - c.y) * 0.16;
      ctx.beginPath();
      ctx.arc(X(c.x), Y(c.y), 7, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS[i];
      ctx.lineWidth = 2.5;
      ctx.shadowColor = COLORS[i];
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
      // Cross in the middle
      ctx.beginPath();
      ctx.moveTo(X(c.x) - 3, Y(c.y)); ctx.lineTo(X(c.x) + 3, Y(c.y));
      ctx.moveTo(X(c.x), Y(c.y) - 3); ctx.lineTo(X(c.x), Y(c.y) + 3);
      ctx.strokeStyle = COLORS[i];
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }
  requestAnimationFrame(draw);
})();


/* ===== SIMULATED TRAINING LOG (skills section) ===== */
(function initTrainingLog() {
  const el = document.getElementById('trainingLog');
  if (!el) return;

  const MAX_LINES = 13;
  let lines = [];
  let epoch = 0;
  const TOTAL = 40;
  let loss, valLoss, bestVal, bestEpoch, plateau;

  function resetRun() {
    epoch = 0;
    loss = 1.9 + Math.random() * 0.4;
    valLoss = loss + 0.05;
    bestVal = Infinity;
    bestEpoch = 0;
    plateau = 0;
    lines = [
      '<span class="t-dim">$</span> <span class="t-accent">python</span> train.py --model xgb_ensemble --folds 5',
      '<span class="t-dim">Loading 41,732 samples · 86 features · device: cpu</span>',
      '',
    ];
  }

  function bar(p) {
    const full = Math.round(p * 10);
    return '<span class="t-accent">' + '▓'.repeat(full) + '</span><span class="t-dim">' + '░'.repeat(10 - full) + '</span>';
  }

  function render() {
    el.innerHTML = lines.slice(-MAX_LINES).join('\n');
  }

  function tick() {
    epoch++;
    const decay = Math.exp(-epoch / 11);
    loss = 0.21 + (loss - 0.21) * 0.88 + (Math.random() - 0.5) * 0.012;
    valLoss = loss + 0.04 + Math.random() * 0.05;
    if (valLoss < bestVal - 0.002) { bestVal = valLoss; bestEpoch = epoch; plateau = 0; } else { plateau++; }

    const e = String(epoch).padStart(2, '0');
    lines.push(
      'epoch ' + e + '/' + TOTAL + '  ' + bar(epoch / TOTAL) +
      '  loss <span class="t-accent">' + loss.toFixed(4) + '</span>' +
      '  val <span class="t-green">' + valLoss.toFixed(4) + '</span>'
    );

    if (plateau >= 6 || epoch >= TOTAL) {
      lines.push('');
      lines.push('<span class="t-dim">Early stopping: val loss plateaued</span>');
      lines.push('Best epoch <span class="t-green">' + bestEpoch + '</span> · val loss <span class="t-green">' + bestVal.toFixed(4) + '</span>');
      lines.push('<span class="t-green">✓</span> model saved → <span class="t-accent">model_best.pt</span>');
      render();
      setTimeout(() => { resetRun(); render(); setTimeout(tick, 700); }, 4200);
      return;
    }
    render();
    setTimeout(tick, 380 + Math.random() * 180);
  }

  // Start when scrolled into view, once
  let started = false;
  new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting && !started) {
      started = true;
      resetRun();
      render();
      setTimeout(tick, 600);
      obs.disconnect();
    }
  }, { threshold: 0.2 }).observe(el);
})();


/* ===== ACTIVE NAV LINK HIGHLIGHTING ===== */
(function initActiveNavLinks() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            link.style.color = '';
            if (link.getAttribute('href') === `#${id}`) {
              link.style.color = 'var(--text-primary)';
            }
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach((section) => observer.observe(section));
})();
