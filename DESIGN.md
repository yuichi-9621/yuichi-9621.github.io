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
| Company | DG717 | baseline y=900 | 56, 400 | Work |
| Hairline | | y=952 | | |
| Built | Things I built | baseline y=1044 | 56, 400 | Built |
| Hairline | | y=1096 | | |
| Contact | Say hello | baseline y=1188 | 56, 400 | Contact |
| Hairline | | y=1240 | | |
| Bottom line | FROM OKINAWA, JAPAN | baseline y=1344 | mono 26, 0.06em, cotton-dim | none |

Hit areas span x 64 to 960. Name: y 408 to 784. Rows: 808 to 952, 952 to 1096, 1096 to 1240. Each row is 144 px, which is 45 CSS px when the badge renders 320 px wide. Don't render it narrower.

Each clickable line carries its destination word (about, work, built, contact) at x=928 on the same baseline (name: y=712), 28 px, cotton-dim.

Hover or focus: line text and destination word turn yamabuki, and a 16 x 16 yamabuki square appears at x=56, centered on the line. Keyboard focus adds a 4 px yamabuki outline around the hit area, inset 8 px. Redraw the texture on state change, 120 ms. Cursor is `pointer`. A press that moves under 6 px is a click, anything more is a drag.

## 6. Badge back

Face fill ai. 奥浜 stacked vertically, 360 px, 700, cotton. 引き算 at baseline y=1300, 30 px, 700, tracked, and THE BEAUTY OF SUBTRACTION under it in mono 22 px, both cotton-dim. Not clickable.

The card itself is thick glossy PVC (0.032 units, bevelled edges): a clear coat over the print, so highlights slide across it as it swings.

## 7. Lanyard and fittings

Vermilion webbing 0.22 units wide, dark red woven edges, a purple pinstripe inside each edge, and a printed intro running down it in mono: YUICHI OKUHAMA, DESIGN ENGINEER, SAN FRANCISCO, FROM OKINAWA, 引き算, with purple dots between. One 2048 px tile repeats; the print is anchored at the card end so it doesn't crawl as the band stretches.

Fittings, modeled in `tools/badge.py`, polished steel: a jump ring through the slot, a lobster clasp hooked on it with a gate lever, and a swivel with an eye that the lanyard loops through.

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

- A real `<nav>` sits first in the DOM with four buttons in badge order: About, Work, Built, Contact. With WebGL it is visually hidden but focusable. Focusing a button turns the badge to its front and draws that line's focus state.
- Tab order: skip link, the four buttons, then the open sheet. Enter or Space opens. The sheet traps focus and moves it to its title.
- Focus ring in the DOM: 2 px purple, 3 px offset. On the badge: yamabuki, as above.
- State is never color alone. The square marker carries it too.
- No WebGL: the same `<nav>` is styled as a flat ai card, 320 x 450 px, under a static vermilion band. Same lines, same order, same sheets.
