// traffic.js — the hidden `traffic` terminal command (owner-only stats).
//
// A GitHub Actions cron snapshots GoatCounter stats every 6h, encrypts them
// (AES-256-GCM, PBKDF2), and publishes the ciphertext to the `traffic-data`
// branch. This module fetches that blob and decrypts it in the browser with
// a passphrase only the owner knows. Without the passphrase the command is
// a decorative brick — the underlying data never leaves GoatCounter unencrypted.
//
// usage (in the site terminal):
//   traffic key <passphrase>   remember the passphrase on this device
//   traffic                    last 7 days
//   traffic 30                 last 30 days
//   traffic clear              forget the passphrase

const BLOB_URL =
  'https://raw.githubusercontent.com/yuichi-9621/yuichi-9621.github.io/traffic-data/traffic.enc';
const LS_KEY = 'traffic-pass';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

async function decrypt(b64, pass) {
  const buf = Uint8Array.from(atob(b64.trim()), (c) => c.charCodeAt(0));
  const salt = buf.slice(0, 16);
  const iv = buf.slice(16, 28);
  const data = buf.slice(28);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200_000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt'],
  );
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return JSON.parse(new TextDecoder().decode(pt));
}

function rows(list, label) {
  if (!list?.length) return [];
  const width = Math.max(...list.map(([k]) => String(k).length));
  return [
    `${label}:`,
    ...list.map(([k, n]) => `  ${esc(String(k).padEnd(width + 2))}${n}`),
  ];
}

function age(isoDate) {
  const mins = Math.round((Date.now() - new Date(isoDate)) / 60_000);
  if (mins < 90) return `${mins}m ago`;
  if (mins < 60 * 36) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

export function createTraffic(print) {
  return async function traffic(args, rawArgs) {
    const sub = args[0];

    if (sub === 'key') {
      const pass = rawArgs.slice(1).join(' ');
      if (!pass) return print('usage: traffic key <passphrase>');
      localStorage.setItem(LS_KEY, pass);
      return print('passphrase saved on this device. run `traffic` for stats.');
    }
    if (sub === 'clear') {
      localStorage.removeItem(LS_KEY);
      return print('passphrase forgotten.');
    }

    const pass = localStorage.getItem(LS_KEY);
    if (!pass) return print('locked. run `traffic key <passphrase>` first.');

    const days = sub === '30' ? '30d' : '7d';
    print('fetching…');
    try {
      const res = await fetch(`${BLOB_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`snapshot not found (HTTP ${res.status}) — has the workflow run yet?`);
      const snap = await decrypt(await res.text(), pass).catch(() => {
        throw new Error('decrypt failed — wrong passphrase? re-save with `traffic key <passphrase>`');
      });
      const r = snap.ranges[days];
      print(
        [
          `traffic · last ${days} · snapshot ${age(snap.generated)}`,
          `  views: ${r.total}`,
          ...rows(r.pages, '  top pages').map((l) => '  ' + l),
          ...rows(r.events, '  events').map((l) => '  ' + l),
          ...rows(r.refs, '  referrers').map((l) => '  ' + l),
          days === '7d' ? '  (try `traffic 30`)' : '',
        ].filter(Boolean).join('\n')
      );
    } catch (e) {
      print(esc(e.message));
    }
  };
}
