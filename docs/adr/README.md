# Architecture decision records

Short records of the technical choices behind Taskly: the context, the decision, and what it costs. UI decisions live in [docs/design/DECISIONS.md](../design/DECISIONS.md).

| # | Decision | Status |
|---|---|---|
| [0001](0001-claude-writes-into-taskly-via-mcp.md) | Claude writes into Taskly through an MCP server | Accepted |
| [0002](0002-nextjs-on-vercel.md) | Next.js on Vercel | Accepted, in place |
| [0003](0003-neon-postgres-with-drizzle.md) | Neon Postgres with Drizzle ORM | Accepted |
| [0004](0004-better-auth-passkeys-and-email-codes.md) | Better Auth with passkeys and email codes | Accepted |
| [0005](0005-web-push-with-qstash-scheduling.md) | Web Push, scheduled with Upstash QStash | Accepted |
| [0006](0006-cache-components-off.md) | Cache Components turned off | Accepted, in place |
| [0007](0007-oauth-and-mcp-with-better-auth.md) | OAuth and MCP served by the app itself | Accepted, in place |

To propose a new decision or revisit one, open an issue first, then add a numbered file in a pull request.
