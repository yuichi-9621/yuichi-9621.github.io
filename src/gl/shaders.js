// GLSL sources for the three-pass pipeline:
//  1. trail  — ping-pong pointer-heat buffer (drives the "melt")
//  2. scene  — domain-warped flowing gradient (the liquid)
//  3. ascii  — renders the scene as terminal glyphs, melting to liquid
//              wherever the trail buffer is hot.

export const VERT = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const TRAIL_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uPrev;
uniform vec2 uPointer;      // uv
uniform vec2 uPointerPrev;  // uv
uniform float uStrength;    // 0..1 splat strength this frame
uniform float uDecay;       // per-frame decay
uniform float uAspect;

// distance from p to segment a-b (aspect corrected)
float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 asp = vec2(uAspect, 1.0);
  p *= asp; a *= asp; b *= asp;
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  float prev = texture(uPrev, vUv).r * uDecay;
  float d = segDist(vUv, uPointerPrev, uPointer);
  float splat = uStrength * exp(-d * d * 240.0);
  outColor = vec4(clamp(prev + splat, 0.0, 1.0), 0.0, 0.0, 1.0);
}`;

export const SCENE_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform float uTime;
uniform float uAspect;
uniform sampler2D uTrail;

// ── simplex noise (Ashima / IQ public-domain style) ──
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.55;
  for (int i = 0; i < 4; i++) {
    v += a * snoise(p);
    p = p * 2.02 + vec2(11.7, 7.3);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  float t = uTime * 0.06;

  // pointer heat locally stirs the field
  float heat = texture(uTrail, vUv).r;

  // domain warp: q warps r warps color — the shadergradient feel
  vec2 q = vec2(fbm(p * 1.1 + vec2(0.0, t)),
                fbm(p * 1.1 + vec2(5.2, -t * 0.8)));
  vec2 r = vec2(fbm(p * 1.7 + 2.2 * q + vec2(1.7, 9.2) + t * 0.35),
                fbm(p * 1.7 + 2.2 * q + vec2(8.3, 2.8) - t * 0.28));
  r += heat * 0.22 * vec2(snoise(p * 3.0 + t), snoise(p * 3.0 - t));
  float f = fbm(p * 1.5 + 2.6 * r);
  float n = f * 0.5 + 0.5;

  // liquid palette: deep sea → emerald → cyan → violet → chrome
  vec3 c0 = vec3(0.012, 0.04, 0.036);
  vec3 c1 = vec3(0.03, 0.2, 0.15);
  vec3 c2 = vec3(0.08, 0.78, 0.52);
  vec3 c3 = vec3(0.36, 0.9, 1.0);
  vec3 c4 = vec3(0.66, 0.5, 1.0);

  vec3 col = mix(c0, c1, smoothstep(0.2, 0.58, n));
  col = mix(col, c2, smoothstep(0.56, 0.78, n));
  col = mix(col, c3, smoothstep(0.74, 0.9, n));
  col = mix(col, c4, smoothstep(0.87, 0.99, n));
  // iridescent drift: violet sheen following the first warp octave
  col = mix(col, col.zyx * vec3(0.9, 0.7, 1.25), 0.3 * smoothstep(0.35, 0.95, q.x));

  // specular "chrome" streaks where the warp folds — liquid-metal glint
  float glint = pow(clamp(1.0 - abs(f - 0.18) * 4.0, 0.0, 1.0), 6.0);
  col += glint * vec3(0.85, 0.95, 1.0) * 0.55;
  col += heat * 0.12; // stirred areas brighten slightly

  outColor = vec4(col, 1.0);
}`;

export const ASCII_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uScene;
uniform sampler2D uTrail;
uniform sampler2D uAtlas;
uniform vec2 uRes;        // physical px
uniform float uCell;      // physical px per glyph cell
uniform float uGlyphs;    // glyph count in atlas
uniform float uTime;
uniform float uLiquid;    // 0 = full ascii, 1 = full liquid (command toggle)
uniform vec3 uInk;        // terminal phosphor color

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

void main() {
  vec2 frag = vUv * uRes;
  vec2 cellId = floor(frag / uCell);
  vec2 cellUv = (cellId + 0.5) * uCell / uRes;   // cell-center uv
  vec2 inCell = fract(frag / uCell);

  // melt mask: pointer trail + two slow autonomous drifters + global toggle
  float trail = texture(uTrail, vUv).r;
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 b1 = vec2(0.5 + 0.33 * sin(uTime * 0.11), 0.45 + 0.3 * cos(uTime * 0.09));
  vec2 b2 = vec2(0.5 + 0.36 * cos(uTime * 0.07 + 2.1), 0.55 + 0.32 * sin(uTime * 0.13 + 4.2));
  float drift = exp(-pow(length((vUv - b1) * asp), 2.0) * 70.0)
              + exp(-pow(length((vUv - b2) * asp), 2.0) * 85.0);
  float m = clamp(trail * 1.5 + drift * 0.55, 0.0, 1.0);
  m = max(m, uLiquid);
  float melt = smoothstep(0.24, 0.72, m);

  // refraction inside the liquid: offset the scene lookup by the mask gradient
  float e = 1.5 / uRes.y;
  float gx = texture(uTrail, vUv + vec2(e, 0.0)).r - texture(uTrail, vUv - vec2(e, 0.0)).r;
  float gy = texture(uTrail, vUv + vec2(0.0, e)).r - texture(uTrail, vUv - vec2(0.0, e)).r;
  vec2 refr = vec2(gx, gy) * 0.35 * melt;

  // chromatic dispersion: refract each channel slightly differently
  vec3 liquid;
  liquid.r = texture(uScene, vUv + refr * 1.25).r;
  liquid.g = texture(uScene, vUv + refr).g;
  liquid.b = texture(uScene, vUv + refr * 0.75).b;
  vec3 sceneCell = texture(uScene, cellUv).rgb;

  // ascii layer: glyph chosen by cell luminance, drawn in phosphor ink
  float lum = luma(sceneCell);
  float idx = clamp(floor(lum * (uGlyphs - 1.0) + 0.5), 0.0, uGlyphs - 1.0);
  vec2 atlasUv = vec2((idx + inCell.x) / uGlyphs, inCell.y);
  float glyph = texture(uAtlas, atlasUv).r;
  vec3 asciiCol = uInk * glyph * (0.16 + 0.72 * lum);
  asciiCol += liquid * 0.05; // faint color bleed through the terminal

  // meniscus: bright iridescent rim where ascii melts into liquid
  float rim = smoothstep(0.05, 0.45, m) * (1.0 - smoothstep(0.45, 0.9, m));
  vec3 rimCol = mix(vec3(0.4, 1.0, 0.8), vec3(0.75, 0.6, 1.0), 0.5 + 0.5 * sin(uTime * 0.7));

  vec3 col = mix(asciiCol, liquid, melt);
  col += rim * rimCol * 0.22;

  // restrained CRT: scanlines + vignette + grain
  float scan = 0.97 + 0.03 * sin(frag.y * 3.14159 / 3.0);
  col *= mix(scan, 1.0, melt);            // scanlines only on the terminal side
  vec2 d = vUv - 0.5;
  col *= 1.0 - dot(d, d) * 0.55;
  float grain = fract(sin(dot(frag + uTime * 60.0, vec2(12.9898, 78.233))) * 43758.5453);
  col += (grain - 0.5) * 0.025;

  outColor = vec4(col, 1.0);
}`;
