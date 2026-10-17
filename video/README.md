# Taskly in video

Four motion design films, each in four versions: French and English, landscape (1920×1080, for the web, YouTube and LinkedIn) and portrait (1080×1920, for Reels, TikTok and Shorts). 30 fps, no sound.

| Film | Length | What it says | Files |
|---|---|---|---|
| **Overview** | 30 s | The morning pile, one sentence to Claude, the list fills itself, a reminder rings, where to find the project. | `taskly-30s-*` |
| **Reminders** | 21 s | To the minute, a follow-up 15 minutes later, quiet hours, the 07:30 briefing that opens Claude. | `taskly-reminders-*` |
| **Tasks, not emails** | 20 s | Who reads what: Claude with its connectors, Taskly gets only tasks over MCP; no API key; undo and disconnect. | `taskly-privacy-*` |
| **Your day** | 21 s | Natural-language input, one timeline for meetings and tasks, the evening review, the week's stats. | `taskly-day-*` |

They are a [Remotion](https://www.remotion.dev) project: every frame is React, so the films use the app's own tokens (`src/app/globals.css`, dark mode, system blue), the official logo paths (`src/components/brand/logo.tsx`), the same Tabler icons and the same copy as the landing page. Changing a word or a color is a code change, and the video re-renders identically.

## Render

```bash
cd video
npm install
npm run render              # all 16 files, written to ../site/assets/
npm run render:reminders    # one film (promo, reminders, privacy, day)
```

The first render downloads a headless Chrome (about 170 MB) next to `node_modules`. One film takes a minute or two on a laptop. The files land in `site/assets/`, where the landing page plays them and the README links to them; commit them with the source change that produced them.

After a new render of the overview, rebuild the posters and the README cards from frame 480 of each composition, then the landing page:

```bash
for id in TasklyPromoFR TasklyPromoEN TasklyPromoFR-Vertical TasklyPromoEN-Vertical; do node scripts/stills.mjs $id 480; done
cd .. && python3 scripts/build-readme-art.py docs/screenshots docs/brand/social-preview.png docs/readme video/out/stills && python3 scripts/build-site.py
```

Useful while editing:

```bash
npm run studio                                    # Remotion Studio, scrub any composition in the browser
node scripts/stills.mjs TasklyRemindersFR 36 205  # PNG of given frames, in out/stills/
```

The fonts are the system's (`-apple-system`, SF Pro on a Mac), like the app and the landing page. Rendering on Linux falls back to the next font in the stack, so render on a Mac for the official files.

## Structure

| File | What it holds |
|---|---|
| `src/Root.tsx` | The sixteen compositions: four films × FR/EN × landscape/portrait. |
| `src/film.tsx` | `Film`: scenes in a row with 12-frame fades, and the length arithmetic. |
| `src/Video.tsx`, `src/copy.ts`, `src/scenes/` | The overview film: its copy and its five scenes. |
| `src/films/reminders.tsx`, `privacy.tsx`, `day.tsx` | One file per feature film: copy in both languages and its scenes. |
| `src/ui/PhoneFrame.tsx`, `src/ui/screens/` | The phone and its screens, redrawn from the app: Today, lock screen, rhythm settings, Connect Claude, Agenda, evening review, stats. |
| `src/ui/layout.tsx` | `CopyAndPhone`: a title, a line, chips and a phone, beside each other in landscape and stacked in portrait. |
| `src/theme.ts`, `src/motion.tsx`, `src/brand/Logo.tsx` | Tokens, easing, the scene lead and the `Rise` entrance, the logo paths. |

Timing lives in each scene as frame constants, so a beat can be moved without touching the components. Every scene reads `useLayout()` and lays itself out for portrait with the same beats.

## Rules they follow

- The logo is ivory on dark, never recolored ([docs/brand](../docs/brand/README.md), D-012).
- The accent is the app's default system blue; third-party notifications stay gray so Taskly is the only thing in color (D-013).
- Nothing in a film claims a feature the app doesn't have: every screen is a screen of the app as shipped, with its own strings.
