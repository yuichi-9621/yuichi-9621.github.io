import { VERT, TRAIL_FRAG, SCENE_FRAG, ASCII_FRAG } from './shaders.js';

const GLYPH_RAMP = ' .`\':;!~+=*xoXO#%@';

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) || 'shader compile failed');
  }
  return s;
}

function program(gl, fragSrc) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) || 'program link failed');
  }
  return p;
}

function makeTarget(gl, w, h) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { tex, fbo, w, h };
}

// Draw the glyph ramp into a single-row atlas texture using canvas 2D.
function makeGlyphAtlas(gl, font) {
  const cell = 64;
  const cvs = document.createElement('canvas');
  cvs.width = cell * GLYPH_RAMP.length;
  cvs.height = cell;
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, cvs.width, cvs.height);
  ctx.fillStyle = '#fff';
  ctx.font = `${cell * 0.72}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < GLYPH_RAMP.length; i++) {
    ctx.fillText(GLYPH_RAMP[i], i * cell + cell / 2, cell / 2 + cell * 0.04);
  }
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, cvs);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

export function createRenderer(canvas, opts = {}) {
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: true,
  });
  if (!gl) return null;

  let reduced = opts.reducedMotion ?? false;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const isMobile = matchMedia('(pointer: coarse)').matches;

  const progs = {
    trail: program(gl, TRAIL_FRAG),
    scene: program(gl, SCENE_FRAG),
    ascii: program(gl, ASCII_FRAG),
  };
  const U = {};
  for (const [name, p] of Object.entries(progs)) {
    U[name] = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      U[name][info.name] = gl.getUniformLocation(p, info.name);
    }
  }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const atlas = makeGlyphAtlas(gl, opts.font || '"JetBrains Mono", monospace');

  let scene, trailA, trailB;
  let W = 0, H = 0;

  function resize() {
    W = Math.max(1, Math.round(canvas.clientWidth * dpr));
    H = Math.max(1, Math.round(canvas.clientHeight * dpr));
    canvas.width = W;
    canvas.height = H;
    scene = makeTarget(gl, Math.round(W / 2), Math.round(H / 2));
    trailA = makeTarget(gl, 256, 256);
    trailB = makeTarget(gl, 256, 256);
  }
  resize();

  // pointer state (uv space)
  const ptr = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, strength: 0 };
  function setPointer(clientX, clientY, force = 1) {
    const r = canvas.getBoundingClientRect();
    ptr.px = ptr.x; ptr.py = ptr.y;
    ptr.x = (clientX - r.left) / r.width;
    ptr.y = 1 - (clientY - r.top) / r.height;
    const v = Math.hypot(ptr.x - ptr.px, ptr.y - ptr.py);
    ptr.strength = Math.min(1, 0.25 + v * 14) * force;
  }
  // splat() lets the UI melt the field at an element's position (e.g. card hover)
  function splat(clientX, clientY, force = 1) {
    setPointer(clientX, clientY, force);
  }

  const onMove = (e) => setPointer(e.clientX, e.clientY);
  const onDown = (e) => setPointer(e.clientX, e.clientY, 1.6);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });

  let liquid = 0;         // command-toggled full-liquid mode
  let liquidTarget = 0;
  const ink = opts.ink || [0.42, 1.0, 0.66];
  const cellPx = (isMobile ? 9 : 11) * dpr;

  let raf = 0;
  let t0 = performance.now();
  let elapsed = Math.random() * 100; // start somewhere interesting in the field

  function frame(now) {
    const dt = Math.min(0.05, (now - t0) / 1000);
    t0 = now;
    if (!reduced) elapsed += dt;
    liquid += (liquidTarget - liquid) * Math.min(1, dt * 3);

    // 1. trail ping-pong
    gl.bindFramebuffer(gl.FRAMEBUFFER, trailB.fbo);
    gl.viewport(0, 0, trailB.w, trailB.h);
    gl.useProgram(progs.trail);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, trailA.tex);
    gl.uniform1i(U.trail.uPrev, 0);
    gl.uniform2f(U.trail.uPointer, ptr.x, ptr.y);
    gl.uniform2f(U.trail.uPointerPrev, ptr.px, ptr.py);
    gl.uniform1f(U.trail.uStrength, reduced ? 0 : ptr.strength);
    gl.uniform1f(U.trail.uDecay, 0.94);
    gl.uniform1f(U.trail.uAspect, W / H);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    ptr.strength *= 0.75;
    ptr.px = ptr.x; ptr.py = ptr.y;
    [trailA, trailB] = [trailB, trailA];

    // 2. scene (half res)
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fbo);
    gl.viewport(0, 0, scene.w, scene.h);
    gl.useProgram(progs.scene);
    gl.uniform1f(U.scene.uTime, elapsed);
    gl.uniform1f(U.scene.uAspect, W / H);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, trailA.tex);
    gl.uniform1i(U.scene.uTrail, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 3. ascii composite to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(progs.ascii);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, scene.tex);
    gl.uniform1i(U.ascii.uScene, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, trailA.tex);
    gl.uniform1i(U.ascii.uTrail, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, atlas);
    gl.uniform1i(U.ascii.uAtlas, 2);
    gl.uniform2f(U.ascii.uRes, W, H);
    gl.uniform1f(U.ascii.uCell, cellPx);
    gl.uniform1f(U.ascii.uGlyphs, GLYPH_RAMP.length);
    gl.uniform1f(U.ascii.uTime, elapsed);
    gl.uniform1f(U.ascii.uLiquid, liquid);
    gl.uniform3f(U.ascii.uInk, ink[0], ink[1], ink[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);

  let resizeTimer;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  };
  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      t0 = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);

  return {
    splat,
    setLiquid(v) { liquidTarget = v; },
    getLiquid() { return liquidTarget; },
    // freeze/unfreeze in place — never recreate the GL context
    // (a canvas whose context was lost cannot get a fresh one)
    setReduced(v) {
      reduced = v;
      t0 = performance.now();
      if (v) {
        // clear residual pointer heat so the field freezes immediately
        for (const t of [trailA, trailB]) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
          gl.clearColor(0, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        ptr.strength = 0;
      }
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
