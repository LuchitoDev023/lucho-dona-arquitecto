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

// CV detail toggle
const toggleCv = document.getElementById('toggleCv');
const cvDetail = document.getElementById('cvDetail');
toggleCv.addEventListener('click', () => {
  const open = cvDetail.hidden;
  cvDetail.hidden = !open;
  toggleCv.setAttribute('aria-expanded', String(open));
  toggleCv.textContent = open ? 'Ocultar cursos y participaciones ▴' : 'Todos los cursos y participaciones ▾';
  if (open) {
    cvDetail.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
    cvDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});
