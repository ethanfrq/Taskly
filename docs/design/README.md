# Design

Mockups and design decisions for Taskly, validated on 2026-10-16.

| File | What it is |
|---|---|
| [prototype.html](prototype.html) | Clickable prototype of the full iPhone flow, 13 screens: web page, install, onboarding, Claude connection, health check, Today, evening review |
| [directions.html](directions.html) | The three visual directions explored on the Today screen, plus notifications on iPhone and Android |
| [DECISIONS.md](DECISIONS.md) | Every design decision and the reason behind it |
| [../brand](../brand/README.md) | Logo files, brand colors and usage rules |

## How to open the prototype

GitHub shows HTML files as source code. To use the prototype:

- **Online:** [open it through htmlpreview](https://htmlpreview.github.io/?https://github.com/ethanfrq/Taskly/blob/main/docs/design/prototype.html) (works once this folder is on `main`).
- **Locally:** clone the repository and open `docs/design/prototype.html` in a browser.

The prototype is in French, the first language designed. English strings come with the i18n setup in v0.1.

## Screens

| # | Screen | Where |
|---|---|---|
| 1 | Web page | Safari |
| 2 | Install guide (Share › Add to Home Screen) | Safari |
| 3 | Home screen | iOS |
| 4 | Welcome and language | Installed app |
| 5 | Account: passkey or 6-digit email code | Installed app |
| 6 | Accent color and appearance | Installed app |
| 7 | Notifications: permission and test | Installed app |
| 8 | Rhythm: briefing, review, quiet hours, reminder insistence | Installed app |
| 9 | Connect Claude, per Claude plan | Installed app |
| 10 | Authorize Claude (OAuth consent) | Browser opened by Claude |
| 11 | Health check | Installed app |
| 12 | Today | Installed app |
| 13 | Evening review | Installed app |

## Design tokens

These are the prototype's values. The app will define them as CSS variables.

### Accent palette

| Name | Light | Dark |
|---|---|---|
| Blue (default) | `#007AFF` | `#0A84FF` |
| Indigo | `#5856D6` | `#5E5CE6` |
| Purple | `#AF52DE` | `#BF5AF2` |
| Pink | `#FF2D55` | `#FF375F` |
| Red | `#FF3B30` | `#FF453A` |
| Orange | `#FF9500` | `#FF9F0A` |
| Yellow | `#FFCC00` | `#FFD60A` |
| Green | `#34C759` | `#30D158` |
| Mint | `#00C7BE` | `#63E6E2` |
| Cyan | `#32ADE6` | `#64D2FF` |
| Graphite | `#8E8E93` | `#98989D` |

Custom colors are allowed. Text drawn in the accent is adjusted to keep 3:1 contrast, see [D-002](DECISIONS.md#d-002--accent-only-theming-with-a-contrast-guard).

### Surfaces and text

| Token | Light | Dark |
|---|---|---|
| Background | `#F2F2F7` | `#000000` |
| Card | `#FFFFFF` | `#1C1C1E` |
| Text | `#000000` | `#FFFFFF` |
| Secondary text | `#6E6E73` | `#98989D` |
| Separator | `#E5E5EA` | `#38383A` |
| Fill (controls) | `#E3E3E8` | `#2C2C2E` |
| Switch on | `#34C759` | `#34C759` |

### Shape and type

- System font: SF Pro on Apple devices, Roboto on Android
- Corner radius: 12 px for cards and buttons, 10 px for inputs, 9 px for segmented controls
- Hairline separators at 0.5 px, inset from the checkbox

## Not designed yet

These will be designed at the start of their milestone, so nothing gets drawn long before it's built:

- Android and desktop install flows (v0.1)
- Desktop and iPad layouts (v0.1)
- Settings, lists and tags (v0.1)
- Calendar timeline (v0.2)
- Focus mode and weekly stats (v0.4)
- Shared lists (v0.5)
