# yuichiokuhama.com

One badge on a lanyard. Grab it, swing it, and tap a line on it to open that page.
The idea behind it is 引き算 (hikizan): make something better by taking things away.
The rules are in [DESIGN.md](DESIGN.md).

## How it's built

- `src/badge/sim.js`: a small position-based sim (four rope points and a rigid card), no physics engine.
- `src/badge/scene.js`: three.js scene, the lanyard ribbon, dragging and clicks.
- `src/badge/face.js`: draws the front (the menu) and the back (奥浜) onto canvases.
- `tools/badge.py`: models the card and clip in Blender and exports `public/badge.glb`.
  Run it with Blender's Python module: `python3 tools/badge.py public/badge.glb`.
- `src/sheet.js`: the one sheet that opens over the badge, a native `<dialog>`.
- `src/content.js`: all the copy. Edit it here and the site updates.
- `src/tokens.css`: colors, type, spacing and motion. Four colors sampled from 19th century Ryukyu bingata robes.

The badge menu is also a real `<nav>` of buttons, so the site works with a keyboard,
a screen reader, and without WebGL (it becomes a flat card).

## Develop

```
npm ci
npm run dev
npm run build
```

Deploys to GitHub Pages from `main`. Visits are counted with GoatCounter (no cookies).
