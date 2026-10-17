# 0008 · Claude refreshes the tasks it created, with guardrails

- **Status:** Accepted, in place
- **Date:** 2026-10-17

## Context

Claude turns mail, calendar and messages into tasks (ADR 0001). Sources move on after that: Sarah replies, a meeting moves to 3 pm, a demo is cancelled. Until now Claude could only add tasks (duplicates skipped) and edit them one by one on request, so stale tasks stayed until the user cleaned them up.

Taskly never calls Claude (ADR 0001: no API key, no AI cost for whoever hosts it), so the refresh can't be a button in the app that wakes Claude up.

## Decision

- **Claude starts the refresh**: when the user says "Refresh my day in Taskly", and as a step of "Prepare my day". The MCP instructions describe the routine.
- **Two tools**: `get_claude_tasks` lists the open tasks Claude created, any date, with their source links; `refresh_tasks` applies a batch of changes: `update` (day, time, title, notes, priority), `complete` (the source shows it's done) or `remove` (no longer relevant).
- **Guardrails**, enforced by the server, not just the instructions:
  - only tasks Claude created (`source = claude`);
  - never a task the user edited in the app since (`tasks.user_edited_at`, set by the edit sheet and "move to tomorrow"): the user's version wins;
  - no `complete` or `remove` on recurring tasks, no `remove` on a task with subtasks;
  - a change that changes nothing is skipped and not logged;
  - every change carries a **reason** the user sees ("Sarah replied").
- **Visible and reversible**: each change is logged in `claude_changes` with a snapshot of the task before it. The Today screen shows "Claude refreshed 3 tasks" with the reasons and what changed, and **Undo** puts every task back, unless the user edited it after the refresh.

## Consequences

- Stale tasks clean themselves up each morning without the user losing control: nothing Claude changes is silent or permanent.
- The refresh is only as fresh as the user's last request to Claude; nothing runs on a schedule inside Taskly.
- Skipped changes are reported back to Claude with a reason (`edited_by_user`, `recurring`…), so it can tell the user instead of guessing.
- The change log is user data: it is included in the JSON export and deleted with the account.
