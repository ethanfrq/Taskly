# 0006 · Cache Components turned off

- **Status:** Accepted
- **Date:** 2026-10-16

## Context

`create-next-app` 16.4 enables Cache Components by default. With it, any page that reads cookies, headers or per-user data outside a `<Suspense>` boundary fails the build, and a plain `"use cache"` function that reaches `cookies()` can pass the build and fail at runtime.

Almost every Taskly screen is per user: the session, the user's language, accent color and tasks.

## Decision

Turn Cache Components off (`cacheComponents` removed from `next.config.ts`). Pages that read the session or cookies are rendered per request, which is Next.js's classic dynamic model.

## Consequences

- Simpler code: no Suspense boundary needed only to satisfy the prerender rules, no private cache directives.
- Little lost: the static shell Cache Components would prerender is a few pixels of chrome around per-user content.
- Data freshness after a mutation is handled with `revalidatePath()` / `refresh()` in Server Actions.
- If a public, cacheable part grows (marketing pages, docs), revisit this decision for those routes.
