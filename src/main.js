// yuichiokuhama.com: one badge, one sheet (引き算, see DESIGN.md).
import './styles.css';
import { site, projects } from './content.js';
import { createSheet, PAGES } from './sheet.js';
import { track } from './track.js';

const menu = document.getElementById('menu');
const buttonFor = (key) => menu.querySelector(`[data-page="${key}"]`);

const sheet = createSheet({
  onChange(key) {
    const hash = key ? `#${key}` : ' ';
    if (location.hash !== hash.trim()) history.replaceState(null, '', key ? hash : location.pathname);
    if (key) track(`/${PAGES.includes(key) ? 'page' : 'study'}/${key}`, key);
  },
});

menu.addEventListener('click', (e) => {
  const b = e.target.closest('[data-page]');
  if (b) sheet.open(b.dataset.page, b);
});

// ── the badge, if this browser can draw it ──
const canvas = document.getElementById('badge');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGL = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
})();

if (hasGL) {
  document.documentElement.classList.add('gl');
  import('./badge/scene.js')
    .then(({ createBadge }) =>
      createBadge(canvas, {
        face: { name: site.name, role: site.role, company: 'DG717', place: site.location },
        reducedMotion,
        onOpen: (key) => sheet.open(key, buttonFor(key)),
      })
    )
    .then((badge) => {
      // keyboard focus on the hidden menu shows on the badge itself
      menu.addEventListener('focusin', (e) => {
        const b = e.target.closest('[data-page]');
        if (b && b.matches(':focus-visible')) badge.focusLine(b.dataset.page);
      });
      menu.addEventListener('focusout', () => badge.focusLine(null));
    })
    .catch((err) => {
      console.warn('badge fell back to the flat card', err);
      document.documentElement.classList.remove('gl');
    });
}

// deep links: #about, #work, #built, #contact, or a case study (#snowx)
const initial = location.hash.slice(1);
if (PAGES.includes(initial) || projects.some((p) => p.id === initial)) sheet.open(initial, buttonFor(initial) || buttonFor('work'));
else track('/', 'home');
