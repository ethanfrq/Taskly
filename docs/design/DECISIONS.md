# Design decisions

Every UI decision taken while designing Taskly, with the reason behind it. Changing one of them needs an issue first, so the trade-off is discussed again in the open.

Validated on 2026-10-16 with the [clickable prototype](prototype.html) and the [direction study](directions.html).

---

## D-001 · Visual direction: iOS grouped lists with summary tiles

**Context.** Three directions were explored on the same Today screen: grouped iOS lists (like Reminders), minimal white (no separators), and Health-style cards.

**Decision.** Grouped iOS lists, with the two summary tiles from the cards direction at the top: the daily progress ring and the next meeting.

**Why.**
- Grouped lists are the most recognizably Apple and stay readable when the day has 10+ tasks.
- The tiles give a glanceable summary without scrolling.
- Minimal white gets hard to scan past about 8 tasks, because nothing separates them.
- Full cards cap the visible tasks and push the rest behind a "See all" tap, one tap too many for a to-do app.

## D-002 · Accent-only theming, with a contrast guard

**Context.** People want to make the app their own, but letting them pick every color breaks legibility and the Apple look.

**Decision.** Users pick one accent color (11 iOS system colors or any custom color) and an appearance (light, dark, auto). Everything else comes from fixed design tokens.

**How the guard works.**
- Fills (checkboxes, progress ring, primary buttons) use the raw accent.
- Text and icons drawn in the accent are darkened in light mode, or lightened in dark mode, until they reach a contrast ratio of at least 3:1 against the card surface.
- Text on an accent fill switches from white to black when white would fall under 2:1 (yellow, very light custom colors).

The reference implementation is the `adjust()` function in the prototype.

## D-003 · Install first, onboard inside the installed app

**Context.** On iPhone, web push only works for apps added to the home screen (iOS 16.4+), and Safari doesn't share its storage with the installed app.

**Decision.** The flow is: web page → install guide → open from the home screen → full onboarding inside the app. An account created in Safari would be signed out in the installed app, so nothing is stored before installation.

Android and desktop get the browser's native install prompt instead of the Share sheet guide. Those variants will be designed with v0.1.

## D-004 · 6-digit email code instead of a magic link

**Context.** The first plan was "passkey + email magic link".

**Decision.** Email sign-in uses a 6-digit code typed into the app.

**Why.** On iPhone, a link in an email opens Safari, never the installed app. The session would land in the wrong place and the user would still be signed out in Taskly.

## D-005 · Passkeys first

**Decision.** "Continue with Face ID" (passkey) is the primary sign-in, the email code is the fallback.

**Why.** When the user connects Claude, Claude opens Taskly's authorization page in a browser that doesn't have the app's session. With a passkey synced by iCloud Keychain or Google Password Manager, signing in again there takes one gesture. With an email code, it takes a second email.

**As built.** A new account starts with the email code, so every account has an address to recover it. Face ID (or Touch ID, or the device's passkey) is offered right after the first sign-in and is the first button on later sign-ins. Creating an account with a passkey alone would leave it without any recovery path.

## D-006 · Notification permission: explain, ask on tap, test

**Decision.** The permission is only requested when the user taps "Allow notifications", after one sentence explaining what they'll receive. Once granted, the user sends themselves a test notification.

**Why.** iOS requires a user gesture to ask. Once refused, a web app can't ask again: the user has to go to Settings › Notifications › Taskly. The refusal screen says exactly that instead of hiding it.

## D-007 · Reminder insistence: 4 levels, default 2, follow-ups for priority tasks

**Decision.**
- Level 1: one reminder at the planned time.
- Level 2 (default): one reminder, then one follow-up 15 minutes later.
- Level 3: two follow-ups, 15 minutes apart.
- Level 4: a follow-up every 15 minutes until the task is checked.
- "Only follow up on priority tasks" is on by default. Other tasks get a single reminder.
- Quiet hours (default 21:00–07:00) hold every notification.

**Why.** Claude adds tasks directly (D-008), so some will be wrong. Insistent follow-ups on wrong tasks lead people to turn notifications off, and on iPhone that's close to permanent (D-006).

## D-008 · Claude-added tasks go straight into the list, with their source and an undo

**Decision.** Tasks created by Claude are added directly (no suggestion inbox). Each one shows its source (Gmail, Slack…), and the Today screen shows "Claude added 4 tasks from Gmail and Slack" with a one-tap **Undo**.

## D-009 · Connection health check at the end of onboarding

**Decision.** The last onboarding step checks, one by one:
1. the app is installed,
2. notifications are allowed,
3. the test notification arrived,
4. Claude is connected to Taskly,
5. which sources Claude can actually read. The user sends "Taskly, check my connections" in Claude, and Claude calls a Taskly tool with the connectors it sees.

Every failing item says how to fix it, for example "Slack connector missing in Claude".

## D-010 · Notification look is the system's

**Decision.** Taskly only controls the text and icon of notifications. Android notifications get action buttons (Done, In 15 min, Tomorrow). iOS web push doesn't support them, so on iPhone those actions live inside the app.

## D-011 · Who starts Claude in the morning? One tap, from Taskly

**Context.** With the MCP architecture, Taskly can't trigger Claude (ADR 0001), so tasks can't appear on their own.

**Decision.** Taskly opens Claude with the request already typed, and Claude answers it through the connector:
- The morning briefing notification, when Claude is connected but hasn't come by yet that day, opens `claude.ai/new?q=Prépare ma journée dans Taskly`. Its body shows the sentence, and Android gets an "Open Taskly" button for the app instead.
- Today has a "Prepare my day" tile (or "Refresh with Claude" once Claude came by) that does the same and also copies the sentence.
- Today refreshes when the user comes back, so Claude's tasks show up without a reload.

**Limits.** claude.ai's `?q=` prefill isn't documented and may stop working; the Claude iPhone app may open without the sentence. That's why the sentence is always visible (and copied from Today; a notification can't write to the clipboard).

## D-012 · A monochrome brand: the color belongs to the user

**Context.** Users pick their accent color during onboarding (D-002), but the app icon is fixed when the app is added to the home screen, before onboarding starts (D-003).

**Decision.** The logo only exists in graphite (`#171717`) and ivory (`#F5F3ED`). The app icon is an ivory monogram on graphite. The accent color is used for the interface, never for the logo.

**Why.**
- The icon can't follow a color the user hasn't picked yet, so a colored icon would mismatch most users' accent.
- A neutral logo sits well next to any of the 11 accents and any custom color.
- Graphite and ivory read well on both light and dark home screens.

See [docs/brand](../brand/README.md) for the files and usage rules.

## D-013 · The showcase wears the app's default colors

**Context.** The landing page, the README banners and their screenshots used an orange accent (`#F5A623`). The app's default accent is iOS blue (D-002), so a visitor who installed Taskly got a blue app that looked nothing like the page that sold it.

**Decision.** The landing page and the README visuals use the app's own tokens: iOS grays, black in dark mode, and system blue. Screenshots are taken with the default accent. Filled buttons on the landing page use `#0071e3`, a deeper blue, so white labels keep a 4.5:1 contrast. The logo stays graphite and ivory (D-012).
