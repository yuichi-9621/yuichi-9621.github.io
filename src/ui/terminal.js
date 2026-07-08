import { site, projects } from '../content.js';

const SECTIONS = ['home', 'work', 'about', 'contact'];

export function createTerminal({ openPanel, getRenderer, setMotion, getMotion }) {
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
          '  work · about · contact · home     navigate',
          '  liquid · ascii                    melt / freeze the background',
          '  motion on|off                     toggle animation',
          '  ls · whoami · email · clear       the usual suspects',
        ].join('\n')
      );
    },
    home() { openPanel('home'); print('cd ~'); },
    work() { openPanel('work'); print(`cd ~/work — ${projects.length} projects`); },
    about() { openPanel('about'); print('cd ~/about'); },
    contact() { openPanel('contact'); print('cd ~/contact'); },
    clear() { logEl.innerHTML = ''; },
    ls() { print(SECTIONS.filter((s) => s !== 'home').map((s) => s + '/').join('  ')); },
    whoami() { print(`${site.name.toLowerCase().replace(' ', '.')} — ${site.role.toLowerCase()}`); },
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
      if (arg === 'off') { setMotion(false); print('motion: off — the field is frozen.'); }
      else if (arg === 'on') { setMotion(true); print('motion: on'); }
      else print(`motion is ${getMotion() ? 'on' : 'off'} — try \`motion off\` or \`motion on\``);
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
    else if (SECTIONS.includes(cmd)) commands[cmd]();
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

  // typing anywhere (outside inputs) focuses the prompt — the site is a terminal
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = document.activeElement?.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && e.key.length === 1) input.focus();
  });

  return { run, print };
}
