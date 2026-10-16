# 0003 · Neon Postgres with Drizzle ORM

- **Status:** Accepted, to be implemented in v0.1
- **Date:** 2026-10-16

## Context

The request was "a Vercel database". Vercel no longer runs its own Postgres: databases are provisioned from the Vercel Marketplace. Taskly's data is relational (users, lists, tasks, subtasks, reminders, push subscriptions, OAuth clients).

## Decision

Postgres on [Neon](https://neon.tech), provisioned through the Vercel Marketplace, accessed with [Drizzle ORM](https://orm.drizzle.team). Schema changes go through Drizzle migrations committed to the repository.

## Consequences

- One click to provision on Vercel, environment variables injected automatically.
- Typed queries, and migrations reviewed in pull requests like any other code.
- Self-hosters can point `DATABASE_URL` at any Postgres.

## Alternatives considered

- Supabase: also fine, but brings its own auth and APIs that overlap with choices made elsewhere.
- A key-value store: doesn't fit lists, subtasks and sharing.
