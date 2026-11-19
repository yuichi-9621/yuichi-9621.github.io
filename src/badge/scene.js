// The badge scene: one card on one lanyard, nothing else (引き算).
import {
  WebGLRenderer, Scene, PerspectiveCamera, CanvasTexture, SRGBColorSpace, MeshPhysicalMaterial,
  MeshStandardMaterial, Color, Raycaster, Vector2, Vector3, Plane, BufferGeometry, BufferAttribute,
  Mesh, DoubleSide, CatmullRomCurve3, PMREMGenerator, DirectionalLight, AmbientLight,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createSim } from './sim.js';
import { FACE_W, FACE_H, drawFront, drawBack, lineAt, loadFaceFonts } from './face.js';

const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const BAND_W = 0.16;
const BAND_SAMPLES = 32;

// Fetch the model as plain bytes and parse it here, so no data: URLs are ever
// fetched (some hosts' content policies refuse those). The preview build can
// point at a base64 text copy instead, since it can't serve .glb files.
async function loadModel() {
  const file = import.meta.env.VITE_BADGE_MODEL || 'badge.glb';
  const res = await fetch(`${import.meta.env.BASE_URL}${file}`);
  if (!res.ok) throw new Error(`badge model: ${res.status}`);
  let buf;
  if (file.endsWith('.txt')) {
    const b = atob((await res.text()).trim());
    const bytes = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) bytes[i] = b.charCodeAt(i);
    buf = bytes.buffer;
  } else {
    buf = await res.arrayBuffer();
  }
  return new GLTFLoader().parseAsync(buf, '');
}

export async function createBadge(canvas, { face, onOpen, reducedMotion }) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const camera = new PerspectiveCamera(25, 1, 0.1, 100);
  camera.position.set(0, 0, 13);
  scene.environment = new PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new AmbientLight(0xffffff, 0.6));
  const key = new DirectionalLight(0xffffff, 1.4);
  key.position.set(-3, 4, 6);
  scene.add(key);

  // faces
  await loadFaceFonts();
  const frontCanvas = Object.assign(document.createElement('canvas'), { width: FACE_W, height: FACE_H });
  const backCanvas = Object.assign(document.createElement('canvas'), { width: FACE_W, height: FACE_H });
  const fctx = frontCanvas.getContext('2d');
  let state = { active: null, focusRing: false };
  drawFront(fctx, { ...face, ...state });
  drawBack(backCanvas.getContext('2d'));
  const tex = (cv) => {
    const t = new CanvasTexture(cv);
    t.colorSpace = SRGBColorSpace;
    t.flipY = false; // glTF uv origin is top left, like the canvas
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };
  const frontTex = tex(frontCanvas);
  const backTex = tex(backCanvas);

  // model (made in Blender, see tools/badge.py)
  const gltf = await loadModel();
  const card = gltf.scene;
  const ai = new Color(css('--ai'));
  let frontMesh = null;
  card.traverse((o) => {
    if (!o.isMesh) return;
    const name = o.material.name;
    if (name === 'face' || name === 'back') {
      o.material = new MeshPhysicalMaterial({
        map: name === 'face' ? frontTex : backTex,
        roughness: 0.55, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.35,
      });
      if (name === 'face') frontMesh = o;
    } else if (name === 'edge') {
      o.material = new MeshStandardMaterial({ color: ai, roughness: 0.6 });
    } else {
      o.material = new MeshStandardMaterial({ color: ai, metalness: 0.6, roughness: 0.32 });
    }
  });
  scene.add(card);

  // lanyard: a flat ribbon that faces the camera
  const band = new Mesh(
    new BufferGeometry(),
    new MeshStandardMaterial({ color: new Color(css('--beni')), roughness: 0.8, side: DoubleSide })
  );
  const pos = new Float32Array((BAND_SAMPLES + 1) * 2 * 3);
  band.geometry.setAttribute('position', new BufferAttribute(pos, 3));
  const idx = [];
  for (let i = 0; i < BAND_SAMPLES; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  band.geometry.setIndex(idx);
  scene.add(band);

  const sim = createSim(new Vector3(0, 4.2, 0));
  if (reducedMotion) {
    sim.setCalm(true);
    for (let i = 0; i < 600; i++) sim.step(1 / 60); // settle off screen: no drop-in
  }

  const curve = new CatmullRomCurve3([], false, 'chordal');
  const tan = new Vector3(), side = new Vector3(), view = new Vector3();
  function updateBand() {
    curve.points = sim.bandPoints().map((p) => p.clone());
    curve.updateArcLengths(); // the cache would otherwise keep last frame's lengths
    const pts = curve.getSpacedPoints(BAND_SAMPLES);
    for (let i = 0; i <= BAND_SAMPLES; i++) {
      const p = pts[i];
      curve.getTangentAt(i / BAND_SAMPLES, tan);
      view.subVectors(camera.position, p).normalize();
      side.crossVectors(tan, view).normalize().multiplyScalar(BAND_W / 2);
      pos.set([p.x - side.x, p.y - side.y, p.z - side.z, p.x + side.x, p.y + side.y, p.z + side.z], i * 6);
    }
    band.geometry.attributes.position.needsUpdate = true;
    band.geometry.computeVertexNormals();
    band.geometry.computeBoundingSphere();
  }

  // size: keep the card readable (at least ~320 css px wide when it can be)
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // narrow screens: pull the camera in a little so the face stays legible
    camera.position.z = w / h < 0.7 ? 11 : 13;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  // pointer: drag anywhere on the card, a press that barely moves is a click
  const ray = new Raycaster();
  const ndc = new Vector2();
  const plane = new Plane();
  const hit = new Vector3();
  let press = null;

  const toNdc = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
  };
  const lineUnder = () => {
    const h = ray.intersectObject(card, true)[0];
    if (!h) return { over: false, line: null };
    if (h.object !== frontMesh || !h.uv) return { over: true, line: null };
    return { over: true, line: lineAt(h.uv.x * FACE_W, h.uv.y * FACE_H) };
  };

  function setActive(id, focusRing = false) {
    if (state.active === id && state.focusRing === focusRing) return;
    state = { active: id, focusRing };
    drawFront(fctx, { ...face, ...state });
    frontTex.needsUpdate = true;
  }

  canvas.addEventListener('pointerdown', (e) => {
    toNdc(e);
    const h = ray.intersectObject(card, true)[0];
    if (!h) return;
    canvas.setPointerCapture(e.pointerId);
    plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new Vector3()).negate(), h.point);
    sim.grab(h.point);
    press = { x: e.clientX, y: e.clientY, line: lineUnder().line, moved: false };
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', (e) => {
    toNdc(e);
    if (press) {
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 6) press.moved = true;
      if (ray.ray.intersectPlane(plane, hit)) sim.move(hit);
      return;
    }
    const { over, line } = lineUnder();
    setActive(line);
    canvas.style.cursor = line ? 'pointer' : over ? 'grab' : '';
  });
  const end = (e) => {
    if (!press) return;
    sim.release();
    const { line, moved } = press;
    press = null;
    canvas.style.cursor = '';
    if (e.type === 'pointerup' && !moved && line) onOpen(line);
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', () => { if (!press) setActive(null); });

  // loop: pauses while the tab is hidden
  let last = performance.now();
  let running = true;
  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    const p = sim.step(dt);
    card.position.copy(p.position);
    card.quaternion.copy(p.quaternion);
    updateBand();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(frame); }
  });

  return {
    // keyboard focus on the hidden nav mirrors onto the badge
    focusLine(id) { setActive(id, !!id); },
  };
}
