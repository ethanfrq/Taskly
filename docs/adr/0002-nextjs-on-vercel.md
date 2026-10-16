# 0002 · Next.js on Vercel

- **Status:** Accepted, in place
- **Date:** 2026-10-16

## Context

The project was asked to be built with React and hosted on Vercel. Besides the UI, Taskly needs server code: the MCP endpoint, the OAuth flow, push subscriptions and the reminder webhooks.

## Decision

Next.js (App Router, TypeScript) with Tailwind CSS, deployed on Vercel. Node.js version pinned in `.nvmrc`.

## Consequences

- UI, API routes, the MCP endpoint and webhooks live in one project and one deployment.
- Self-hosters get a one-click "Deploy to Vercel" path.
- Vercel's Hobby plan is for personal, non-commercial use: a company instance needs a Pro team.
- Next.js changes quickly. The generated `AGENTS.md` points coding agents to the docs shipped in `node_modules/next/dist/docs/`.

## Alternatives considered

Vite with a React SPA and separate Vercel Functions: lighter, but splits routing and server code for no gain here.
