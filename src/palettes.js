// Color palettes. Each one drives both the DOM chrome (CSS custom properties)
// and the WebGL liquid (five gradient stops, the glyph ink, the melt rim).
// Switch with the `theme` terminal command. DEFAULT_PALETTE is what loads first.

export const DEFAULT_PALETTE = 'bingata';

export const palettes = {
  phosphor: {
    label: 'phosphor',
    note: 'green phosphor on black. how this site started.',
    css: {
      bg: '#060907', ink: '#e2ffee', 'ink-dim': '#8fb6a0', phos: '#6bffa8',
      cyan: '#7df2ff', violet: '#c3a3ff', surface: '#0a1410', 'on-phos': '#04120a',
    },
    stops: ['#030a09', '#083326', '#14c785', '#5ce6ff', '#a880ff'],
    rim: ['#66ffcc', '#bf99ff'],
    drift: 0.3,
  },
  bingata: {
    label: 'bingata',
    note: 'ochre, beni red and ai blue, sampled from 19th century Ryukyu bingata robes.',
    css: {
      bg: '#0e1b21', ink: '#efe8d6', 'ink-dim': '#b1a994', phos: '#e3c35f',
      cyan: '#95c2c4', violet: '#e57a6e', surface: '#162a31', 'on-phos': '#1f1708',
    },
    stops: ['#0a1418', '#1e4553', '#7d2a3b', '#cf574e', '#d6c054'],
    rim: ['#e3c35f', '#95c2c4'],
    drift: 0.08,
  },
  beniimo: {
    label: 'beni-imo',
    note: 'shikuwasa lime on purple sweet potato.',
    css: {
      bg: '#18091d', ink: '#f7e9ff', 'ink-dim': '#b7a0c4', phos: '#c9f26a',
      cyan: '#ff86c4', violet: '#e0a3ff', surface: '#24102b', 'on-phos': '#15200a',
    },
    stops: ['#120616', '#4a1458', '#a23a8f', '#ff8fc7', '#d2f066'],
    rim: ['#ff8fc7', '#d2f066'],
    drift: 0.08,
  },
  yachimun: {
    label: 'yachimun',
    note: 'kiln orange, iron red clay and celadon, from Okinawan pottery.',
    css: {
      bg: '#1a110b', ink: '#f4e6d4', 'ink-dim': '#bba38c', phos: '#f2934f',
      cyan: '#8fcbb1', violet: '#e8a45a', surface: '#261910', 'on-phos': '#1e0f05',
    },
    stops: ['#130b07', '#4a2416', '#b5482a', '#e8a45a', '#8cc7ae'],
    rim: ['#e8a45a', '#8cc7ae'],
    drift: 0.08,
  },
};

// '#rrggbb' → [r, g, b] in 0..1 for the shader
export const toVec3 = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

export function resolvePalette(name) {
  const key = String(name || '').toLowerCase().replace(/[^a-z]/g, '');
  return palettes[key] ? key : null;
}

// Apply a palette to the page chrome. The renderer is updated separately
// (renderer.setPalette) so this also works when WebGL is unavailable.
export function applyPaletteCss(key) {
  const p = palettes[key];
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(p.css)) root.setProperty(`--${k}`, v);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', p.css.bg);
  document.documentElement.dataset.palette = key;
}
