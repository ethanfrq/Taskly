# 0001 · Claude writes into Taskly through an MCP server

- **Status:** Accepted
- **Date:** 2026-10-16

## Context

Taskly's value is a daily checklist built from the user's mail, calendar and messages, using Claude. Two architectures were possible:

- **A.** Taskly exposes an MCP server. Users add it to Claude as a custom connector. Claude, which already reads Gmail, Outlook, calendars, Slack, Teams or Notion through its own connectors, creates tasks in Taskly.
- **B.** Taskly connects to Google and Microsoft itself, and calls the Claude API to turn emails into tasks.

## Decision

Architecture A.

## Consequences

**Good**
- Works with the Claude plan users already have. No Anthropic API key, no per-use cost for whoever hosts Taskly.
- No Google OAuth verification. Reading Gmail is a restricted scope that requires a paid annual security assessment for a public app.
- Taskly never stores mail access tokens or email content, only the tasks Claude creates.
- Any source Claude can connect to works, without Taskly code per provider.

**Costs**
- Users need a Claude plan that allows custom connectors. The Free plan allows one, which is enough for Taskly. On Team and Enterprise, an organization owner has to add it.
- Taskly can't start Claude on its own. The morning sync needs the user to ask Claude, or a prompt prefilled from the briefing notification (to verify in v0.2).
- The MCP server needs an OAuth authorization server, since Claude connects to remote MCP servers with OAuth.

**Rule that follows from it:** Taskly must work without Claude. Manual tasks, reminders and the checklist never depend on the connection.

## Alternatives considered

B was rejected for v0.x: API keys are a blocker for the general public, and Gmail's restricted scope makes a public instance costly to run. It can come back later as an optional advanced mode.
