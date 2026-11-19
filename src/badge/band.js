// The lanyard's print: one tile that repeats along the band.
// Vermilion webbing, dark red edges, a purple pinstripe, and a short intro in
// mono running down its length, like the printed lanyard of an event badge.

export const BAND_TILE_W = 128;   // across the band, px
export const BAND_TILE_H = 2048;  // along the band, px

const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

const WORDS = ['YUICHI OKUHAMA', 'DESIGN ENGINEER', 'SAN FRANCISCO', 'FROM OKINAWA', '引き算'];

export function drawBand(ctx) {
  const W = BAND_TILE_W, H = BAND_TILE_H;
  const shu = css('--shu'), bengara = css('--bengara'), murasaki = css('--murasaki');
  const paper = css('--paper'), mono = css('--mono'), sans = css('--font');

  ctx.save();
  ctx.fillStyle = shu;
  ctx.fillRect(0, 0, W, H);
  // woven edges, then the purple pinstripe just inside them
  ctx.fillStyle = bengara;
  ctx.fillRect(0, 0, 10, H);
  ctx.fillRect(W - 10, 0, 10, H);
  ctx.fillStyle = murasaki;
  ctx.fillRect(16, 0, 5, H);
  ctx.fillRect(W - 21, 0, 5, H);

  // the words run down the band, tops toward the band's right edge
  ctx.translate(W / 2, 0);
  ctx.rotate(Math.PI / 2);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = paper;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
  const gap = 34;
  let x = gap / 2;
  // measure first so the words spread evenly over the whole tile, which keeps the repeat seamless
  const fontFor = (w) => (/[^\x00-\x7f]/.test(w) ? `700 34px ${sans}` : `400 36px ${mono}`);
  const widths = WORDS.map((w) => { ctx.font = fontFor(w); return ctx.measureText(w).width; });
  const dot = 10;
  const spare = H - widths.reduce((a, b) => a + b, 0) - WORDS.length * (gap * 2 + dot);
  const pad = Math.max(0, spare / WORDS.length / 2);
  WORDS.forEach((w, i) => {
    ctx.font = fontFor(w);
    x += pad;
    ctx.fillText(w, x, 2);
    x += widths[i] + pad + gap;
    ctx.fillStyle = murasaki;
    ctx.beginPath();
    ctx.arc(x + dot / 2, 0, dot / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = paper;
    x += dot + gap;
  });
  ctx.restore();
}
