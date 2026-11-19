// The one sheet that opens over the badge (DESIGN.md §8).
// A native <dialog>: it traps focus, closes on Esc, and returns focus.
import { site, projects, about, built, sideProjects, beliefs } from './content.js';
import { unlockResume } from './resume.js';

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ext = (href, label) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;

const pages = {
  about: () => `
    <h2 id="sheet-title">${esc(about.headline)}</h2>
    ${about.body.map((p) => `<p>${esc(p)}</p>`).join('')}
    <blockquote>${esc(about.human)}</blockquote>
    <h3>Along the way</h3>
    <ol class="list">
      ${about.timeline.map(([y, t, d]) => `<li><span class="when">${esc(y)}</span><span><strong>${esc(t)}</strong> ${esc(d)}</span></li>`).join('')}
    </ol>
    <p class="quiet">${esc(about.languages.join(' · '))}</p>`,

  work: () => `
    <h2 id="sheet-title">Work</h2>
    <h3>How I design</h3>
    <ol class="list beliefs">
      ${beliefs.map(([t, d]) => `<li><strong>${esc(t)}</strong><span class="quiet">${esc(d)}</span></li>`).join('')}
    </ol>
    <h3>Case studies</h3>
    <ul class="list rows">
      ${projects
        .map(
          (p) => `<li><button type="button" class="row" data-study="${p.id}">
            <span class="when">${esc(p.year)}</span>
            <span><strong>${esc(p.title)}</strong><span class="quiet">${esc(p.summary)}</span></span>
          </button></li>`
        )
        .join('')}
    </ul>
    <h3>Things I built</h3>
    <p>${esc(built.intro)}</p>
    ${built.items
      .map(
        (b) => `<section class="item">
          <h4>${esc(b.title)}</h4>
          <p>${esc(b.desc)}</p>
          <p class="quiet">${esc(b.stack.join(' · '))}</p>
          <p class="links">${b.links.map(([l, u]) => ext(u, `${esc(l)}<span class="visually-hidden"> (${esc(b.title)})</span>`)).join('')}</p>
        </section>`
      )
      .join('')}
    <h3>Also shipped</h3>
    <ul class="list shipped">
      ${sideProjects
        .map(
          (p) => `<li><span class="when">${esc(p.kind)}</span>
            <span><strong>${p.link ? ext(p.link, esc(p.title)) : esc(p.title)}</strong><span class="quiet">${esc(p.desc)}</span></span></li>`
        )
        .join('')}
    </ul>`,


  contact: () => `
    <h2 id="sheet-title">Say hello</h2>
    <p>I’m looking for a design engineering role, and I’m always up for a good side project. Email is the fastest way to reach me.</p>
    <dl class="kv">
      <dt>email</dt><dd><a href="mailto:${site.email}">${esc(site.email)}</a></dd>
      <dt>resume</dt><dd>
        <form class="unlock" data-resume>
          <label for="resume-code">Ask me for the code, then download the PDF.</label>
          <span class="unlock-row">
            <input id="resume-code" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" required>
            <button type="submit">Download</button>
          </span>
          <span class="unlock-msg quiet" role="status" aria-live="polite"></span>
        </form>
      </dd>
      ${site.socials
        .filter((s) => s.label !== 'Email')
        .map((s) => `<dt>${esc(s.label.toLowerCase())}</dt><dd>${ext(s.url, esc(s.url.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '')))}</dd>`)
        .join('')}
    </dl>`,
};

function study(id) {
  const p = projects.find((x) => x.id === id);
  if (!p) return null;
  return `
    <button type="button" class="back" data-page="work">← Work</button>
    <p class="quiet">${esc(p.org)} · ${esc(p.year)}</p>
    <h2 id="sheet-title">${esc(p.title)}</h2>
    <p class="lead">${esc(p.lede)}</p>
    <dl class="kv">${p.meta.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    <blockquote>${esc(p.quote)}</blockquote>
    ${p.phases
      .map(
        (ph) => `<section class="item">
          <h3>${esc(ph.name)}</h3>
          <p><strong>${esc(ph.heading)}</strong></p>
          <p>${esc(ph.body)}</p>
          <ul class="list plain">${ph.points.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        </section>`
      )
      .join('')}
    <h3>Outcomes</h3>
    <dl class="kv">${p.metrics.map(([n, d]) => `<dt>${esc(n)}</dt><dd>${esc(d)}</dd>`).join('')}</dl>
    <h3>What I carried forward</h3>
    <p>${esc(p.reflection)}</p>`;
}

export const PAGES = ['about', 'work', 'contact'];

export function createSheet({ onChange }) {
  const dlg = document.getElementById('sheet');
  const body = dlg.querySelector('.sheet-body');
  let opener = null;

  function show(html, key) {
    body.innerHTML = html;
    body.scrollTop = 0;
    if (!dlg.open) dlg.showModal();
    // move focus to the heading so screen readers announce where they are
    const h = dlg.querySelector('#sheet-title');
    h?.setAttribute('tabindex', '-1');
    h?.focus({ preventScroll: true });
    onChange?.(key);
  }

  function open(key, from = document.activeElement) {
    if (!dlg.open) opener = from;
    if (pages[key]) return show(pages[key](), key), true;
    const s = study(key);
    if (s) return show(s, key), true;
    return false;
  }

  function close() {
    if (!dlg.open) return;
    dlg.classList.add('leaving');
    const done = () => {
      dlg.classList.remove('leaving');
      dlg.close();
    };
    const ms = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-leave')) || 200;
    setTimeout(done, ms);
  }

  dlg.addEventListener('close', () => {
    onChange?.(null);
    opener?.focus?.({ preventScroll: true });
    opener = null;
  });
  // Esc: let the leave transition play
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) return close(); // the scrim
    const t = e.target.closest('[data-close], [data-study], [data-page]');
    if (!t) return;
    if (t.dataset.close !== undefined) close();
    else if (t.dataset.study) open(t.dataset.study);
    else open(t.dataset.page);
  });

  dlg.addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-resume]');
    if (!form) return;
    e.preventDefault();
    const input = form.querySelector('input');
    const msg = form.querySelector('.unlock-msg');
    const btn = form.querySelector('button');
    btn.disabled = true;
    msg.textContent = 'Checking…';
    try {
      const url = URL.createObjectURL(await unlockResume(input.value));
      const a = Object.assign(document.createElement('a'), { href: url, download: 'Yuichi-Okuhama-Resume.pdf' });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      msg.textContent = 'Downloading.';
      input.value = '';
    } catch {
      msg.textContent = 'That code didn’t work.';
      input.select();
    } finally {
      btn.disabled = false;
    }
  });

  return { open, close, get isOpen() { return dlg.open; } };
}
