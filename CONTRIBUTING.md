# Contributing to Taskly

Thanks for helping. Taskly is built in public, one small pull request at a time, so every change stays easy to review and easy to trace.

## Ways to contribute

- 🐛 Report a bug with the [bug template](https://github.com/ethanfrq/Taskly/issues/new?template=bug_report.yml)
- 💡 Suggest a feature with the [feature template](https://github.com/ethanfrq/Taskly/issues/new?template=feature_request.yml)
- 🌐 Improve the French or English wording
- 🧑‍💻 Pick an issue labeled `good first issue` or `help wanted`

For anything bigger than a small fix, open an issue first so we can agree on the approach before you write code.

## Development setup

The Next.js app lands in the next pull requests. This section will describe how to install, run and test it locally.

## Branches

Branch from `main` and name the branch after the change:

| Prefix | Use |
|---|---|
| `feat/` | A new feature |
| `fix/` | A bug fix |
| `docs/` | Documentation only |
| `design/` | Mockups, design decisions, visual changes |
| `chore/` | Tooling, config, dependencies |
| `ci/` | GitHub Actions |

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org) with a [gitmoji](https://gitmoji.dev) in front:

```
✨ feat(today): add the daily progress ring
🐛 fix(push): stop follow-ups after a task is checked
📝 docs: explain the Claude connection
```

| Emoji | Type | When |
|---|---|---|
| ✨ | `feat` | New feature |
| 🐛 | `fix` | Bug fix |
| 📝 | `docs` | Documentation |
| 💄 | `ui` | UI and style |
| 🎨 | `design` | Mockups and design decisions |
| ♻️ | `refactor` | Code change without behavior change |
| ✅ | `test` | Tests |
| 🔧 | `chore` | Config and tooling |
| 👷 | `ci` | Continuous integration |
| ⬆️ | `deps` | Dependency upgrades |
| 🌐 | `i18n` | Translations |
| ♿ | `a11y` | Accessibility |
| 🔒 | `security` | Security fixes |

## Pull requests

- **One change per pull request.** Two unrelated changes means two pull requests.
- **Fill in the template**: what, why, how, how to test.
- **Title** follows the commit format, for example `✨ feat(today): add the daily progress ring`.
- **CI must be green**: type check, lint, tests and build.
- **UI changes need screenshots** on iPhone and desktop, in light and dark mode.
- **Squash merge only**, so `main` gets one commit per pull request and any change can be reverted on its own.

## Product rules

These come from decisions already made. Changing one needs an issue first.

1. **Taskly must work without Claude.** Manual tasks, reminders and the checklist never depend on the Claude connection.
2. **Never store email content.** Store the task and a link to its source, nothing more.
3. **Every UI string exists in French and English.**
4. **Colors come from design tokens only.** Users pick an accent color; text using it is automatically adjusted to keep a contrast ratio of at least 3:1.
5. **Notifications are precious.** A new notification type is always opt-in, respects quiet hours, and insistent follow-ups only apply to priority or timed tasks.
6. **iPhone first.** Test on an installed PWA, not only in a browser tab: notifications, storage and sign-in behave differently there.

## Code of conduct

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).
