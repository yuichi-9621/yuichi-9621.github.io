import './styles.css';
import { site, bootLines } from './content.js';
import { createRenderer } from './gl/renderer.js';
import { renderSections } from './ui/sections.js';
import { createTerminal } from './ui/terminal.js';

const $ = (id) => document.getElementById(id);

// ── motion preference ────────────────────────
const rmQuery = matchMedia('(prefers-reduced-motion: reduce)');
let motionOn = !rmQuery.matches;

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
const panels = ['home', 'work', 'about', 'contact'];
function openPanel(name) {
  for (const p of panels) {
    const el = $(p === 'home' ? 'hero' : p);
    const open = p === name;
    el.hidden = !open;
    // force reflow so the transition replays
    if (open) void el.offsetWidth;
    el.classList.toggle('is-open', open);
  }
  document.querySelectorAll('.chip').forEach((c) =>
    c.classList.toggle('active', c.dataset.target === name)
  );
  if (location.hash !== `#${name}`) history.replaceState(null, '', name === 'home' ? '#' : `#${name}`);
}

// chips
const chipnav = $('chipnav');
for (const p of panels) {
  const b = document.createElement('button');
  b.className = 'chip';
  b.dataset.target = p;
  b.textContent = p === 'home' ? '~' : p.toUpperCase();
  b.addEventListener('click', () => openPanel(p));
  chipnav.appendChild(b);
}

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
renderSections((x, y) => renderer?.splat(x, y, 1.4));

const term = createTerminal({
  openPanel,
  getRenderer: () => renderer,
  setMotion(v) {
    motionOn = v;
    const liquid = renderer?.getLiquid() ?? 0;
    renderer?.destroy();
    $('gl').hidden = false;
    $('fallback-bg').hidden = true;
    bootRenderer();
    renderer?.setLiquid(liquid);
  },
  getMotion: () => motionOn,
});

typeBoot();
typeName();

// deep link (#work etc.)
const initial = location.hash.replace('#', '');
openPanel(panels.includes(initial) ? initial : 'home');

// greet
term.print(`welcome. type \`help\` — or just start clicking. everything melts.`);
