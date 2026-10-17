# Taskly in 30 seconds

The motion design video that presents Taskly: a hook, the morning pile, the logo, one sentence to Claude, the list filling itself, a reminder that rings, and where to find the project. Four files: French and English, each in landscape (1920×1080, for the web, YouTube and LinkedIn) and portrait (1080×1920, for Reels, TikTok and Shorts). 30 fps, 30 seconds, no sound.

It is a [Remotion](https://www.remotion.dev) project: every frame is React, so the video uses the app's own tokens (`src/app/globals.css`, dark mode, system blue), the official logo paths (`src/components/brand/logo.tsx`), the same Tabler icons and the same copy as the landing page. Changing a word or a color is a code change, and the video re-renders identically.

## Render it

```bash
cd video
npm install
npm run render          # the four files, in out/
npm run render:landscape   # taskly-30s-fr.mp4, taskly-30s-en.mp4
npm run render:vertical    # taskly-30s-fr-vertical.mp4, taskly-30s-en-vertical.mp4
```

The first render downloads a headless Chrome (about 170 MB) next to `node_modules`. A full render takes a few minutes on a laptop.

Useful while editing:

```bash
npm run studio                                  # Remotion Studio, scrub the timeline in the browser
node scripts/stills.mjs TasklyPromoFR 85 480    # PNG of given frames, in out/stills/
node scripts/stills.mjs TasklyPromoFR-Vertical 480
```

The fonts are the system's (`-apple-system`, SF Pro on a Mac), like the app and the landing page. Rendering on Linux falls back to the next font in the stack, so render on a Mac for the official files.

## Structure

| File | What it holds |
|---|---|
| `src/Root.tsx` | The four compositions: `TasklyPromoFR`, `TasklyPromoEN`, and their `-Vertical` twins. |
| `src/Video.tsx` | The scene order, their lengths and the 12-frame fades between them. The total is 900 frames. |
| `src/copy.ts` | Every word of both languages, and the notifications of the opening pile. |
| `src/theme.ts` | Colors, fonts and the easing, copied from the app. |
| `src/motion.tsx` | `useLayout()` (landscape or portrait, from the composition size), the scene lead, and the `Rise` entrance. |
| `src/brand/Logo.tsx` | The monogram and wordmark paths, laid out like the horizontal logo. |
| `src/scenes/` | One file per scene: `Hook`, `Reveal`, `Demo`, `Values`, `Outro`. |
| `src/ui/Phone.tsx` | The Today screen redrawn and animated: tiles, Claude's banner, tasks, ticks, the notification. |

Timing lives in each scene as frame constants (`HOOK`, `DEMO`), so a beat can be moved without touching the components. The same scenes render both formats: each one reads `useLayout()` and lays itself out for portrait (copy above a larger phone, pills stacked, notifications scaled up for a phone screen) with the same beats.

## Script

| Time | Scene | On screen |
|---|---|---|
| 0:00–0:03 | Hook | "This morning, in your pocket: 47 emails, 12 messages, 3 meetings. And no list." |
| 0:03–0:07 | Hook | The notifications fly in and bury the words. "It's all there. You sort it out." |
| 0:07–0:10 | Reveal | The logo, then "Your day, sorted by Claude. Free · Open source". |
| 0:10–0:13 | Demo | "One sentence, every morning." The prompt "Prepare my day in Taskly" is typed and sent. |
| 0:13–0:17 | Demo | Claude's banner and three tasks slide into the list, each with its source. The six sources Claude can read. |
| 0:17–0:20 | Demo | Two tasks get ticked, the ring fills. "Every task linked to its source. One tap to undo. No duplicates." |
| 0:20–0:24 | Demo | A Taskly notification drops over the screen. "Reminders that actually ring. To the minute, even with Claude closed." |
| 0:24–0:26 | Values | "Tasks, not emails." Open source · MIT, No password, Disconnect Claude in one tap. |
| 0:26–0:30 | Outro | Logo, tagline, taskly-day.vercel.app, the repository, the Anthropic disclaimer. |

## Rules it follows

- The logo is ivory on dark, never recolored ([docs/brand](../docs/brand/README.md), D-012).
- The accent is the app's default system blue; third-party notifications stay gray so Taskly is the only thing in color (D-013).
- Nothing in the video claims a feature the app doesn't have: every screen is the Today screen as shipped.
