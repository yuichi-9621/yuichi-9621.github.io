// The lanyard: woven polyester webbing with my motto printed on it.
// One tile repeats along the band. The weave is drawn over the print, so the
// ribs run through the letters the way ink sits in real fabric, and a small
// normal map gives the ribs depth when the light rakes across them.

export const BAND_TILE_W = 256;   // across the band, px
export const BAND_TILE_H = 4096;  // along the band, px
export const RIB_PX = 6;          // one woven rib, px along the band

const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

// 引き算, the art of subtraction, in English and Japanese, repeated down the band
const WORDS = ['SUBTRACT', '引き算', 'SUBTRACT', '引き算', 'SUBTRACT', '引き算'];

// a small seeded random, so the fibers land the same way every load
function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
}

export function drawBand(ctx) {
  const W = BAND_TILE_W, H = BAND_TILE_H;
  const shu = css('--shu'), bengara = css('--bengara'), murasaki = css('--murasaki');
  const paper = css('--paper'), mono = css('--mono'), sans = css('--font');
  const EDGE = 18, STRIPE_X = 30, STRIPE_W = 8;
  // the bottom of the tile is the end that loops through the clasp; the band
  // is long enough that this end shows once, sewn down with a box stitch
  const STITCH = 300;

  ctx.save();
  ctx.fillStyle = shu;
  ctx.fillRect(0, 0, W, H);
  // woven selvedge edges, then the purple pinstripe just inside them
  ctx.fillStyle = bengara;
  ctx.fillRect(0, 0, EDGE, H);
  ctx.fillRect(W - EDGE, 0, EDGE, H);
  ctx.fillStyle = murasaki;
  ctx.fillRect(STRIPE_X, 0, STRIPE_W, H);
  ctx.fillRect(W - STRIPE_X - STRIPE_W, 0, STRIPE_W, H);

  // the print: words run down the band, tops toward the band's right edge
  ctx.save();
  ctx.translate(W / 2, 0);
  ctx.rotate(Math.PI / 2);
  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
  const gap = 64, dot = 18;
  const fontFor = (w) => (/[^\x00-\x7f]/.test(w) ? `700 66px ${sans}` : `400 70px ${mono}`);
  // Japanese stands upright and stacks down the band (tategaki); latin runs sideways
  const isJa = (w) => /[^\x00-\x7f]/.test(w);
  const STEP = 74;
  const widths = WORDS.map((w) => { ctx.font = fontFor(w); return isJa(w) ? [...w].length * STEP : ctx.measureText(w).width; });
  // spread the words evenly over the whole tile, which keeps the repeat seamless
  const spare = H - STITCH - widths.reduce((a, b) => a + b, 0) - WORDS.length * (gap * 2 + dot);
  const pad = Math.max(0, spare / WORDS.length / 2);
  // ink on cloth is a little soft and never fully opaque
  ctx.shadowColor = paper;
  ctx.shadowBlur = 1.5;
  let x = gap / 2;
  WORDS.forEach((w, i) => {
    ctx.font = fontFor(w);
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = paper;
    x += pad;
    if (isJa(w)) {
      [...w].forEach((ch, k) => {
        ctx.save();
        ctx.translate(x + k * STEP + STEP / 2, 0);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(ch, 0, 4);
        ctx.restore();
      });
    } else {
      ctx.fillText(w, x, 4);
    }
    x += widths[i] + pad + gap;
    ctx.fillStyle = murasaki;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(x + dot / 2, 0, dot / 2, 0, Math.PI * 2);
    ctx.fill();
    x += dot + gap;
  });
  ctx.restore();

  // the weave, over everything: ribs across the band (a dark valley and a
  // lit crest in each), fine warp threads along it, and a scatter of fibers
  for (let y = 0; y < H; y += RIB_PX) {
    ctx.fillStyle = 'rgba(40, 8, 6, 0.16)';
    ctx.fillRect(0, y, W, 1.5);
    ctx.fillStyle = 'rgba(255, 236, 214, 0.07)';
    ctx.fillRect(0, y + RIB_PX / 2, W, 1.5);
  }
  for (let x = 0; x < W; x += 4) {
    ctx.fillStyle = x % 8 ? 'rgba(40, 8, 6, 0.05)' : 'rgba(255, 236, 214, 0.035)';
    ctx.fillRect(x, 0, 1, H);
  }
  // the selvedge is woven tighter: a fine diagonal twill on each edge
  ctx.strokeStyle = 'rgba(20, 4, 4, 0.22)';
  ctx.lineWidth = 1.2;
  for (const x0 of [0, W - EDGE]) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, 0, EDGE, H);
    ctx.clip();
    for (let y = -EDGE; y < H; y += 5) {
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + EDGE, y + EDGE * 0.6);
      ctx.stroke();
    }
    ctx.restore();
  }
  const r = rng(717);
  for (let i = 0; i < 2600; i++) {
    const fx = r() * W, fy = r() * H, len = 3 + r() * 9;
    ctx.fillStyle = r() < 0.5 ? 'rgba(40, 8, 6, 0.10)' : 'rgba(255, 236, 214, 0.08)';
    ctx.fillRect(fx, fy, 1, len);
  }
  // the sewn end: a doubled layer, a box with an X stitched through it
  const sy0 = H - STITCH + 70, sy1 = H - 60, sx0 = EDGE + 14, sx1 = W - EDGE - 14;
  ctx.fillStyle = 'rgba(30, 6, 6, 0.12)';
  ctx.fillRect(0, H - STITCH + 40, W, STITCH - 40);
  const seam = (x0, y0, x1, y1) => {
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(len / 14);
    for (let k = 0; k < n; k++) {
      const a = (k + 0.15) / n, b = (k + 0.75) / n;
      for (const [col, off] of [['rgba(30, 6, 6, 0.45)', 1.5], [css('--momo'), 0]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x0 + (x1 - x0) * a + off, y0 + (y1 - y0) * a + off);
        ctx.lineTo(x0 + (x1 - x0) * b + off, y0 + (y1 - y0) * b + off);
        ctx.stroke();
      }
    }
  };
  seam(sx0, sy0, sx1, sy0); seam(sx1, sy0, sx1, sy1); seam(sx1, sy1, sx0, sy1); seam(sx0, sy1, sx0, sy0);
  seam(sx0, sy0, sx1, sy1); seam(sx1, sy0, sx0, sy1);
  // the edges roll a little, so they sit in a touch of shadow
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, 'rgba(30, 6, 6, 0.28)');
  g.addColorStop(0.07, 'rgba(30, 6, 6, 0)');
  g.addColorStop(0.93, 'rgba(30, 6, 6, 0)');
  g.addColorStop(1, 'rgba(30, 6, 6, 0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// One rib of the weave as a normal map: the surface rises and falls along the
// band, with a faint ripple across it where the warp threads sit. It repeats
// RIB count times along each print tile (see scene.js).
export function drawWeaveNormal(ctx) {
  const N = 16;
  const img = ctx.createImageData(N, N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const along = Math.cos((y / N) * Math.PI * 2) * 0.55;        // the rib
      const across = Math.cos((x / N) * Math.PI * 4) * 0.16;       // warp threads
      const nx = -across, ny = -along, nz = 1;
      const l = Math.hypot(nx, ny, nz);
      const i = (y * N + x) * 4;
      img.data[i] = ((nx / l) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((ny / l) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((nz / l) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}
