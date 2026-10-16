# 0004 · Better Auth with passkeys and email codes

- **Status:** Accepted, to be implemented in v0.1
- **Date:** 2026-10-16

## Context

Sign-in has to be password-free and work inside an installed iPhone PWA. Two constraints come from the design:

- A magic link opens Safari, not the installed app, so the session lands in the wrong place ([D-004](../design/DECISIONS.md#d-004--6-digit-email-code-instead-of-a-magic-link)).
- When Claude connects, it opens Taskly's OAuth consent page in a browser without the app's session, so re-authentication must be quick ([D-005](../design/DECISIONS.md#d-005--passkeys-first)).

Taskly also needs to act as an OAuth authorization server for the MCP connection ([0001](0001-claude-writes-into-taskly-via-mcp.md)).

## Decision

[Better Auth](https://www.better-auth.com), self-hosted in the app, with:

- passkeys as the primary method,
- 6-digit one-time codes by email as the fallback,
- its OAuth provider support for the MCP connection.

## Consequences

- No third-party auth service to sign up for, which keeps self-hosting simple.
- Users' data and sessions stay in the instance's own database.
- An email provider is required to send codes.
- If Better Auth's OAuth support doesn't fit the MCP authorization spec well enough, the MCP OAuth part is revisited in v0.2 with its own record.

## Alternatives considered

- Clerk: polished and on the Vercel Marketplace, but a paid third-party service every self-hoster would have to sign up for.
- Auth.js: no built-in passkey plus email code flow, and no OAuth provider side.
