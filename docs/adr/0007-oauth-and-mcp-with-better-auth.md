# 0007 · OAuth and MCP served by the app itself

- **Status:** Accepted, in place
- **Date:** 2026-10-16

## Context

ADR 0001 makes Taskly an MCP server that Claude connects to. Remote MCP servers are protected with OAuth 2.1: the client (Claude) discovers the authorization server, registers itself, sends the user through sign-in and consent, then calls the server with an access token.

The MCP specification of 2026-07-28 identifies clients with Client ID Metadata Documents (CIMD); earlier clients use Dynamic Client Registration (RFC 7591).

## Decision

- **Authorization server**: Better Auth's `@better-auth/mcp` plugin (built on `@better-auth/oauth-provider`) with the `jwt` plugin, in the same app and database as user accounts. Scopes `tasks:read` and `tasks:write`, plus `offline_access` for refresh tokens.
- **Client registration**: both CIMD (`@better-auth/cimd`, MCP 2026-07-28 profile) and Dynamic Client Registration, so any version of Claude's connector can register.
- **Resource server**: `/api/mcp`, guarded by `requireMcpAuth`. Tokens are JWTs bound to that resource (RFC 8707) and checked for signature, issuer, audience, expiry and scopes.
- **Protocol**: `@modelcontextprotocol/server` v2, serving the 2026-07-28 protocol and, in stateless mode, 2025-era clients.
- **Discovery** at the origin root: `/.well-known/oauth-protected-resource/api/mcp` and `/.well-known/oauth-authorization-server/api/auth`.
- **Sign-in and consent** reuse the app's pages: `/sign-in` keeps the signed OAuth query so passkey or email-code sign-in resumes the authorization, and `/oauth/consent` lists what Claude will be able to do.

## Consequences

- No extra service: self-hosters get Claude support with the same deployment.
- `BETTER_AUTH_URL` must be the public HTTPS URL in production: it is the token issuer and the resource origin.
- Verified end to end locally: registration, consent, token exchange with PKCE, then `tools/list` and `tools/call` with the token.
