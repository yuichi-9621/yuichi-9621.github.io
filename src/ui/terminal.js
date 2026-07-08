import { site, projects } from '../content.js';

const SECTIONS = ['home', 'work', 'process', 'about', 'events', 'contact'];

export function createTerminal({ openPanel, openStudy, getRenderer, setMotion, getMotion }) {
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
    while (logEl.children.length > 24) logEl.removeChild(logEl.firstChild);
    logEl.scrollTop = logEl.scrollHeight;
  };

  const commands = {
    help() {
      print(
        [
          'available commands:',
          '  work · process · about · events · contact · home',
          '  open snowx|mahola|netflix         read a case study',
          '  liquid · ascii                    melt / freeze the background',
          '  motion on|off                     pause or resume animation',
          '  ls · whoami · email · clear       the usual suspects',
        ].join('\n')
      );
    },
    home() { openPanel('home'); print('cd ~'); },
    work() { openPanel('work'); print(`cd ~/work — ${projects.length} case studies`); },
    process() { openPanel('process'); print('cd ~/process — the double diamond'); },
    about() { openPanel('about'); print('cd ~/about'); },
    events() { openPanel('events'); print('cd ~/events — creative tech series'); },
    contact() { openPanel('contact'); print('cd ~/contact'); },
    clear() { logEl.innerHTML = ''; },
    ls() { print(SECTIONS.filter((s) => s !== 'home').map((s) => s + '/').join('  ') + '  ' + projects.map((p) => p.id).join('  ')); },
    whoami() { print(`${site.name.toLowerCase().replace(' ', '.')} — ${site.role.toLowerCase()} · okinawa → sf`); },
    open(id) {
      if (id && openStudy(id)) print(`opening ~/work/${id}`);
      else print(`usage: open ${projects.map((p) => p.id).join('|')}`);
    },
    email() {
      print(`opening mailto:${site.email}`);
      location.href = `mailto:${site.email}`;
    },
    linkedin() { openSocial('LinkedIn'); },
    github() { openSocial('GitHub'); },
    liquid() {
      getRenderer()?.setLiquid(1);
      print('surface tension released — everything is liquid now. type `ascii` to re-freeze.');
    },
    ascii() {
      getRenderer()?.setLiquid(0);
      print('recrystallized into glyphs.');
    },
    motion(arg) {
      if (arg === 'off') setMotion(false);
      else if (arg === 'on') setMotion(true);
      else print(`motion is ${getMotion() ? 'on' : 'off'} — try \`motion off\` or \`motion on\``);
    },
    photography() {
      print('shot on leica · san francisco & japan — the discipline of composing a frame,\nwaiting for the light, and getting it right in-camera is the same discipline\nI bring to an interface. gallery coming soon.');
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
  };
  // project ids as direct commands: `snowx`, `mahola`, `netflix`
  for (const p of projects) {
    commands[p.id] = () => { openStudy(p.id); print(`opening ~/work/${p.id}`); };
  }

  function openSocial(label) {
    const s = site.socials.find((x) => x.label === label);
    if (s) {
      print(`opening ${s.url}`);
      window.open(s.url, '_blank', 'noopener');
    }
  }

  function run(raw) {
    const line = raw.trim();
    if (!line) return;
    print(line, true);
    history.push(line);
    histIdx = history.length;
    const [cmd, ...args] = line.toLowerCase().split(/\s+/);
    if (commands[cmd]) commands[cmd](...args);
    else print(`command not found: ${cmd} — try \`help\``);
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
      const match = [...Object.keys(commands)].find((c) => c.startsWith(v));
      if (match) input.value = match;
    }
  });

  return { run, print };
}
