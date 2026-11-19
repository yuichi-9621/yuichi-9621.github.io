// Lays out the lanyard ribbon each frame from the simulation's rope points.
// Kept apart from the scene so it can be tested without a browser.
import { Vector3, Quaternion, CatmullRomCurve3 } from 'three';
import { ANCHOR_Y, SEWN } from './sim.js';
import { BAND_TILE_W, BAND_TILE_H } from './band.js';

export const BAND_W = 0.26;
export const BAND_TILE = BAND_W * (BAND_TILE_H / BAND_TILE_W); // world length of one print repeat
export const BAND_SAMPLES = 40;
// across the band: the middle lies flat and the edges roll back a little,
// as webbing does, so light falls off toward the edges instead of looking flat
export const ACROSS = [-1, -0.45, 0.45, 1];
export const COLS = ACROSS.length;
const ROLL = BAND_W * 0.07;
// where the band meets the clasp: it comes down over the loop's top bar,
// wraps under it, and runs back up behind itself, sewn down (the box stitch)
export const WRAP_R = 0.021;     // the bar's wire plus the webbing's thickness
export { SEWN };

const TAU = Math.PI * 2;
const wrapPi = (a) => a - TAU * Math.round(a / TAU);
const ease = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

export function createRibbon() {
  const curve = new CatmullRomCurve3([], false, 'centripetal');
  const tan = new Vector3(), side = new Vector3(), view = new Vector3(), back = new Vector3();
  const cardSide = new Vector3(), cardUp = new Vector3(), cross = new Vector3(), d = new Vector3();
  const sewnTop = new Vector3(), sewnEnd = new Vector3();
  const twist = new Quaternion();
  let endAng = 0; // the twist at the clasp, carried frame to frame so it never flips
  let turns = 0;  // whole turns already handed to travelling twists
  const travelling = []; // full twists working their way up the band and out the top: { sign, shift }
  const sides = Array.from({ length: BAND_SAMPLES + 1 }, () => new Vector3());
  const tans = Array.from({ length: BAND_SAMPLES + 1 }, () => new Vector3());
  const angs = new Float32Array(BAND_SAMPLES + 1);
  // when a rope point joins or leaves the path the curve shifts a little; the
  // band eases into its new shape over a few frames so that never shows as a jump
  const last = new Float32Array((BAND_SAMPLES + 1) * COLS * 3);
  let lastCount = -1, settle = 0;

  // the twist that turns the camera-facing side onto the card's side, at one point
  function rawTwist(p, k, out) {
    curveTangent(k);
    view.subVectors(cam, p).normalize();
    out.crossVectors(tan, view).normalize();
    back.copy(cardSide).addScaledVector(tan, -cardSide.dot(tan));
    if (back.lengthSq() < 1e-4) return null;
    back.normalize();
    return Math.atan2(tan.dot(cross.crossVectors(out, back)), out.dot(back));
  }
  let cam = null;
  const curveTangent = (k) => curve.getTangentAt(k, tan);

  // simPoints: fixed anchor, rope points, clip point. Writes positions and uvs.
  function layout(pos, uvs, simPoints, cardPos, cardQuat, cameraPos, dt = 1 / 60) {
    cam = cameraPos;
    cardUp.set(0, 1, 0).applyQuaternion(cardQuat);
    cardSide.set(-1, 0, 0).applyQuaternion(cardQuat); // where ACROSS +1 lies on the bar
    sewnTop.set(0, ANCHOR_Y + SEWN, WRAP_R).applyQuaternion(cardQuat).add(cardPos);
    sewnEnd.set(0, ANCHOR_Y, WRAP_R).applyQuaternion(cardQuat).add(cardPos);

    // the rope hangs the badge from the top of the stitched part (see sim.js),
    // which lies straight along the card down to the front of the loop's bar
    const path = [simPoints[0].clone()];
    // (the rope point next to the clip is left out: its short link can go
    // slack and let it wander beside the clasp, which would fold the band)
    for (let i = 1; i < simPoints.length - 2; i++) {
      const q = simPoints[i];
      // a rope point that has dropped below the top of the stitching (the card
      // thrown up, the rope gone slack) would fold the band back on itself
      const above = d.subVectors(q, sewnTop).dot(cardUp);
      if (q.distanceTo(path[path.length - 1]) > 0.04 && q.distanceTo(sewnTop) > 0.06 && above > 0.05) path.push(q.clone());
    }
    path.push(sewnTop.clone(), sewnEnd.clone());
    if (lastCount !== -1 && path.length !== lastCount) settle = 0.8;
    lastCount = path.length;
    curve.points = path;
    curve.updateArcLengths();
    const pts = curve.getSpacedPoints(BAND_SAMPLES);
    const len = curve.getLength();

    // the twist that lays each sample flat on the bar, unwrapped twice: at
    // the clasp against last frame (so it never flips), then up the band
    // sample by sample (so neighbours never disagree by a half turn)
    // When the card spins past half a turn, the twist at the clasp gains a
    // whole turn. Rather than snapping, that turn leaves the clasp as a twist
    // in the band and travels up and off the top, the way a lanyard untwists.
    const r0 = rawTwist(pts[BAND_SAMPLES], 1, sides[BAND_SAMPLES]);
    if (r0 !== null) endAng += wrapPi(r0 - endAng);
    const n = Math.round(endAng / TAU);
    while (n !== turns) {
      const sgn = Math.sign(n - turns);
      travelling.push({ sign: sgn, shift: 0 });
      turns += sgn;
    }
    for (const t of travelling) t.shift += dt * 0.7;
    while (travelling.length && travelling[0].shift >= 1.1) travelling.shift();
    const base = endAng - TAU * turns;
    for (let i = BAND_SAMPLES; i >= 0; i--) {
      const r = i === BAND_SAMPLES ? r0 : rawTwist(pts[i], i / BAND_SAMPLES, sides[i]);
      tans[i].copy(i === BAND_SAMPLES ? curve.getTangentAt(1, tan) : tan);
      if (i === BAND_SAMPLES) angs[i] = base;
      else angs[i] = r === null ? angs[i + 1] : angs[i + 1] + wrapPi(r - angs[i + 1]);
    }

    for (let i = 0; i <= BAND_SAMPLES; i++) {
      const p = pts[i];
      const k = i / BAND_SAMPLES;
      // up top the band faces you; lower down it twists to lie flat on the bar
      const turn = ease((k - 0.5) / 0.45);
      side.copy(sides[i]);
      tan.copy(tans[i]);
      let ang = angs[i] * turn;
      for (const t of travelling) ang += TAU * t.sign * ease((k - 0.5 + t.shift) / 0.45);
      if (ang !== 0) side.applyQuaternion(twist.setFromAxisAngle(tan, ang));
      side.multiplyScalar(BAND_W / 2);
      back.crossVectors(side, tan).normalize(); // the band's own normal
      // print runs down from the top; measured from the clasp end so it doesn't crawl as the band stretches
      const v = (len - k * len) / BAND_TILE;
      const rollK = 1 - turn; // the sewn end lies flat
      for (let c = 0; c < COLS; c++) {
        const a = ACROSS[c];
        const roll = Math.abs(a) === 1 ? -ROLL * rollK : 0;
        const o = (i * COLS + c) * 3;
        pos[o] = p.x + side.x * a + back.x * roll;
        pos[o + 1] = p.y + side.y * a + back.y * roll;
        pos[o + 2] = p.z + side.z * a + back.z * roll;
        // u: 1 on the screen-right edge (ACROSS -1), so the print reads top to bottom, unmirrored
        uvs[(i * COLS + c) * 2] = 0.5 - 0.5 * a;
        uvs[(i * COLS + c) * 2 + 1] = v;
      }
    }
    if (settle > 0.01) {
      for (let o = 0; o < last.length; o++) pos[o] += (last[o] - pos[o]) * settle;
      settle *= 0.6;
    } else settle = 0;
    last.set(pos.subarray(0, last.length));
    return { pts, path };
  }

  return { layout };
}
