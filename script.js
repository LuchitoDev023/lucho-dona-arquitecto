// ── i18n ──────────────────────────────────────────────
const LANG_KEY = 'ld-lang';
const i18nNodes = [...document.querySelectorAll('[data-i18n]')];
const i18nAttrNodes = [...document.querySelectorAll('[data-i18n-attr]')];
let lang = 'es';

// `data-i18n-attr` holds a comma-separated list of `attribute:key` pairs
const attrPairs = (el) =>
  el.dataset.i18nAttr.split(',').map((p) => {
    const i = p.indexOf(':');
    return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
  });

// Spanish lives in the markup, so snapshot it before anything replaces it
const esAttrs = new WeakMap();
i18nNodes.forEach((el) => { el.dataset.es = el.innerHTML; });
i18nAttrNodes.forEach((el) => {
  esAttrs.set(el, Object.fromEntries(attrPairs(el).map(([attr]) => [attr, el.getAttribute(attr)])));
});

function t(key) {
  if (lang === 'en') return window.I18N_EN[key];
  return window.I18N_ES_EXTRA[key];
}

function setLang(next) {
  lang = next === 'en' ? 'en' : 'es';
  const dict = window.I18N_EN;

  i18nNodes.forEach((el) => {
    const key = el.dataset.i18n;
    if (lang === 'es') el.innerHTML = el.dataset.es;
    else if (dict[key] !== undefined) el.innerHTML = dict[key];
  });

  i18nAttrNodes.forEach((el) => {
    const originals = esAttrs.get(el);
    attrPairs(el).forEach(([attr, key]) => {
      const value = lang === 'es' ? originals[attr] : dict[key];
      if (value !== undefined && value !== null) el.setAttribute(attr, value);
    });
  });

  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-btn').forEach((b) => {
    const on = b.dataset.lang === lang;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* private mode */ }
}

document.getElementById('langSwitch').addEventListener('click', (e) => {
  const btn = e.target.closest('.lang-btn');
  if (btn) setLang(btn.dataset.lang);
});

let savedLang = null;
try { savedLang = localStorage.getItem(LANG_KEY); } catch { /* private mode */ }
if (savedLang === 'en') setLang('en');

// Mobile nav
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
navToggle.addEventListener('click', () => nav.classList.toggle('open'));
nav.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') nav.classList.remove('open');
});

// Scrollspy
const sections = [...document.querySelectorAll('section[id]')];
const navLinks = [...nav.querySelectorAll('a')];
const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);
sections.forEach((s) => spy.observe(s));

// Reveal on scroll
const revealer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll('.reveal').forEach((el) => revealer.observe(el));

// Trayectoria tabs
const tabs = document.getElementById('cvTabs');
tabs.querySelector('.tab-bar').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  tabs.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
  tabs.querySelectorAll('.tab-panel').forEach((p) =>
    p.classList.toggle('active', p.dataset.panel === btn.dataset.tab)
  );
});

// ── Lightbox ──────────────────────────────────────────
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbCaption = document.getElementById('lbCaption');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');
let lbItems = [];
let lbIndex = 0;

function openLightbox(items, index) {
  lbItems = items;
  lbIndex = index;
  renderLightbox();
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
}

function renderLightbox() {
  const item = lbItems[lbIndex];
  lbImg.src = item.src;
  lbImg.alt = item.caption || '';
  lbCaption.textContent = item.caption || '';
  lbPrev.disabled = lbIndex === 0;
  lbNext.disabled = lbIndex === lbItems.length - 1;
  const single = lbItems.length <= 1;
  lbPrev.style.display = single ? 'none' : '';
  lbNext.style.display = single ? 'none' : '';
}

function closeLightbox() {
  lightbox.hidden = true;
  lbImg.src = '';
  document.body.style.overflow = '';
}

lbPrev.addEventListener('click', (e) => { e.stopPropagation(); if (lbIndex > 0) { lbIndex--; renderLightbox(); } });
lbNext.addEventListener('click', (e) => { e.stopPropagation(); if (lbIndex < lbItems.length - 1) { lbIndex++; renderLightbox(); } });
document.getElementById('lbClose').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft' && lbIndex > 0) { lbIndex--; renderLightbox(); }
  if (e.key === 'ArrowRight' && lbIndex < lbItems.length - 1) { lbIndex++; renderLightbox(); }
});

// Every content image opens the lightbox, navigating within its gallery group
function galleryOf(img) {
  const group = img.closest('.obra-gallery, .campo-grid, .ee-grid, .certs-grid');
  const imgs = group ? [...group.querySelectorAll('img')] : [img];
  const items = imgs.map((i) => ({
    src: i.dataset.full || i.src,
    caption: i.closest('figure')?.querySelector('figcaption')?.textContent || i.alt,
  }));
  return { items, index: imgs.indexOf(img) };
}

document.addEventListener('click', (e) => {
  const img = e.target.closest('img');
  if (!img || img.hasAttribute('data-nozoom')) return;
  if (img.closest('.lightbox') || img.closest('a')) return;
  const { items, index } = galleryOf(img);
  openLightbox(items, index);
});
document.querySelectorAll('main img, section img').forEach((i) => {
  if (!i.hasAttribute('data-nozoom') && !i.closest('a')) i.classList.add('zoomable');
});

// ── Certificados ──────────────────────────────────────
let certsData = null;
async function loadCerts() {
  if (certsData) return certsData;
  const res = await fetch('assets/certs/certs.json');
  certsData = await res.json();
  return certsData;
}

function certItems(certs) {
  return certs.map((c) => ({ src: `assets/certs/${c.slug}.jpg`, caption: c.title }));
}

// items with data-cert open their certificate in the lightbox
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-cert]');
  if (!el) return;
  const certs = await loadCerts();
  const idx = certs.findIndex((c) => c.slug === el.dataset.cert);
  if (idx === -1) return;
  openLightbox(certItems(certs), idx);
});

// modal with the full gallery
const certsModal = document.getElementById('certsModal');
const certsGrid = document.getElementById('certsGrid');

document.getElementById('openCerts').addEventListener('click', async () => {
  const certs = await loadCerts();
  if (!certsGrid.children.length) {
    certs.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.className = 'cert-thumb';
      btn.innerHTML = `<img src="assets/certs/${c.slug}.jpg" alt="${c.title}" loading="lazy" data-nozoom><span>${c.title}</span>`;
      btn.addEventListener('click', () => openLightbox(certItems(certs), i));
      certsGrid.appendChild(btn);
    });
  }
  certsModal.hidden = false;
  document.body.style.overflow = 'hidden';
});

function closeCerts() {
  certsModal.hidden = true;
  if (lightbox.hidden) document.body.style.overflow = '';
}
document.getElementById('certsClose').addEventListener('click', closeCerts);
certsModal.addEventListener('click', (e) => { if (e.target === certsModal) closeCerts(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !certsModal.hidden && lightbox.hidden) closeCerts();
});

// ── Parallax + recorrido solar ────────────────────────
const parallax = document.getElementById('parallax');
const heroBg = document.getElementById('heroBg');
const pxLayers = [...document.querySelectorAll('.px-layer, .px-quote')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scene geometry, in the SVG's own coordinates (viewBox 0 0 1200 560)
const GROUND = 500;
const ARC_CX = 600;
const ARC_R = 460;
const SQUASH = 0.1; // how far the shadow "lies down" into the ground plane
const MAX_SHEAR = 2.2; // keeps the longest shadow inside the viewBox
// Outline of the house, walked clockwise from its bottom-left corner
const SILHOUETTE = [
  [500, GROUND], [500, 380], [480, 380], [600, 306], [720, 380], [700, 380], [700, GROUND],
];

const sunDot = document.getElementById('sunDot');
const sunShadow = document.getElementById('sunShadow');
const sunRays = document.getElementById('sunRays');
const ray1 = document.getElementById('ray1');
const ray2 = document.getElementById('ray2');

// phase 0 = sunrise on the left, 1 = sunset on the right
function drawSun(phase) {
  const angle = Math.PI * phase;
  const sunX = ARC_CX - ARC_R * Math.cos(angle);
  const sunY = GROUND - ARC_R * Math.sin(angle);
  sunDot.setAttribute('cx', sunX.toFixed(1));
  sunDot.setAttribute('cy', sunY.toFixed(1));

  // Sunlight is parallel, so the shadow is the silhouette sheared sideways by an
  // amount that grows as the sun gets lower, then flattened onto the ground plane.
  const altitude = Math.max(Math.sin(angle), 1e-3);
  const shear = Math.max(-MAX_SHEAR, Math.min(MAX_SHEAR, Math.cos(angle) / altitude));
  const project = ([x, y]) => {
    const h = GROUND - y;
    return [x + shear * h, GROUND + SQUASH * h];
  };
  const projected = SILHOUETTE.map(project);
  sunShadow.setAttribute(
    'points',
    projected.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  );
  sunShadow.style.opacity = (0.55 + 0.45 * altitude).toFixed(2);

  // Rays only read as rays once the sun is high enough for them not to skim the ground
  const rayFade = Math.max(0, Math.min(1, (altitude - 0.42) / 0.25));
  sunRays.style.opacity = rayFade.toFixed(2);
  if (rayFade > 0) {
    [[SILHOUETTE[3], ray1], [SILHOUETTE[shear >= 0 ? 4 : 2], ray2]].forEach(([point, line]) => {
      const [tipX, tipY] = project(point);
      line.setAttribute('x1', sunX.toFixed(1));
      line.setAttribute('y1', sunY.toFixed(1));
      line.setAttribute('x2', tipX.toFixed(1));
      line.setAttribute('y2', tipY.toFixed(1));
    });
  }
}

if (reducedMotion) {
  drawSun(0.5);
} else {
  let ticking = false;
  const updateParallax = () => {
    ticking = false;
    const sc = window.scrollY;
    if (sc < window.innerHeight) {
      heroBg.style.transform = `translateY(${sc * 0.35}px)`;
    }
    const rect = parallax.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      const progress = rect.top + rect.height / 2 - window.innerHeight / 2;
      pxLayers.forEach((layer) => {
        layer.style.transform = `translateY(${-progress * layer.dataset.speed}px)`;
      });
    }
    const span = window.innerHeight + rect.height;
    const phase = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / span));
    drawSun(phase);
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateParallax); }
  }, { passive: true });
  window.addEventListener('resize', updateParallax, { passive: true });
  updateParallax();
}

// ── Easter egg: la dona verde ─────────────────────────
function donutRain() {
  for (let i = 0; i < 26; i++) {
    const d = document.createElement('span');
    d.className = 'donut-drop';
    d.textContent = '🍩';
    d.style.left = `${Math.random() * 100}vw`;
    d.style.animationDuration = `${2.2 + Math.random() * 2.5}s`;
    d.style.animationDelay = `${Math.random() * 1.4}s`;
    d.style.fontSize = `${30 + Math.random() * 34}px`;
    document.body.appendChild(d);
    d.addEventListener('animationend', () => d.remove());
  }
  let toast = document.querySelector('.donut-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'donut-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = t('egg.toast');
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3200);
}

// trigger 1: type "dona"
let typed = '';
document.addEventListener('keydown', (e) => {
  if (e.key.length !== 1) return;
  typed = (typed + e.key.toLowerCase()).slice(-4);
  if (typed === 'dona') donutRain();
});

// trigger 2: 5 quick clicks on the brand
let brandClicks = [];
document.getElementById('brand').addEventListener('click', (e) => {
  const now = Date.now();
  brandClicks = brandClicks.filter((t) => now - t < 2000);
  brandClicks.push(now);
  if (brandClicks.length >= 5) {
    e.preventDefault();
    brandClicks = [];
    donutRain();
  }
});
