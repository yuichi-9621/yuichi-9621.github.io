import { site, projects, built, sideProjects, about, process, events } from '../content.js';
import { lineIn } from './fx.js';
import { trackEvent } from './track.js';
import { createTraffic } from './traffic.js';
import { palettes, resolvePalette } from '../palettes.js';

const SECTIONS = ['home', 'built', 'work', 'process', 'about', 'events', 'contact'];

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Everything searchable on the site, flattened to { where, panel|study, text }.
function searchIndex() {
  const rows = [];
  for (const b of built.items) rows.push({ where: `built/${b.title}`, panel: 'built', text: [b.title, b.desc, ...b.stack].join(' ') });
  for (const t of built.craft.points) rows.push({ where: 'built/how it’s made', panel: 'built', text: t });
  for (const p of projects) {
    rows.push({ where: `work/${p.id}`, study: p.id, text: [p.title, p.org, p.year, p.summary, p.lede, ...p.tags].join(' ') });
    for (const ph of p.phases) rows.push({ where: `work/${p.id}`, study: p.id, text: [ph.heading, ph.body, ...ph.points].join(' ') });
  }
  for (const p of sideProjects) rows.push({ where: `work/${p.title}`, panel: 'work', text: [p.title, p.desc, ...p.tags].join(' ') });
  for (const t of about.body) rows.push({ where: 'about', panel: 'about', text: t });
  for (const [t, d] of about.pillars) rows.push({ where: 'about', panel: 'about', text: `${t} ${d}` });
  for (const [y, t, d] of about.timeline) rows.push({ where: 'about/timeline', panel: 'about', text: `${y} ${t} ${d}` });
  rows.push({ where: 'about/skills', panel: 'about', text: about.skills.join(', ') });
  for (const [t, d] of process.steps) rows.push({ where: 'process', panel: 'process', text: `${t} ${d}` });
  for (const t of events.body) rows.push({ where: 'events', panel: 'events', text: t });
  return rows;
}
let INDEX = null;

function searchSite(q) {
  INDEX ??= searchIndex();
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const r of INDEX) {
    const low = r.text.toLowerCase();
    if (!terms.every((t) => low.includes(t))) continue;
    const key = r.where;
    if (seen.has(key)) continue;
    seen.add(key);
    const at = Math.max(0, low.indexOf(terms[0]) - 30);
    const snip = (at ? '…' : '') + r.text.slice(at, at + 70).trim() + (r.text.length > at + 70 ? '…' : '');
    out.push({ ...r, snippet: snip });
  }
  return out;
}

export function createTerminal({ openPanel, openStudy, getRenderer, setMotion, getMotion, setPalette, getPalette }) {
  const input = document.getElementById('cli-input');
  const logEl = document.getElementById('cli-log');
  const history = [];
  let histIdx = -1;

  const print = (text, isCmd = false) => {
    const div = document.createElement('div');
    div.className = isCmd ? 'cmd' : 'out';
    if (isCmd) div.textContent = text;
    else div.innerHTML = text;
    logEl.appendChild(div);
    lineIn(div);
    while (logEl.children.length > 24) logEl.removeChild(logEl.firstChild);
    logEl.scrollTop = logEl.scrollHeight;
  };

  const commands = {
    help() {
      print(
        [
          'available commands:',
          '  built · work · about · contact · process · events · home',
          '  search &lt;words&gt;                    find anything on the site',
          '  open snowx|mahola|netflix         read a case study',
          '  liquid · ascii                    melt / freeze the background',
          '  motion on|off                     pause or resume animation',
          '  theme [name]                      list or switch color palettes',
          '  ls · whoami · email · clear       the usual suspects',
        ].join('\n')
      );
    },
    home() { openPanel('home'); print('cd ~'); },
    built() { openPanel('built'); print(`cd ~/built · ${built.items.length} things designed and coded`); },
    work() { openPanel('work'); print(`cd ~/work · ${projects.length} case studies`); },
    process() { openPanel('process'); print('cd ~/process · the double diamond'); },
    about() { openPanel('about'); print('cd ~/about'); },
    events() { openPanel('events'); print('cd ~/events · creative tech series'); },
    contact() { openPanel('contact'); print('cd ~/contact'); },
    clear() { logEl.innerHTML = ''; },
    ls() { print(SECTIONS.filter((s) => s !== 'home').map((s) => s + '/').join('  ') + '  ' + projects.map((p) => p.id).join('  ')); },
    whoami() { print(`${site.name.toLowerCase().replace(' ', '.')} · ${site.role.toLowerCase()} · okinawa → sf`); },
    open(id) {
      if (id && openStudy(id)) print(`opening ~/work/${id}`);
      else print(`usage: open ${projects.map((p) => p.id).join('|')}`);
    },
    email() {
      print(`opening mailto:${site.email}`);
      location.href = `mailto:${site.email}`;
    },
    linkedin() { openSocial('LinkedIn'); },
    liquid() {
      getRenderer()?.setLiquid(1);
      print('surface tension released. everything is liquid now. type `ascii` to re-freeze.');
    },
    ascii() {
      getRenderer()?.setLiquid(0);
      print('recrystallized into glyphs.');
    },
    motion(arg) {
      if (arg === 'off') setMotion(false);
      else if (arg === 'on') setMotion(true);
      else print(`motion is ${getMotion() ? 'on' : 'off'}. try \`motion off\` or \`motion on\``);
    },
    theme(name) {
      if (!name) {
        const cur = getPalette?.();
        print(
          Object.entries(palettes)
            .map(([k, p]) => `${k === cur ? '* ' : '  '}${k.padEnd(10)} ${p.note}`)
            .join('\n') + '\n\ntry `theme phosphor`'
        );
        return;
      }
      const key = resolvePalette(name);
      if (!key) { print(`no palette called ${name}. try \`theme\` to list them`); return; }
      setPalette?.(key);
      print(`palette → ${palettes[key].label}`);
    },
    search(...words) {
      const q = words.join(' ').trim();
      if (!q) { print('usage: search &lt;words&gt;  e.g. `search webgl`'); return; }
      const hits = searchSite(q);
      if (!hits.length) { print(`nothing for “${esc(q)}”. try \`ls\``); return; }
      print(
        `${hits.length} result${hits.length > 1 ? 's' : ''} for “${esc(q)}”\n` +
          hits
            .slice(0, 6)
            .map((h) => `  <button class="inline-link" type="button" data-${h.study ? 'study' : 'go'}="${h.study || h.panel}">${esc(h.where)}</button>  ${esc(h.snippet)}`)
            .join('\n')
      );
    },
    photography() {
      print('shot on leica · san francisco & japan. the discipline of composing a frame,\nwaiting for the light, and getting it right in-camera is the same discipline\nI bring to an interface. gallery coming soon.');
    },
    sudo(...args) {
      if (args.join(' ').includes('hire')) {
        print(`permission granted. → <a href="mailto:${site.email}">${site.email}</a>`);
      } else {
        print('yuichi is not in the sudoers file. this incident will be reported.');
      }
    },
    matrix() {
      getRenderer()?.setLiquid(0);
      print('you are already in it.');
    },
    // hidden, owner-only: encrypted GoatCounter stats (see src/ui/traffic.js)
    traffic(...args) { runTraffic(args, rawParts.slice(1)); },
  };
  const runTraffic = createTraffic(print);
  // project ids as direct commands: `snowx`, `mahola`, `netflix`
  for (const p of projects) {
    commands[p.id] = () => { openStudy(p.id); print(`opening ~/work/${p.id}`); };
  }

  // search results print as buttons; one listener handles them all
  logEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go], [data-study]');
    if (!b) return;
    if (b.dataset.study) openStudy(b.dataset.study);
    else openPanel(b.dataset.go);
  });

  function openSocial(label) {
    const s = site.socials.find((x) => x.label === label);
    if (s) {
      print(`opening ${s.url}`);
      window.open(s.url, '_blank', 'noopener');
    }
  }

  let rawParts = []; // case-preserved words of the current line (traffic passphrase)

  function run(raw) {
    const line = raw.trim();
    if (!line) return;
    // never echo or remember the passphrase line
    const sensitive = /^traffic\s+key\s/i.test(line);
    print(sensitive ? 'traffic key ••••••••' : line, true);
    if (!sensitive) {
      history.push(line);
      histIdx = history.length;
    }
    rawParts = line.split(/\s+/);
    const [cmd, ...args] = line.toLowerCase().split(/\s+/);
    // count command *names* only — typed args are never sent anywhere
    trackEvent(commands[cmd] ? `cmd-${cmd}` : 'cmd-unknown');
    if (commands[cmd]) commands[cmd](...args);
    else print(`command not found: ${cmd}. try \`help\``);
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      run(input.value);
      input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx > 0) input.value = history[--histIdx] ?? '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < history.length) input.value = history[++histIdx] ?? '';
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const v = input.value.toLowerCase();
      if (!v) return;
      const match = [...Object.keys(commands)].filter((c) => c !== 'traffic').find((c) => c.startsWith(v));
      if (match) input.value = match;
    }
  });

  return { run, print };
}
