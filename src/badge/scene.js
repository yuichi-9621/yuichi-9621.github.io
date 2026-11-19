// The badge scene: one card on one lanyard, nothing else (引き算).
import {
  WebGLRenderer, Scene, PerspectiveCamera, CanvasTexture, SRGBColorSpace, MeshPhysicalMaterial,
  MeshStandardMaterial, Color, Raycaster, Vector2, Vector3, Plane, BufferGeometry, BufferAttribute,
  Mesh, DoubleSide, PMREMGenerator, DirectionalLight, AmbientLight, RepeatWrapping,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createSim, ANCHOR_Y } from './sim.js';
import { FACE_W, FACE_H, drawFront, drawBack, lineAt, loadFaceFonts } from './face.js';
import { BAND_TILE_W, BAND_TILE_H, RIB_PX, drawBand, drawWeaveNormal } from './band.js';
import { createRibbon, BAND_W, BAND_TILE, BAND_SAMPLES, ACROSS, COLS, WRAP_R, SEWN } from './ribbon.js';

const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

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
  const bandMaterial = new MeshPhysicalMaterial({
    map: bandTex,
    normalMap: weave,
    normalScale: new Vector2(0.7, 0.7),
    roughness: 0.82,
    sheen: 1,                       // the soft glow polyester gets at a glancing angle
    sheenRoughness: 0.45,
    sheenColor: new Color(css('--momo')),
    side: DoubleSide,
  });
  const idx = [];
  for (let i = 0; i < BAND_SAMPLES; i++) {
    for (let c = 0; c < COLS - 1; c++) {
      const a = i * COLS + c, b = a + COLS;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  // two strands, the front one and the one behind it, each laid out every frame
  const strands = [-1, 1].map((which) => {
    const pos = new Float32Array((BAND_SAMPLES + 1) * COLS * 3);
    const uvs = new Float32Array((BAND_SAMPLES + 1) * COLS * 2);
    const mesh = new Mesh(new BufferGeometry(), bandMaterial);
    mesh.geometry.setAttribute('position', new BufferAttribute(pos, 3));
    mesh.geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
    mesh.geometry.setIndex(idx);
    scene.add(mesh);
    return { mesh, pos, uvs, ribbon: createRibbon(which) };
  });

  const sim = createSim(new Vector3(0, 4.75, 0)); // high enough that the card still hangs near the middle
  if (reducedMotion) {
    sim.setCalm(true);
    for (let i = 0; i < 600; i++) sim.step(1 / 60); // settle off screen: no drop-in
  }

  // the fold around the bar and the tail behind, fixed to the clasp, in card space
  {
    const rows = [];
    for (let j = 0; j <= 14; j++) {           // under the bar, front to back
      const f = (j / 14) * Math.PI;
      rows.push([ANCHOR_Y - WRAP_R * Math.sin(f), WRAP_R * Math.cos(f), WRAP_R * f]);
    }
    for (let j = 1; j <= 6; j++) {            // the tail, up behind the front layer
      rows.push([ANCHOR_Y + (j / 6) * SEWN, -WRAP_R, WRAP_R * Math.PI + (j / 6) * SEWN]);
    }
    const wp = [], wu = [], wi = [];
    rows.forEach(([y, z, s]) => {
      for (const a of ACROSS) {
        wp.push((-a * BAND_W) / 2, y, z);
        wu.push(0.5 - 0.5 * a, s / BAND_TILE);  // the stitched end again, seen from behind
      }
    });
    for (let r = 0; r < rows.length - 1; r++) {
      for (let c = 0; c < COLS - 1; c++) {
        const i0 = r * COLS + c, i1 = i0 + COLS;
        wi.push(i0, i0 + 1, i1, i0 + 1, i1 + 1, i1);
      }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(wp), 3));
    g.setAttribute('uv', new BufferAttribute(new Float32Array(wu), 2));
    g.setIndex(wi);
    g.computeVertexNormals();
    card.add(new Mesh(g, bandMaterial));
  }

  function updateBand(dt) {
    const stretch = sim.ropeLength() / sim.hangLength;
    for (const { mesh, pos, uvs, ribbon } of strands) {
      ribbon.layout(pos, uvs, sim.bandPoints(), card.position, card.quaternion, camera.position, dt, stretch);
      mesh.geometry.attributes.position.needsUpdate = true;
      mesh.geometry.attributes.uv.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingSphere();
    }
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
    updateBand(dt);
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
