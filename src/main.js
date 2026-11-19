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
    try {
      if (location.hash !== hash.trim()) history.replaceState(null, '', key ? hash : location.pathname);
    } catch {
      /* some embedded frames refuse history changes; the sheet still works */
    }
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
      if (import.meta.env.VITE_PREVIEW) showPreviewNote(`3D badge off: ${err?.message || err}`);
      document.documentElement.classList.remove('gl');
    });
} else if (import.meta.env.VITE_PREVIEW) {
  showPreviewNote('3D badge off: this browser has no WebGL');
}

// deep links: #about, #work, #built, #contact, or a case study (#snowx)
const initial = location.hash.slice(1);
if (PAGES.includes(initial) || projects.some((p) => p.id === initial)) sheet.open(initial, buttonFor(initial) || buttonFor('work'));
else track('/', 'home');

// Preview builds only: say why the 3D badge didn't start, so a screenshot shows it.
function showPreviewNote(text) {
  const p = Object.assign(document.createElement('p'), { textContent: text });
  p.style.cssText = 'position:fixed;left:0;right:0;bottom:12px;margin:0;text-align:center;font-size:12px;color:var(--ink-dim)';
  document.body.append(p);
}
if (import.meta.env.VITE_PREVIEW) {
  addEventListener('error', (e) => showPreviewNote(`Script error: ${e.message}`));
  addEventListener('unhandledrejection', (e) => showPreviewNote(`Script error: ${e.reason?.message || e.reason}`));
}
