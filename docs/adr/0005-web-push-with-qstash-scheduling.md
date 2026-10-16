# 0005 · Web Push, scheduled with Upstash QStash

- **Status:** Accepted, to be implemented in v0.3
- **Date:** 2026-10-16

## Context

Reminders must arrive at the exact minute, including follow-ups every 15 minutes. A PWA can't schedule its own notifications: the server has to send each one at the right time. Vercel cron jobs on the Hobby plan run at most once a day.

## Decision

- Notifications use the standard Web Push protocol with VAPID keys.
- Each reminder is scheduled as a delayed message in [Upstash QStash](https://upstash.com/docs/qstash), provisioned through the Vercel Marketplace. At the due time, QStash calls a Taskly webhook that checks the task is still open and sends the push.

## Consequences

- Exact-time reminders on any Vercel plan.
- Checking or deleting a task cancels its pending messages, so no stale follow-ups.
- Quiet hours and the insistence level are applied in the webhook, at send time.
- One more service for self-hosters to provision.

## Alternatives considered

- Vercel cron every minute: needs a Pro plan and scans all reminders every minute.
- A durable workflow with sleeps: workable, but more moving parts than one delayed HTTP call per reminder.
