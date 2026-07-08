# yuichi.okuhama — interactive portfolio

An interactive terminal-meets-liquid portfolio. The background is a live WebGL
piece: a domain-warped liquid gradient rendered as terminal glyphs that **melt
into smooth liquid** wherever the cursor moves. Navigation is a real command
prompt (`help`, `work`, `about`, `contact` …) — or just click.

Built with vanilla JS + Vite — no frameworks, no trackers. The only runtime
dependency is [Motion](https://motion.dev) (springs, stagger) driving the
interaction layer in `src/ui/fx.js`: staggered panel entrances, the sliding
nav pill, 3D card tilt, text scramble, and metric count-ups. Everything
respects the motion toggle and `prefers-reduced-motion`. Free hosting on
GitHub Pages.

## Editing content

All copy (name, intro, projects, links, boot lines) lives in
[`src/content.js`](src/content.js). Edit that one file and push.

## Design system

- `src/gl/shaders.js` — the three-pass WebGL pipeline (pointer-trail buffer →
  liquid gradient scene → ASCII composite with refraction + chromatic
  dispersion). Palette and melt feel are tuned here.
- `src/styles.css` — phosphor terminal chrome + liquid-glass cards.
- Inspired by [shadergradient](https://github.com/ruucm/shadergradient) (MIT),
  [liquid-logo](https://github.com/paper-design/liquid-logo) and Apple's liquid
  glass — all effects reimplemented from scratch in custom GLSL/CSS.

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
```

## Deploy

Pushes to `main` deploy automatically via GitHub Actions
(`.github/workflows/deploy.yml`) to GitHub Pages.

One-time setup: repo **Settings → Pages → Source: GitHub Actions**.

## Terminal commands

`help` `work` `about` `contact` `home` `ls` `whoami` `email` `linkedin`
`github` `liquid` (melt everything) `ascii` (re-freeze) `motion on|off`
`clear` — and a couple of hidden ones.
