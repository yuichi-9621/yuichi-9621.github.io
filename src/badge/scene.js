// The badge scene: one card on one lanyard, nothing else (引き算).
import {
  WebGLRenderer, Scene, PerspectiveCamera, CanvasTexture, SRGBColorSpace, MeshPhysicalMaterial,
  MeshStandardMaterial, Color, Raycaster, Vector2, Vector3, Plane, BufferGeometry, BufferAttribute,
  Mesh, DoubleSide, CatmullRomCurve3, PMREMGenerator, DirectionalLight, AmbientLight, RepeatWrapping,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createSim } from './sim.js';
import { FACE_W, FACE_H, drawFront, drawBack, lineAt, loadFaceFonts } from './face.js';
import { BAND_TILE_W, BAND_TILE_H, RIB_PX, drawBand, drawWeaveNormal } from './band.js';

const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const BAND_W = 0.26;
const BAND_TILE = BAND_W * (BAND_TILE_H / BAND_TILE_W); // world length of one print repeat
const BAND_SAMPLES = 40;
// across the band: the middle lies flat and the edges roll back a little,
// as webbing does, so light falls off toward the edges instead of looking flat
const ACROSS = [-1, -0.45, 0.45, 1];
const ROLL = BAND_W * 0.07;

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
  scene.add(new AmbientLight(0xffffff, 0.45));
  const key = new DirectionalLight(0xfff4e0, 1.6); // warm, from the upper left, so the coat catches a highlight
  key.position.set(-3, 5, 6);
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
  // the card is thick glossy PVC: a coat over the print, soft rounded edges
  const plastic = { roughness: 0.42, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, specularIntensity: 0.7 };
  card.traverse((o) => {
    if (!o.isMesh) return;
    const name = o.material.name;
    if (name === 'face' || name === 'back') {
      o.material = new MeshPhysicalMaterial({ map: name === 'face' ? frontTex : backTex, ...plastic });
      if (name === 'face') frontMesh = o;
    } else if (name === 'edge') {
      o.material = new MeshPhysicalMaterial({ color: new Color(css('--ai-deep')), ...plastic });
    } else {
      // the fittings: polished steel
      o.material = new MeshStandardMaterial({ color: 0xd2d2cc, metalness: 1, roughness: 0.26 });
    }
  });
  scene.add(card);

  // lanyard: woven webbing with a printed intro (see band.js)
  const bandCanvas = Object.assign(document.createElement('canvas'), { width: BAND_TILE_W, height: BAND_TILE_H });
  drawBand(bandCanvas.getContext('2d'));
  const bandTex = new CanvasTexture(bandCanvas);
  bandTex.colorSpace = SRGBColorSpace;
  bandTex.wrapT = RepeatWrapping;
  bandTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const weaveCanvas = Object.assign(document.createElement('canvas'), { width: 16, height: 16 });
  drawWeaveNormal(weaveCanvas.getContext('2d'));
  const weave = new CanvasTexture(weaveCanvas);
  weave.wrapS = weave.wrapT = RepeatWrapping;
  weave.repeat.set(12, BAND_TILE_H / RIB_PX); // one rib per printed rib
  weave.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const band = new Mesh(
    new BufferGeometry(),
    new MeshPhysicalMaterial({
      map: bandTex,
      normalMap: weave,
      normalScale: new Vector2(0.7, 0.7),
      roughness: 0.82,
      sheen: 1,                       // the soft glow polyester gets at a glancing angle
      sheenRoughness: 0.45,
      sheenColor: new Color(css('--momo')),
      side: DoubleSide,
    })
  );
  const COLS = ACROSS.length;
  const pos = new Float32Array((BAND_SAMPLES + 1) * COLS * 3);
  const uvs = new Float32Array((BAND_SAMPLES + 1) * COLS * 2);
  band.geometry.setAttribute('position', new BufferAttribute(pos, 3));
  band.geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
  const idx = [];
  for (let i = 0; i < BAND_SAMPLES; i++) {
    for (let c = 0; c < COLS - 1; c++) {
      const a = i * COLS + c, b = a + COLS;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  band.geometry.setIndex(idx);
  scene.add(band);

  const sim = createSim(new Vector3(0, 4.2, 0));
  if (reducedMotion) {
    sim.setCalm(true);
    for (let i = 0; i < 600; i++) sim.step(1 / 60); // settle off screen: no drop-in
  }

  const curve = new CatmullRomCurve3([], false, 'chordal');
  const tan = new Vector3(), side = new Vector3(), view = new Vector3(), cardFront = new Vector3(), back = new Vector3();
  function updateBand() {
    curve.points = sim.bandPoints().map((p) => p.clone());
    curve.updateArcLengths(); // the cache would otherwise keep last frame's lengths
    const pts = curve.getSpacedPoints(BAND_SAMPLES);
    const len = curve.getLength();
    // the card's front, so the band can turn with it near the clasp
    cardFront.set(0, 0, 1).applyQuaternion(card.quaternion);
    for (let i = 0; i <= BAND_SAMPLES; i++) {
      const p = pts[i];
      const k = i / BAND_SAMPLES;
      curve.getTangentAt(k, tan);
      view.subVectors(camera.position, p).normalize();
      // up top the band faces you; the last stretch twists toward the card's face
      const turn = Math.max(0, (k - 0.6) / 0.4) ** 2 * 0.8;
      const f = cardFront.dot(view) < 0 ? -1 : 1;
      view.lerp(back.copy(cardFront).multiplyScalar(f), turn).normalize();
      side.crossVectors(tan, view).normalize().multiplyScalar(BAND_W / 2);
      back.crossVectors(side, tan).normalize(); // the band's own normal, toward the viewer
      // print runs down from the top; measured from the card end so it doesn't crawl as the band stretches
      const v = (len - k * len) / BAND_TILE;
      for (let c = 0; c < COLS; c++) {
        const a = ACROSS[c];
        const roll = Math.abs(a) === 1 ? -ROLL : 0;
        const o = (i * COLS + c) * 3;
        pos[o] = p.x + side.x * a + back.x * roll;
        pos[o + 1] = p.y + side.y * a + back.y * roll;
        pos[o + 2] = p.z + side.z * a + back.z * roll;
        // u: 1 on the screen-right edge (ACROSS -1), so the print reads top to bottom, unmirrored
        uvs[(i * COLS + c) * 2] = 0.5 - 0.5 * a;
        uvs[(i * COLS + c) * 2 + 1] = v;
      }
    }
    band.geometry.attributes.position.needsUpdate = true;
    band.geometry.attributes.uv.needsUpdate = true;
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
