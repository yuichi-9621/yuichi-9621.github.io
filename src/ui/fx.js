// Motion.dev-powered interaction layer.
// Every effect here respects the motion toggle: when disabled,
// elements jump straight to their end state.
import { animate, stagger } from 'motion';

let enabled = true;
export function setFxEnabled(v) { enabled = v; }

const SPRING = { type: 'spring', stiffness: 320, damping: 26 };
const GLYPHS = '!<>-_\\/[]{}=+*^?#$%&';

// ── panel entrance: cascade the panel's content in ──
const SPREAD = '.cards, .pillars, .dd-steps, .metrics, .themes, .timeline, .kv';
export function panelIn(panel) {
  if (!enabled) return;
  const items = [];
  for (const child of panel.children) {
    if (child.matches(SPREAD)) items.push(...child.children);
    else items.push(child);
  }
  if (!items.length) return;
  animate(
    items,
    { opacity: [0, 1], y: [14, 0], filter: ['blur(5px)', 'blur(0px)'] },
    { delay: stagger(0.05, { startDelay: 0.05 }), duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }
  );
}

// ── sliding pill behind the active nav chip ──
let pill = null;
export function initPill(chipnav) {
  pill = document.createElement('span');
  pill.className = 'nav-pill';
  pill.setAttribute('aria-hidden', 'true');
  chipnav.prepend(pill);
  window.addEventListener('resize', () => movePill(chipnav, false));
  // fonts loading late shift chip widths — settle the pill afterwards
  document.fonts?.ready.then(() => movePill(chipnav, false));
}
export function movePill(chipnav, animated = true) {
  if (!pill) return;
  const active = chipnav.querySelector('.chip.active');
  if (!active) { pill.style.opacity = '0'; return; }
  const target = {
    x: active.offsetLeft,
    y: active.offsetTop,
    width: active.offsetWidth,
    height: active.offsetHeight,
  };
  const instant = !enabled || !animated || !pill.dataset.placed;
  pill.dataset.placed = '1';
  pill.style.opacity = '1';
  animate(
    pill,
    { x: target.x, y: target.y, width: target.width, height: target.height },
    instant ? { duration: 0 } : SPRING
  );
}

// ── 3D magnetic tilt for cards ──
export function attachTilt(el, maxDeg = 5) {
  let raf = 0;
  let leaveAnim = null;
  el.addEventListener('pointermove', (e) => {
    if (!enabled || e.pointerType === 'touch') return;
    leaveAnim?.stop();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform =
        `perspective(800px) translateY(-4px) rotateX(${(-py * maxDeg).toFixed(2)}deg) rotateY(${(px * maxDeg).toFixed(2)}deg)`;
    });
  });
  el.addEventListener('pointerleave', () => {
    cancelAnimationFrame(raf);
    if (!enabled) { el.style.transform = ''; return; }
    leaveAnim = animate(
      el,
      { transform: 'perspective(800px) translateY(0px) rotateX(0deg) rotateY(0deg)' },
      { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }
    );
  });
}

// ── terminal-style text scramble on hover/focus ──
export function attachScramble(el) {
  const original = el.textContent;
  el.setAttribute('aria-label', el.getAttribute('aria-label') || original);
  let timer = null;
  const run = () => {
    if (!enabled || timer) return;
    let frame = 0;
    const total = Math.max(6, original.length * 2);
    timer = setInterval(() => {
      frame++;
      const settled = Math.floor((frame / total) * original.length);
      el.textContent = original
        .split('')
        .map((ch, i) =>
          ch === ' ' || i < settled ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]
        )
        .join('');
      if (frame >= total) {
        clearInterval(timer);
        timer = null;
        el.textContent = original;
      }
    }, 28);
  };
  el.addEventListener('pointerenter', run);
  el.addEventListener('focus', run);
}

// ── count-up for case-study metrics ──
export function countUpMetrics(container) {
  container.querySelectorAll('.metric .num').forEach((el) => {
    const m = el.textContent.match(/^(\+?)(\d+)(.*)$/);
    if (!m || !enabled) return;
    const [, sign, num, suffix] = m;
    const target = parseInt(num, 10);
    animate(0, target, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { el.textContent = sign + Math.round(v) + suffix; },
    });
  });
}

// ── new CLI log lines slide in ──
export function lineIn(el) {
  if (!enabled) return;
  animate(el, { opacity: [0, 1], x: [-8, 0] }, { duration: 0.22, ease: 'easeOut' });
}

// ── springy press feedback (chips, links — not tilting cards) ──
export function initPress(root) {
  const sel = '.chip, .inline-link';
  root.addEventListener('pointerdown', (e) => {
    const el = e.target.closest(sel);
    if (!el || !enabled) return;
    animate(el, { scale: 0.94 }, { duration: 0.1, ease: 'easeOut' });
    const release = () => {
      animate(el, { scale: 1 }, SPRING);
      el.removeEventListener('pointerup', release);
      el.removeEventListener('pointerleave', release);
      el.removeEventListener('pointercancel', release);
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointerleave', release);
    el.addEventListener('pointercancel', release);
  });
}
