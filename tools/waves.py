# Draws the bingata waves at the bottom of the page as one SVG.
# Run: python3 -I tools/waves.py src/waves.svg
#
# Bingata (紅型) paints flat color inside dark outlines, then shades the edge
# of each shape (隈取り, kumadori) so it blends inward. These waves follow that:
# rows of swells drawn back to front, each with a shaded crest, two foam
# lines, a curl at the peak and a little spray. One row is the sash purple.
# A few robe flowers ride the front rows. Colors match src/tokens.css.
import math, random, sys

W, H = 1600, 520
C = dict(
    asagi='#3f8fae', mizu='#a9d6e0', ai='#1e4553', murasaki='#45247a', sumi='#2a1a1f',
    paper='#f4ecd9', shu='#c4382a', bengara='#8c3324', momo='#eaa7b0', yamabuki='#f0c46e',
)
rnd = random.Random(717)

def fmt(pts):
    return ' '.join(f'{x:.0f},{y:.0f}' for x, y in pts)

def row_curve(crest_y, height, width, phase, jitter=0.12):
    """Top edge of one row: broad swells that rise slowly and fall fast.
    Neighbouring swells meet in a trough, so the edge is one clean line."""
    pts, peaks = [], []
    trough = crest_y + height
    x = -width * phase
    while x < W + width:
        h = height * (1 + rnd.uniform(-jitter, jitter))
        w = width * (1 + rnd.uniform(-0.1, 0.1))
        for i in range(0 if not pts else 1, 25):
            t = i / 24
            u = t ** 1.9                       # crest sits right of center, falls fast
            y = trough - h * math.sin(math.pi * u) ** 1.25
            pts.append((x + w * t, y))
        pts.append((x + w, trough))
        peaks.append((x + w * 0.69, trough - h, h, w))
        x += w
    return pts, peaks

def spiral(cx, cy, r, turns=1.15, start=-0.4):
    pts = []
    n = 60
    for i in range(n + 1):
        t = i / n
        a = start + t * turns * 2 * math.pi
        rr = r * (1 - 0.82 * t)
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return pts

def flower(cx, cy, r, rot):
    """A five-petal robe flower: vermilion petals shaded dark at the heart."""
    out = [f'<g transform="translate({cx:.1f} {cy:.1f}) rotate({rot:.1f})">']
    for k in range(5):
        a = k * 72
        out.append(
            f'<ellipse cx="0" cy="{-r*0.55:.1f}" rx="{r*0.42:.1f}" ry="{r*0.6:.1f}" transform="rotate({a})" '
            f'fill="url(#petal)" stroke="{C["sumi"]}" stroke-width="2.4"/>'
        )
    out.append(f'<circle r="{r*0.26:.1f}" fill="{C["yamabuki"]}" stroke="{C["sumi"]}" stroke-width="2.2"/>')
    for k in range(5):
        a = math.radians(k * 72 + 36)
        out.append(f'<circle cx="{r*0.13*math.cos(a):.1f}" cy="{r*0.13*math.sin(a):.1f}" r="{r*0.045:.1f}" fill="{C["sumi"]}"/>')
    out.append('</g>')
    return '\n'.join(out)

# back to front: (crest y, swell height, swell width, body colors, phase)
ROWS = [
    (250, 80, 300, (C['asagi'], C['murasaki']), 0.35),  # the purple row, furthest back
    (320, 90, 380, (C['asagi'], C['ai']), 0.7),
    (395, 100, 470, (C['asagi'], C['ai']), 0.15),
]

defs = [
    f'<linearGradient id="petal" x1="0" y1="1" x2="0" y2="0">'
    f'<stop offset="0" stop-color="{C["bengara"]}"/><stop offset=".45" stop-color="{C["shu"]}"/>'
    f'<stop offset="1" stop-color="{C["momo"]}"/></linearGradient>'
]
body = []
flowers_at = []
for i, (peak, height, width, (top, deep), phase) in enumerate(ROWS):
    curve, peaks = row_curve(peak, height, width, phase)
    gid, cid = f'g{i}', f'c{i}'
    # kumadori: the crest edge is shaded dark and blends into a light body
    defs.append(
        f'<linearGradient id="{gid}" x1="0" y1="{peak - 10}" x2="0" y2="{H}" gradientUnits="userSpaceOnUse">'
        f'<stop offset="0" stop-color="{deep}"/><stop offset=".12" stop-color="{top}"/>'
        f'<stop offset=".34" stop-color="{C["mizu"]}"/><stop offset=".7" stop-color="{top}"/>'
        f'<stop offset="1" stop-color="{deep}"/></linearGradient>'
    )
    outline = curve + [(W + 400, H + 10), (-400, H + 10)]
    defs.append(f'<clipPath id="{cid}"><polygon points="{fmt(outline)}"/></clipPath>')
    body.append(f'<polygon points="{fmt(outline)}" fill="url(#{gid})"/>')
    # two foam lines that follow the crest, inside the swell
    for k, (dy, col, sw) in enumerate([(13, C['paper'], 3.4), (25, C['paper'], 2.2), (37, C['mizu'], 2)]):
        shifted = [(x, y + dy) for x, y in curve]
        body.append(f'<polyline points="{fmt(shifted)}" fill="none" stroke="{col}" stroke-width="{sw}" '
                    f'stroke-linecap="round" clip-path="url(#{cid})" opacity=".9"/>')
    body.append(f'<polyline points="{fmt(curve)}" fill="none" stroke="{C["sumi"]}" stroke-width="3.4" stroke-linejoin="round"/>')
    # a curl at each peak and a little spray in front of it
    for px, py, h, w in peaks:
        if px < -40 or px > W + 40:
            continue
        r = h * 0.26
        sp = spiral(px + r * 0.15, py + r * 1.05, r, turns=1.3, start=-1.9)
        body.append(f'<polyline points="{fmt(sp)}" fill="none" stroke="{C["sumi"]}" stroke-width="6.5" stroke-linecap="round"/>')
        body.append(f'<polyline points="{fmt(sp)}" fill="none" stroke="{C["paper"]}" stroke-width="3.2" stroke-linecap="round"/>')
        if i == len(ROWS) - 1 and rnd.random() < 0.6:
            for s in range(3):
                sx = px + r * (1.4 + s * 0.55) + rnd.uniform(-3, 3)
                sy = py - r * (0.2 + 0.5 * math.sin(s * 1.3)) + rnd.uniform(-3, 3)
                body.append(f'<circle cx="{sx:.1f}" cy="{sy:.1f}" r="{3.6 - s * 0.7:.1f}" fill="{C["paper"]}" stroke="{C["sumi"]}" stroke-width="1.6"/>')
        if i >= 1:
            flowers_at.append((px - w * 0.3, py + h * 0.55))

# three flowers, spread out, riding the front rows
rnd.shuffle(flowers_at)
picked = []
for fx, fy in sorted(flowers_at, key=lambda p: p[0]):
    if 120 < fx < W - 120 and all(abs(fx - q[0]) > 420 for q in picked):
        picked.append((fx, fy))
for k, (fx, fy) in enumerate(picked[:3]):
    body.append(flower(fx, fy, 24 + 4 * (k % 2), rnd.uniform(0, 72)))

svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice">\n'
    f'<defs>\n' + '\n'.join(defs) + '\n</defs>\n' + '\n'.join(body) + '\n</svg>\n'
)
open(sys.argv[-1], 'w').write(svg)
print('waves', len(svg) // 1024, 'KB', 'flowers', len(picked[:3]))
