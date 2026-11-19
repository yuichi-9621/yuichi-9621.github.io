// Draws both faces of the badge onto 2D canvases (DESIGN.md §5 and §6).
// The front is the menu: each clickable line has a hit area in canvas px.

export const FACE_W = 1024;
export const FACE_H = 1440;
const M = 96;           // margin
const RIGHT = 928;      // destination labels align here

// One entry per clickable line, in badge order (also the keyboard order).
export const LINES = [
  { id: 'about', label: 'about', y0: 408, y1: 784 },
  { id: 'work', label: 'work', y0: 808, y1: 952 },
  { id: 'contact', label: 'contact', y0: 952, y1: 1096 },
];

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export async function loadFaceFonts() {
  const sans = '"IBM Plex Sans JP"', mono = '"IBM Plex Mono"';
  try {
    await Promise.all([
      document.fonts.load(`700 144px ${sans}`, 'Yuichi Okuhama 奥浜引き算'),
      document.fonts.load(`400 56px ${sans}`, 'Work Say hello'),
      document.fonts.load(`400 28px ${mono}`, 'DESIGN ENGINEER SAN FRANCISCO FROM OKINAWA about work contact'),
    ]);
  } catch {
    /* the system fallback still draws */
  }
}

export function lineAt(x, y) {
  if (x < 64 || x > 960) return null;
  return LINES.find((l) => y >= l.y0 && y < l.y1)?.id ?? null;
}

export function drawFront(ctx, { name, role, company, place, active = null, focusRing = false }) {
  const c = {
    ai: css('--ai'), cotton: css('--cotton'), dim: css('--cotton-dim'), ochre: css('--ochre'),
    hair: css('--hairline-on-ai'), font: css('--font'), mono: css('--mono'),
  };
  ctx.save();
  ctx.fillStyle = c.ai;
  ctx.fillRect(0, 0, FACE_W, FACE_H);
  ctx.textBaseline = 'alphabetic';

  const text = (str, x, y, size, weight, color, align = 'left', track = 0, fam = c.font) => {
    ctx.font = `${weight} ${size}px ${fam}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${track}px`;
    ctx.fillText(str, x, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  };
  const on = (id) => active === id;
  const tone = (id) => (on(id) ? c.ochre : c.cotton);
  const toneDim = (id) => (on(id) ? c.ochre : c.dim);

  // top line, in mono like a printed event badge: what I do, where I am
  text(role.toUpperCase(), M, 264, 26, 400, c.dim, 'left', 26 * 0.06, c.mono);
  text(place.toUpperCase(), RIGHT, 264, 26, 400, c.dim, 'right', 26 * 0.06, c.mono);

  // name: shrink to fit so it never runs into the "about" label
  const [first, ...rest] = name.split(' ');
  const last = rest.join(' ');
  ctx.font = `700 144px ${c.font}`;
  const widest = Math.max(ctx.measureText(first).width, ctx.measureText(last).width);
  const nameSize = Math.min(144, Math.floor(144 * (RIGHT - 150 - M) / widest));
  text(first, M, 560, nameSize, 700, tone('about'));
  text(last, M, 712, nameSize, 700, tone('about'));
  text('about', RIGHT, 712, 26, 400, toneDim('about'), 'right', 0, c.mono);

  // hairlines
  ctx.fillStyle = c.hair;
  for (const y of [808, 952, 1096]) ctx.fillRect(M, y - 1, RIGHT - M, 2);

  // the two rows under the name
  const rows = [
    ['work', company, 900],
    ['contact', 'Say hello', 1044],
  ];
  for (const [id, label, y] of rows) {
    text(label, M, y, 56, 400, tone(id));
    text(id, RIGHT, y, 26, 400, toneDim(id), 'right', 0, c.mono);
  }

  // waves along the bottom, the same sea as the page behind the badge
  ctx.save();
  ctx.lineWidth = 3;
  for (let k = 0; k < 5; k++) {
    const y0 = 1150 + k * 42, amp = 16, len = 150 + k * 6;
    ctx.strokeStyle = `rgb(241 234 214 / ${0.3 - k * 0.04})`;
    ctx.beginPath();
    for (let x = -20; x <= FACE_W + 20; x += 4) {
      const y = y0 + Math.sin((x / len) * Math.PI * 2 + k * 1.3) * amp;
      if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // bottom line
  text('FROM OKINAWA, JAPAN', M, 1344, 26, 400, c.dim, 'left', 26 * 0.06, c.mono);

  // active marker: a 16px ochre square, so state is never color alone
  if (active) {
    const l = LINES.find((x) => x.id === active);
    const cy = active === 'about' ? (560 + 712) / 2 - 50 : rows.find((r) => r[0] === active)[2] - 20;
    ctx.fillStyle = c.ochre;
    ctx.fillRect(56 - 8, cy - 8, 16, 16);
    if (focusRing) {
      ctx.strokeStyle = c.ochre;
      ctx.lineWidth = 4;
      ctx.strokeRect(64 + 8, l.y0 + 8, 960 - 64 - 16, l.y1 - l.y0 - 16);
    }
  }
  ctx.restore();
}

export function drawBack(ctx) {
  const ai = css('--ai'), cotton = css('--cotton'), dim = css('--cotton-dim'), font = css('--font'), mono = css('--mono');
  ctx.save();
  ctx.fillStyle = ai;
  ctx.fillRect(0, 0, FACE_W, FACE_H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // a hanko seal: 奥浜 carved into a vermilion square, with a thin inner border
  const shu = css('--shu') || '#c4382a', paper = css('--paper') || cotton;
  const S = 460, cx = 512, cy = 700;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.03);
  ctx.fillStyle = shu;
  ctx.beginPath();
  ctx.roundRect(-S / 2, -S / 2, S, S, 28);
  ctx.fill();
  ctx.strokeStyle = paper;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.roundRect(-S / 2 + 28, -S / 2 + 28, S - 56, S - 56, 12);
  ctx.stroke();
  ctx.fillStyle = paper;
  ctx.font = `700 172px ${font}`;
  ctx.fillText('奥', 0, -84);
  ctx.fillText('浜', 0, 92);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = dim;
  ctx.font = `700 30px ${font}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '12px';
  ctx.fillText('引き算', 512 + 6, 1300);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';
  ctx.font = `400 22px ${mono}`;
  ctx.fillText('THE ART OF SUBTRACTION', 512 + 2, 1352);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.restore();
}
