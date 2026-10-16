# Security policy

Taskly handles sign-in, the Claude connection (OAuth) and push notifications for its users. Security reports are taken seriously.

## Reporting a vulnerability

**Don't open a public issue.** Report privately through GitHub instead:

1. Go to the [Security tab](https://github.com/ethanfrq/Taskly/security) of the repository.
2. Click **Report a vulnerability**.
3. Describe the issue, how to reproduce it, and its impact.

You'll get a first answer within 7 days. Taskly is a volunteer project, so fixes are made on a best-effort basis, with the most severe issues first. Once a fix ships, you'll be credited in the advisory unless you'd rather stay anonymous.

## In scope

- Authentication: passkeys, email codes, sessions
- The MCP server and its OAuth flow with Claude
- Access to another user's tasks or data
- Push notification subscriptions and the reminder scheduler
- Data export and account deletion

## Out of scope

- Vulnerabilities in Claude, its connectors, or other third-party services. Report those to the vendor.
- Self-hosted instances running modified code or outdated versions

## Supported versions

Only the latest version on `main` receives security fixes.
