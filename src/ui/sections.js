import { site, projects, about } from '../content.js';

const esc = (s) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function renderSections(onCardHover) {
  const work = document.getElementById('work');
  work.innerHTML = `
    <p class="sec-head"><b>~/work</b> — ${projects.length} entries · click a card to expand</p>
    <div class="cards">
      ${projects
        .map(
          (p) => `
        <button class="card" data-id="${p.id}" aria-expanded="false">
          <span class="idx">[${p.index}]</span>
          <h3>${esc(p.title)}</h3>
          <div class="org">${esc(p.org)}</div>
          <p>${esc(p.summary)}</p>
          <ul>${p.details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
          <div class="tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
          <div class="more">▸ expand</div>
        </button>`
        )
        .join('')}
    </div>`;

  work.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => {
      const open = card.classList.toggle('expanded');
      card.setAttribute('aria-expanded', String(open));
      card.querySelector('.more').textContent = open ? '▾ collapse' : '▸ expand';
    });
    card.addEventListener('pointerenter', (e) => {
      const r = card.getBoundingClientRect();
      onCardHover?.(r.left + r.width / 2, r.top + r.height / 2);
    });
  });

  const aboutEl = document.getElementById('about');
  aboutEl.innerHTML = `
    <p class="sec-head"><b>~/about</b> — whoami</p>
    <div class="prose">
      <p>${esc(site.intro)}</p>
      <p class="dim">now: ${esc(about.now)}</p>
      <p class="dim">before:<br>${about.before.map((b) => `&nbsp;&nbsp;· ${esc(b)}`).join('<br>')}</p>
      <div class="skill-row">${about.skills.map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</div>
    </div>`;

  const contact = document.getElementById('contact');
  contact.innerHTML = `
    <p class="sec-head"><b>~/contact</b> — open a channel</p>
    <div class="prose">
      <p>Always up for talking about product, prototypes, and things that feel good to touch.</p>
      <dl class="kv">
        ${site.socials
          .map(
            (s) =>
              `<dt>${esc(s.label.toLowerCase())}</dt><dd><a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(
                s.url.replace(/^(mailto:|https:\/\/(www\.)?)/, '')
              )}</a></dd>`
          )
          .join('')}
      </dl>
    </div>`;
}
