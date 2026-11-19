# Design system: 引き算

引き算 (hikizan) means subtraction: make it better by taking things away.

## 1. Rules

1. One thing per view. The badge, or one sheet. Never both in focus.
2. Before adding anything, remove something. If the page still works, it stays removed.
3. One robe's colors, each with a job. Purple is the accent and stays rare.
4. One type family in two cuts: Plex Sans for words, Plex Mono for labels.
5. Ornament lives in one place: the waves along the bottom. No glows, scanlines, blur or icons elsewhere. A 1px hairline is the only divider.
6. One accent state at a time (yamabuki on the badge, purple in the sheet).
7. Stop when removing the next thing would lose a fact or a way to get somewhere.

Removed from the old site: terminal, status bar, chip nav, theme switcher, boot lines, liquid background, tags as pills.

## 2. Color

Sampled from one kiiro (yellow ground) bingata robe and its purple sash. The page is the robe's yellow; the badge is the only dark object on it.

| Token | Hex | Its job | Contrast |
|---|---|---|---|
| `--kiiro` | #e6a94f | Page ground | n/a |
| `--ai` | #1e4553 | Badge face, text on paper and on kiiro | 5.0:1 on kiiro, 8.8:1 on paper |
| `--paper` | #f4ecd9 | The sheet | n/a |
| `--cotton` | #f1ead6 | Text on the badge | 8.6:1 on ai |
| `--yamabuki` | #f0c46e | Active line on the badge | 6.3:1 on ai |
| `--shu` | #c4382a | The lanyard (the robe's vermilion) | graphic |
| `--bengara` | #8c3324 | Lanyard edges, flower shading (the robe's dark red) | graphic |
| `--momo` | #eaa7b0 | Flower highlights, rarely | graphic |
| `--murasaki` | #45247a | Accent: links, sheet markers, lanyard pinstripe, one wave row | 10:1 on paper |
| `--asagi`, `--mizu`, `--sumi` | #3f8fae, #a9d6e0, #2a1a1f | The waves only | graphic |

Derived: `--ai-dim` #4f6670 for secondary text on paper (5.2:1), `--cotton-dim` #b4bfba for secondary text on the badge (5.5:1 on ai).

The reds are three tones of the same robe red instead of one bright red: vermilion for the band, dark red for its edges and shading, pink only inside the flowers.

## 3. Type

IBM Plex Sans JP (400, 700) and IBM Plex Mono (400), from `@fontsource`. Latin comes from the packages. Japanese is only 奥浜 and 引き算, both 700, so `src/fonts.css` ships only the four slices that hold those glyphs. Fallback: Hiragino Kaku Gothic ProN, Yu Gothic, system-ui; ui-monospace for mono.

| Role | Face | Size / line height | Weight | Tracking |
|---|---|---|---|---|
| Title | Sans | 32px / 1.15 | 700 | -0.01em |
| Lead | Sans | 20px / 1.45 | 400 | 0 |
| Body | Sans | 16px / 1.6 | 400 | 0 |
| Label | Mono, uppercase | 13px / 1.4 | 400 | 0.06em |

Max line length 60ch. Japanese is never uppercased or tracked except on the badge back.

Canvas: before drawing, `document.fonts.load` each face with the text it will draw, so the right slices load.

## 2b. Waves

`tools/waves.py` draws `src/waves.svg`: three rows of swells, back to front, in bingata style. Flat color inside sumi outlines, the crest edge shaded dark and blending inward (kumadori), two paper foam lines and a mizu line following each crest, a paper curl at each peak, a little spray on the front row, and three robe flowers riding the swells. The back row shades to purple. It sits fixed along the bottom of the page, under the badge, and is the only ornament.

## 4. Spacing

4, 8, 16, 24, 48, 96 px. Nothing in between. Badge canvas margins are 96.

## 5. Badge front (1024 x 1440 canvas)

Face fill ai. Text cotton, left aligned at x=96. Destination labels right aligned at x=928, in mono 26. Hairlines 2 px, cotton at 25%, from x=96 to 928.

| Element | Text | Position | Size | Opens |
|---|---|---|---|---|
| Slot | cut-out, radius 14 | x 412 to 612, y 64 to 92 | 200 x 28 | none |
| Top line | DESIGN ENGINEER (left), SAN FRANCISCO (right) | baseline y=264 | mono 26, 0.06em, cotton-dim | none |
| Name | Yuichi / Okuhama | baselines y=560, 712 | 144, 700 | About |
| Hairline | | y=808 | | |
| Work | Work | baseline y=900 | 56, 400 | Work |
| Hairline | | y=952 | | |
| Contact | Say hello | baseline y=1044 | 56, 400 | Contact |
| Hairline | | y=1096 | | |
| Waves | five thin sine lines across the full width, y 1134 to 1294, clear of the hairline above and the bottom line below | 3 px, cotton fading from 30% to 14% | | none |
| Bottom line | FROM OKINAWA, JAPAN | baseline y=1344 | mono 26, 0.06em, cotton-dim | none |

Hit areas span x 64 to 960. Name: y 408 to 784. Rows: 808 to 952, 952 to 1096. The space below stays empty on purpose. Each row is 144 px, which is 45 CSS px when the badge renders 320 px wide. Don't render it narrower.

Each clickable line carries its destination word (about, work, contact) at x=928 on the same baseline (name: y=712), 28 px, cotton-dim.

Hover or focus: line text and destination word turn yamabuki, and a 16 x 16 yamabuki square appears at x=56, centered on the line. Keyboard focus adds a 4 px yamabuki outline around the hit area, inset 8 px. Redraw the texture on state change, 120 ms. Cursor is `pointer`. A press that moves under 6 px is a click, anything more is a drag.

## 6. Badge back

Face fill ai. A hanko seal: a 460 px shu square, slightly turned, with a thin paper inner border and 奥浜 stacked inside in paper, 172 px, 700. 引き算 at baseline y=1300, 30 px, 700, tracked, and THE ART OF SUBTRACTION under it in mono 22 px, both cotton-dim. Not clickable.

The card itself is thick glossy PVC (0.032 units, bevelled edges): a clear coat over the print, so highlights slide across it as it swings.

## 7. Lanyard and fittings

Woven vermilion webbing 0.32 units wide, two strands of it, since a lanyard is one loop around the neck. Both ends are sewn together at the clasp, and above it the strands part in a V and run up out of view, the back one just behind the front one. The webbing is elastic: pull the badge and it stretches (the print stretches with it), let go and it springs back with a couple of bounces. It hangs at the same length as a stiff one would. The webbing has dark red selvedge edges with a fine twill, a purple pinstripe inside each edge, and the motto printed down it: SUBTRACT in mono turned sideways, then 引き算 standing upright (tategaki), three times over, with purple dots between. The weave is drawn over the print so the ribs run through the letters, a small normal map gives each rib depth, sheen gives polyester's soft glow, and the edges roll back a little. The sewn end comes down over the loop's top bar, wraps under it and runs back up behind itself, sewn down with a box-X stitch through both layers. One 4096 px tile is longer than the band, so the stitch shows once and the print never visibly repeats. Near the clasp the band turns with the card.

Fittings, modeled in `tools/badge.py`, polished steel: a tall oval link through the slot, so the clasp hangs clear of the card's top edge; a lobster clasp hooked on it, pressed as one chunky claw with a small egg-shaped hole, a thinner spring gate with hairline seams, and a ridged trigger tab; a tapered neck and swivel collar; and a flat rounded webbing loop on top, wide enough for the lanyard to wrap.

## 8. Sheet

- 900 px and up: right side, 640 px wide, full height, padding 48.
- Below 900 px: bottom sheet, full width, 88dvh, padding 24, top corners 16 px.
- Fill paper, text ai. Behind it a scrim of sumi at 28%. Section labels in mono with a 6 px purple square; links underline in purple.
- Enter: opacity 0 to 1 and 24 px slide, 320 ms, `cubic-bezier(0.2, 0, 0, 1)`. Leave: 200 ms, `cubic-bezier(0.4, 0, 1, 1)`.
- Close: a 44 x 44 text button reading "Close" at top right. Also Esc and a scrim click. Focus returns to the line that opened it.

## 9. Motion

Three durations: 120 ms (hover, focus), 200 ms (leave), 320 ms (enter).

Reduced motion: the badge hangs still, facing front, with no drop-in and no idle sway. Dragging still works. Sheets fade in 120 ms with no slide.

## 10. Accessibility

- A real `<nav>` sits first in the DOM with three buttons in badge order: About, Work, Contact. With WebGL it is visually hidden but focusable. Focusing a button turns the badge to its front and draws that line's focus state.
- Tab order: skip link, the four buttons, then the open sheet. Enter or Space opens. The sheet traps focus and moves it to its title.
- Focus ring in the DOM: 2 px purple, 3 px offset. On the badge: yamabuki, as above.
- State is never color alone. The square marker carries it too.
- No WebGL: the same `<nav>` is styled as a flat ai card, 320 x 450 px, under a static vermilion band. Same lines, same order, same sheets.
