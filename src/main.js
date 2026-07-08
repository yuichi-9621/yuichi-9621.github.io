import './styles.css';
import { site, bootLines, projects } from './content.js';
import { createRenderer } from './gl/renderer.js';
import { renderSections, renderStudy } from './ui/sections.js';
import { createTerminal } from './ui/terminal.js';
import {
  setFxEnabled, panelIn, initPill, movePill,
  attachScramble, initPress, countUpMetrics,
} from './ui/fx.js';

const $ = (id) => document.getElementById(id);

// ── motion preference (persisted, defaults to OS setting) ──
const rmQuery = matchMedia('(prefers-reduced-motion: reduce)');
const stored = localStorage.getItem('motion');
let motionOn = stored !== null ? stored === 'on' : !rmQuery.matches;
setFxEnabled(motionOn);

// ── background renderer (graceful fallback) ──
let renderer = null;
function bootRenderer() {
  try {
    renderer = createRenderer($('gl'), {
      reducedMotion: !motionOn,
      font: '"JetBrains Mono", monospace',
    });
  } catch {
    renderer = null;
  }
  if (!renderer) {
    $('gl').hidden = true;
    $('fallback-bg').hidden = false;
  }
}

// ── panels / router ──────────────────────────
const panels = ['home', 'work', 'study', 'process', 'about', 'events', 'contact'];
const navPanels = panels.filter((p) => p !== 'study');
let firstOpen = true;

function openPanel(name, { focus = true } = {}) {
  for (const p of panels) {
    const el = $(p === 'home' ? 'hero' : p);
    const open = p === name;
    el.hidden = !open;
    if (open) void el.offsetWidth; // replay the entrance transition
    el.classList.toggle('is-open', open);
  }
  document.querySelectorAll('#chipnav .chip').forEach((c) => {
    const current = c.dataset.target === name;
    c.classList.toggle('active', current);
    if (current) c.setAttribute('aria-current', 'page');
    else c.removeAttribute('aria-current');
  });
  movePill(chipnav, !firstOpen);
  panelIn($(name === 'home' ? 'hero' : name));
  const hash = name === 'home' ? '#' : `#${name}`;
  if (name !== 'study' && location.hash !== hash) history.replaceState(null, '', hash);
  // move focus to the opened panel's heading so screen readers announce context
  if (focus && !firstOpen) {
    const el = $(name === 'home' ? 'hero' : name);
    const h = el.querySelector('h1, h2');
    if (h) {
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
    $('stage').scrollTop = 0;
  }
  firstOpen = false;
}

function openStudy(id) {
  if (!renderStudy(id)) return false;
  openPanel('study');
  history.replaceState(null, '', `#${id}`);
  wireStudy();
  countUpMetrics($('study'));
  return true;
}

function wireStudy() {
  const el = $('study');
  el.querySelector('[data-back]')?.addEventListener('click', () => openPanel('work'));
  el.querySelectorAll('[data-study]').forEach((b) =>
    b.addEventListener('click', () => openStudy(b.dataset.study))
  );
}

// chips
const chipnav = $('chipnav');
for (const p of navPanels) {
  const b = document.createElement('button');
  b.className = 'chip';
  b.type = 'button';
  b.dataset.target = p;
  b.textContent = p === 'home' ? '~' : p.toUpperCase();
  b.addEventListener('click', () => openPanel(p));
  chipnav.appendChild(b);
  attachScramble(b);
}
initPill(chipnav);
initPress(document);

// motion toggle (visible pause control — WCAG 2.2.2)
const motionBtn = $('motion-toggle');
function setMotion(v) {
  motionOn = v;
  setFxEnabled(v);
  localStorage.setItem('motion', v ? 'on' : 'off');
  motionBtn.textContent = `motion: ${v ? 'on' : 'off'}`;
  motionBtn.setAttribute('aria-pressed', String(v));
  const liquid = renderer?.getLiquid() ?? 0;
  renderer?.destroy();
  $('gl').hidden = false;
  $('fallback-bg').hidden = true;
  bootRenderer();
  renderer?.setLiquid(liquid);
}
motionBtn.textContent = `motion: ${motionOn ? 'on' : 'off'}`;
motionBtn.setAttribute('aria-pressed', String(motionOn));
motionBtn.addEventListener('click', () => setMotion(!motionOn));
rmQuery.addEventListener('change', (e) => {
  if (localStorage.getItem('motion') === null) setMotion(!e.matches);
});

// ── hero: boot sequence + typed name ─────────
function typeBoot() {
  const bootEl = $('boot');
  const sr = document.createElement('span');
  sr.className = 'visually-hidden';
  sr.textContent = bootLines.join(' ');
  bootEl.parentElement.prepend(sr);

  if (!motionOn) {
    bootEl.innerHTML = bootLines
      .map((l) => l.replace(/ok$/, '<span class="ok">ok</span>'))
      .join('\n');
    return;
  }
  let li = 0, ci = 0, out = '';
  (function tick() {
    if (li >= bootLines.length) {
      bootEl.innerHTML = out.replace(/ok(?=\n|$)/g, '<span class="ok">ok</span>');
      return;
    }
    const line = bootLines[li];
    ci += 2 + Math.floor(Math.random() * 3);
    if (ci >= line.length) {
      out += line + '\n';
      bootEl.textContent = out;
      li++; ci = 0;
      setTimeout(tick, 90 + Math.random() * 160);
    } else {
      bootEl.textContent = out + line.slice(0, ci);
      setTimeout(tick, 24);
    }
  })();
}

function typeName() {
  const nameEl = $('name');
  nameEl.setAttribute('aria-label', site.name);
  const text = document.createElement('span');
  text.setAttribute('aria-hidden', 'true');
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  nameEl.append(text, cursor);

  if (!motionOn) {
    text.textContent = site.name;
    return;
  }
  let i = 0;
  (function tick() {
    if (i <= site.name.length) {
      text.textContent = site.name.slice(0, i++);
      setTimeout(tick, 55 + Math.random() * 60);
    }
  })();
}

$('tagline').textContent = site.tagline;
$('intro').textContent = site.intro;

// ── clock ────────────────────────────────────
function tickClock() {
  const d = new Date();
  $('clock').textContent =
    d.toLocaleTimeString('en-US', { hour12: false }) + ' · ' + site.location;
}
tickClock();
setInterval(tickClock, 1000);

// ── wire everything ──────────────────────────
bootRenderer();
renderSections({
  onCardHover: (x, y) => renderer?.splat(x, y, 1.4),
  openStudy,
});

const term = createTerminal({
  openPanel,
  openStudy,
  getRenderer: () => renderer,
  setMotion(v) {
    setMotion(v);
    term.print(v ? 'motion: on' : 'motion: off — the field is frozen.');
  },
  getMotion: () => motionOn,
});

typeBoot();
typeName();

// deep links: #work, #process … or a project id (#snowx)
const initial = location.hash.replace('#', '');
if (projects.some((p) => p.id === initial)) openStudy(initial);
else openPanel(navPanels.includes(initial) ? initial : 'home', { focus: false });

// greet
term.print('welcome. type `help` — or just start clicking. everything melts.');
