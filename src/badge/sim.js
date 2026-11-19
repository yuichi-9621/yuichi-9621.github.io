// A tiny position-based simulation for the lanyard and the badge.
// No physics engine: four rope points and a rigid triangle of three
// particles (top, bottom, front) that stands in for the card.
// Units match the Blender model: the card is 1.6 x 2.25, centered at 0.

import { Vector3, Quaternion, Matrix4 } from 'three';

const CARD_H = 2.25;
const ANCHOR_Y = 1.283;         // top of the clip ring, in card space (tools/badge.py prints it)
const FRONT = 0.35;             // the front particle sits this far in +z
const ROPE = 4;                 // rope points below the fixed anchor
const SEG = 0.55;               // rest length of each rope segment
const GRAVITY = -26;
const ITER = 12;

export function createSim(anchor) {
  const fixed = anchor.clone();
  const rope = [];
  for (let i = 1; i <= ROPE; i++) rope.push(particle(fixed.x + i * 0.35, fixed.y - i * 0.25, 0));
  const last = rope[ROPE - 1].p;
  // card triangle in its rest pose, hung from the last rope point
  const top = particle(last.x + 0.3, last.y - 0.2, 0);
  const bot = particle(top.p.x, top.p.y - (ANCHOR_Y + CARD_H / 2), 0);
  const mid0 = top.p.clone().add(bot.p).multiplyScalar(0.5);
  const front = particle(mid0.x, mid0.y, FRONT);
  const body = [top, bot, front];
  for (const q of body) q.body = true;
  const all = [...rope, ...body];

  const links = [];
  let prev = { p: fixed, pinned: true };
  for (const r of rope) { links.push([prev, r, SEG, true]); prev = r; }
  links.push([prev, top, 0.2, true]);
  for (const [a, b] of [[top, bot], [top, front], [bot, front]]) links.push([a, b, a.p.distanceTo(b.p), false]);

  // card-space position of each body particle, for orientation and dragging
  const local = [new Vector3(0, ANCHOR_Y, 0), new Vector3(0, ANCHOR_Y - (ANCHOR_Y + CARD_H / 2), 0), null];
  local[2] = new Vector3(0, (local[0].y + local[1].y) / 2, FRONT);

  let drag = null; // { target: Vector3, offset: Vector3 (card space) }
  let damping = 0.993;

  const pose = { position: new Vector3(), quaternion: new Quaternion() };
  const facing = new Vector3(), delta = new Vector3();
  const tmp = new Vector3(), up = new Vector3(), fwd = new Vector3(), right = new Vector3(), m = new Matrix4();

  function computePose() {
    up.subVectors(top.p, bot.p).normalize();
    tmp.addVectors(top.p, bot.p).multiplyScalar(0.5);
    fwd.subVectors(front.p, tmp);
    fwd.addScaledVector(up, -fwd.dot(up)).normalize();
    right.crossVectors(up, fwd).normalize();
    m.makeBasis(right, up, fwd);
    pose.quaternion.setFromRotationMatrix(m);
    // card origin = top particle minus its card-space offset
    pose.position.copy(top.p).sub(tmp.copy(local[0]).applyQuaternion(pose.quaternion));
  }

  function step(dt) {
    dt = Math.min(dt, 1 / 30);
    const sub = 2, h = dt / sub;
    for (let s = 0; s < sub; s++) {
      for (const q of all) {
        if (drag && q.body) continue; // held: the hand moves it, not gravity
        const v = tmp.subVectors(q.p, q.prev).multiplyScalar(damping);
        q.prev.copy(q.p);
        q.p.add(v);
        q.p.y += GRAVITY * h * h;
      }
      // turn the face toward the viewer, gently (the "spin back" of a real badge)
      computePose();
      const want = tmp.addVectors(top.p, bot.p).multiplyScalar(0.5);
      const ideal = facing.set(0, 0, 1).addScaledVector(up, -up.z).normalize().multiplyScalar(FRONT).add(want);
      // a soft spring, not a teleport, so it can't pump energy into the swing
      front.p.addScaledVector(ideal.sub(front.p), Math.min(1, 30 * h * h));

      if (drag) {
        computePose();
        const grab = tmp.copy(drag.offset).applyQuaternion(pose.quaternion).add(pose.position);
        const d = delta.subVectors(drag.target, grab);
        // the lanyard has a length: don't let the hand pull the clip past it
        const reach = facing.copy(top.p).add(d).sub(fixed);
        const L = ROPE * SEG + 0.2;
        if (reach.length() > L) d.copy(reach.setLength(L).add(fixed).sub(top.p));
        if (d.length() > 0.2) d.setLength(0.2); // follow fast, but don't teleport
        for (const q of body) { q.prev.copy(q.p); q.p.add(d); } // velocity = this move, so a release throws
      }
      for (let k = 0; k < ITER; k++) {
        for (const [a, b, rest, slack] of links) solve(a, b, rest, slack);
      }
    }
    computePose();
    return pose;
  }

  function solve(a, b, rest, slack) {
    const d = tmp.subVectors(b.p, a.p);
    const len = d.length() || 1e-6;
    // rope segments may go slack; the card triangle is rigid
    if (slack && len < rest) return;
    const diff = (len - rest) / len;
    // while dragged the card is held by the hand: the rope gives, the card doesn't
    const wa = a.pinned || (drag && a.body) ? 0 : 1, wb = drag && b.body ? 0 : 1;
    const sum = wa + wb;
    if (!sum) return;
    if (wa) a.p.addScaledVector(d, (diff * wa) / sum);
    if (wb) b.p.addScaledVector(d, (-diff * wb) / sum);
  }

  computePose();
  return {
    step,
    pose,
    // points for drawing the band: fixed anchor, rope, then the clip ring
    bandPoints() { return [fixed, ...rope.map((r) => r.p), top.p]; },
    grab(worldPoint) {
      computePose();
      const inv = pose.quaternion.clone().invert();
      drag = { target: worldPoint.clone(), offset: worldPoint.clone().sub(pose.position).applyQuaternion(inv) };
    },
    move(worldPoint) { if (drag) drag.target.copy(worldPoint); },
    release() { drag = null; },
    get dragging() { return !!drag; },
    setCalm(calm) { damping = calm ? 0.9 : 0.993; },
  };
}

function particle(x, y, z) {
  const p = new Vector3(x, y, z);
  return { p, prev: p.clone(), pinned: false };
}
