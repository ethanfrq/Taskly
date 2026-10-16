# Taskly and Claude

Taskly doesn't call Claude. Claude calls Taskly: Taskly is an [MCP](https://modelcontextprotocol.io) server that you add to Claude as a **custom connector** ([ADR 0001](adr/0001-claude-writes-into-taskly-via-mcp.md)). Claude reads your mail, calendar and messages with its own connectors, then writes your day into Taskly.

## Connect

1. In Claude, open **Settings › Connectors › Add custom connector**.
2. Paste your instance's address followed by `/api/mcp`, for example `https://taskly.example.com/api/mcp`. Taskly shows it in **Settings › Connect Claude**.
3. Claude opens Taskly's sign-in page: sign in with Face ID or an email code, then allow access.

| Claude plan | What to know |
|---|---|
| Free | One custom connector allowed: Taskly can be it. |
| Pro / Max | Add it in your own connector settings. |
| Team / Enterprise | An organization owner adds Taskly once in the organization settings, then each member turns it on. |

## Use

| Say to Claude | What happens |
|---|---|
| "Prepare my day in Taskly" | Claude reads today's events and recent emails and messages, adds the actionable ones as tasks with a link to their source, and summarizes the day |
| "Taskly, check my connections" | Claude reports which sources it can read; Taskly's health check shows them |
| "What's left today?" | Claude reads your Taskly day |
| "Mark the PR review as done" | Claude checks the task off |

Running "Prepare my day" twice is safe: Taskly skips tasks that are already there (same source link, or same title on the same day). Every batch Claude adds can be undone in one tap from the Today screen.

## Tools

| Tool | Access | What it does |
|---|---|---|
| `get_today` | read | Today's date, time zone, overdue, open and done tasks, today's events |
| `get_upcoming` | read | Open tasks for the next 1 to 31 days |
| `list_lists` | read | The user's lists, to file tasks |
| `add_tasks` | write | Up to 25 tasks, with source (`gmail`, `outlook`, `calendar`, `slack`, `teams`, `notion`, `other`) and link; duplicates skipped |
| `complete_task` | write | Checks a task off; recurring tasks get their next occurrence |
| `update_task` | write | Title, notes, day, time, priority |
| `add_calendar_events` | write | Up to 50 events; resent events (same calendar id) are updated, not duplicated |
| `report_connections` | write | The sources Claude can read, for the health check |

The server also sends Claude instructions on how to prepare a day: one short task per actionable item, a verb first, a link to the source, no tasks for newsletters or receipts.

## What Taskly stores

Tasks, their source link and a short label ("Email from Sarah"). **Never the content of your emails or messages**: Claude reads them, Taskly only receives the task.

## Security

- Claude connects through OAuth 2.1. Access tokens are bound to the MCP endpoint (RFC 8707) and signed by the instance; the endpoint checks the signature, audience, expiry and scopes on every call.
- Each call only sees the data of the user who authorized it.
- Revoke access at any time from Claude's connector settings.
