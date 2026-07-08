import { site, projects, about, events, process } from '../content.js';
import { attachTilt } from './fx.js';

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function renderSections({ onCardHover, openStudy }) {
  // ── work: project index ────────────────────
  const work = document.getElementById('work');
  work.innerHTML = `
    <h2 class="sec-head" id="work-h"><b>~/work</b> — ${projects.length} case studies</h2>
    <div class="cards">
      ${projects
        .map(
          (p) => `
        <button class="card" data-id="${p.id}" type="button">
          <span class="idx">[${p.index}] ${esc(p.year)}</span>
          <h3>${esc(p.title)}</h3>
          <div class="org">${esc(p.org)}</div>
          <p>${esc(p.summary)}</p>
          <div class="tags" aria-hidden="true">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
          <div class="more">▸ open case study<span class="visually-hidden">: ${esc(p.title)}</span></div>
        </button>`
        )
        .join('')}
    </div>`;

  work.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => openStudy(card.dataset.id));
    card.addEventListener('pointerenter', () => {
      const r = card.getBoundingClientRect();
      onCardHover?.(r.left + r.width / 2, r.top + r.height / 2);
    });
    attachTilt(card);
  });

  // ── about ──────────────────────────────────
  document.getElementById('about').innerHTML = `
    <h2 class="sec-head" id="about-h"><b>~/about</b> — whoami</h2>
    <div class="prose">
      <p class="lead">${esc(about.headline)}</p>
      ${about.body.map((p) => `<p>${esc(p)}</p>`).join('')}
      <blockquote class="human">${esc(about.human)}</blockquote>
    </div>
    <h3 class="sub-head">what I bring</h3>
    <dl class="pillars">
      ${about.pillars
        .map(([t, d]) => `<div class="pillar"><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`)
        .join('')}
    </dl>
    <h3 class="sub-head">timeline</h3>
    <ol class="timeline">
      ${about.timeline
        .map(
          ([y, t, d]) =>
            `<li><span class="tl-year">${esc(y)}</span><span class="tl-body"><strong>${esc(t)}</strong> ${esc(d)}</span></li>`
        )
        .join('')}
    </ol>
    <div class="skill-row" role="list" aria-label="Skills">
      ${about.skills.map((s) => `<span class="tag" role="listitem">${esc(s)}</span>`).join('')}
    </div>`;

  // ── process (double diamond) ───────────────
  document.getElementById('process').innerHTML = `
    <h2 class="sec-head" id="process-h"><b>~/process</b> — the double diamond</h2>
    <div class="prose">
      <p class="lead">${esc(process.headline)}</p>
      <p>${esc(process.intro)}</p>
    </div>
    <pre class="diamond" aria-hidden="true">${esc(process.diagram)}</pre>
    <dl class="dd-steps">
      ${process.steps
        .map(
          ([t, d], i) =>
            `<div class="dd-step"><dt><span aria-hidden="true">[0${i + 1}]</span> ${esc(t)}</dt><dd>${esc(d)}</dd></div>`
        )
        .join('')}
    </dl>`;

  // ── events ─────────────────────────────────
  document.getElementById('events').innerHTML = `
    <h2 class="sec-head" id="events-h"><b>~/events</b> — creative tech series</h2>
    <div class="prose">
      <p class="lead">${esc(events.headline)}</p>
      ${events.body.map((p) => `<p>${esc(p)}</p>`).join('')}
    </div>
    <ol class="themes">
      ${events.themes
        .map(
          ([n, t, d]) =>
            `<li><span class="idx">[${esc(n)}]</span><span class="tl-body"><strong>${esc(t)}</strong> — ${esc(d)}</span></li>`
        )
        .join('')}
    </ol>
    <p class="prose"><a class="inline-link" href="mailto:${site.email}?subject=Creative%20tech%20events">Get involved →</a></p>`;

  // ── contact ────────────────────────────────
  document.getElementById('contact').innerHTML = `
    <h2 class="sec-head" id="contact-h"><b>~/contact</b> — open a channel</h2>
    <div class="prose">
      <p class="lead">Let’s build something worth building.</p>
      <p>Open to product design roles, advisory work, and collaborations at the edge of AI, blockchain, and human experience.</p>
      <dl class="kv">
        ${site.socials
          .map(
            (s) =>
              `<dt>${esc(s.label.toLowerCase())}</dt><dd><a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(
                s.url.replace(/^(mailto:|https:\/\/(www\.)?)/, '').replace(/\/$/, '')
              )}</a></dd>`
          )
          .join('')}
      </dl>
    </div>`;
}

// Render one case study into the #study panel.
export function renderStudy(id) {
  const p = projects.find((x) => x.id === id);
  if (!p) return false;
  const el = document.getElementById('study');
  el.innerHTML = `
    <button class="chip back" type="button" data-back>← back to work</button>
    <h2 class="sec-head" id="study-h"><b>~/work/${p.id}</b> — ${esc(p.org)} · ${esc(p.year)}</h2>
    <article class="study">
      <h3 class="study-title">${esc(p.title)}</h3>
      <p class="lede">${esc(p.lede)}</p>
      <dl class="kv meta">${p.meta
        .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`)
        .join('')}</dl>
      <blockquote>${esc(p.quote)}</blockquote>
      ${p.phases
        .map(
          (ph, i) => `
        <section class="phase" aria-label="${esc(ph.name)}">
          <h4><span class="phase-num" aria-hidden="true">[0${i + 1}]</span> ${esc(ph.name)} <span class="mode">· ${esc(ph.mode)}</span></h4>
          <p class="phase-heading">${esc(ph.heading)}</p>
          <p>${esc(ph.body)}</p>
          <ul>${ph.points.map((pt) => `<li>${esc(pt)}</li>`).join('')}</ul>
        </section>`
        )
        .join('')}
      <div class="metrics" role="list" aria-label="Outcomes">
        ${p.metrics
          .map(([n, d]) => `<div class="metric" role="listitem"><span class="num">${esc(n)}</span><span class="desc">${esc(d)}</span></div>`)
          .join('')}
      </div>
      <h4 class="sub-head">what I carried forward</h4>
      <p class="prose">${esc(p.reflection)}</p>
      ${nextLink(p)}
    </article>`;
  return true;
}

function nextLink(p) {
  const i = projects.findIndex((x) => x.id === p.id);
  const next = projects[(i + 1) % projects.length];
  return `<p class="next-study">next: <button class="inline-link" type="button" data-study="${next.id}">${esc(next.title)} →</button></p>`;
}
