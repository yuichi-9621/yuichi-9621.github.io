# Design system: 引き算

引き算 (hikizan) means subtraction: make it better by taking things away.

## 1. Rules

1. One thing per view. The badge, or one sheet. Never both in focus.
2. Before adding anything, remove something. If the page still works, it stays removed.
3. Four colors, one job each. A fifth needs one of the four to go.
4. One type family, two weights. Hierarchy comes from size and space.
5. No shadows, gradients, glows, scanlines, blur or icons. A 1px hairline is the only divider.
6. One accent state at a time (ochre).
7. Stop when removing the next thing would lose a fact or a way to get somewhere.

Removed from the old site: terminal, status bar, chip nav, theme switcher, boot lines, liquid background, tags as pills.

## 2. Color

Light ground. Undyed cotton is what bingata starts from. It makes the ai badge the only dark object on screen, and case studies read at 7.59:1.

| Token | Hex | Its one job | Contrast |
|---|---|---|---|
| `--cotton` | #dfddd2 | Ground: page and sheet | n/a |
| `--ai` | #1e4553 | Text on cotton, badge face | 7.59:1 on cotton |
| `--ochre` | #d7ba5d | Active line on the badge | 5.45:1 on ai |
| `--beni` | #cf574e | Lanyard band | 3.01:1 on cotton (graphic) |

Derived, no new hues: `--ai-dim` #45636c for secondary text on cotton (4.74:1), `--cotton-dim` #afb7b2 for secondary text on the badge (5.04:1 on ai).

Never use ochre on cotton (1.39:1) or beni for text. Maroon and aqua gray are subtracted.

## 3. Type

Package: `@fontsource/zen-kaku-gothic-new`, weights 400 and 700 (`400.css`, `700.css`). One family covers Latin and Japanese. No custom subset needed: the package ships unicode-range slices and the browser fetches only those in use. Latin is about 10 kB per weight, 奥浜 at 700 adds 18 kB, 引き算 at 400 adds 35 kB. Fallback: Hiragino Kaku Gothic ProN, Yu Gothic, system-ui. Drop `@fontsource/jetbrains-mono`.

| Role | Size / line height | Weight | Tracking |
|---|---|---|---|
| Title | 32px / 1.15 | 700 | -0.01em |
| Lead | 20px / 1.45 | 400 | 0 |
| Body | 16px / 1.6 | 400 | 0 |
| Caption | 13px / 1.4, uppercase | 400 | 0.08em |

Max line length 60ch. Set `lang="ja"` on Japanese spans. Japanese is never uppercased or tracked.

Canvas: before drawing, `await document.fonts.load('700 144px "Zen Kaku Gothic New"', 'Yuichi Okuhama 奥浜')` and the same for 400. The text argument makes the right slices load. Use `ctx.letterSpacing` for captions.

## 4. Spacing

4, 8, 16, 24, 48, 96 px. Nothing in between. Badge canvas margins are 96.

## 5. Badge front (1024 x 1440 canvas)

Face fill ai. Text cotton, left aligned at x=96. Destination labels right aligned at x=928. Hairlines 2 px, cotton at 25%, from x=96 to 928.

| Element | Text | Position | Size | Opens |
|---|---|---|---|---|
| Slot | cut-out, radius 14 | x 412 to 612, y 64 to 92 | 200 x 28 | none |
| Role | DESIGN ENGINEER | baseline y=264 | 28, 400, 0.08em, cotton-dim | none |
| Name | Yuichi / Okuhama | baselines y=560, 712 | 144, 700 | About |
| Hairline | | y=808 | | |
| Company | DG717 | baseline y=900 | 56, 400 | Work |
| Hairline | | y=952 | | |
| Built | Things I built | baseline y=1044 | 56, 400 | Built |
| Hairline | | y=1096 | | |
| Contact | Say hello | baseline y=1188 | 56, 400 | Contact |
| Hairline | | y=1240 | | |
| Place | San Francisco | baseline y=1344 | 28, 400, cotton-dim | none |

Hit areas span x 64 to 960. Name: y 408 to 784. Rows: 808 to 952, 952 to 1096, 1096 to 1240. Each row is 144 px, which is 45 CSS px when the badge renders 320 px wide. Don't render it narrower.

Each clickable line carries its destination word (about, work, built, contact) at x=928 on the same baseline (name: y=712), 28 px, cotton-dim.

Hover or focus: line text and destination word turn ochre, and a 16 x 16 ochre square appears at x=56, centered on the line. Keyboard focus adds a 4 px ochre outline around the hit area, inset 8 px. Redraw the texture on state change, 120 ms. Cursor is `pointer`. A press that moves under 6 px is a click, anything more is a drag.

## 6. Badge back

Face fill ai. 奥浜 stacked vertically, 360 px, 700, cotton, centered at x=512 with glyph centers at y=540 and y=900. 引き算 at baseline y=1344, 28 px, 400, cotton-dim, centered. Not clickable.

## 7. Lanyard

Plain beni band, no pattern, 28 px wide in badge units. The clip is ai.

## 8. Sheet

- 900 px and up: right side, 640 px wide, full height, padding 48.
- Below 900 px: bottom sheet, full width, 88dvh, padding 24, top corners 16 px.
- Fill cotton, text ai. Behind it a scrim of ai at 24%.
- Enter: opacity 0 to 1 and 24 px slide, 320 ms, `cubic-bezier(0.2, 0, 0, 1)`. Leave: 200 ms, `cubic-bezier(0.4, 0, 1, 1)`.
- Close: a 44 x 44 text button reading "Close" at top right. Also Esc and a scrim click. Focus returns to the line that opened it.

## 9. Motion

Three durations: 120 ms (hover, focus), 200 ms (leave), 320 ms (enter).

Reduced motion: the badge hangs still, facing front, with no drop-in and no idle sway. Dragging still works. Sheets fade in 120 ms with no slide.

## 10. Accessibility

- A real `<nav>` sits first in the DOM with four buttons in badge order: About, Work, Built, Contact. With WebGL it is visually hidden but focusable. Focusing a button turns the badge to its front and draws that line's focus state.
- Tab order: skip link, the four buttons, then the open sheet. Enter or Space opens. The sheet traps focus and moves it to its title.
- Focus ring in the DOM: 2 px ai, 3 px offset. On the badge: ochre, as above.
- State is never color alone. The square marker carries it too.
- No WebGL: the same `<nav>` is styled as a flat ai card, 320 x 450 px, under a static beni band. Same lines, same order, same sheets.
