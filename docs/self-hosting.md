# Self-hosting Taskly

Taskly is one Next.js app and one Postgres database. Everything else is optional or replaceable. This guide covers [Vercel](#vercel) (the easiest) and [your own server](#your-own-server).

## What you need

| Piece | Why | On Vercel | Elsewhere |
|---|---|---|---|
| Postgres | Accounts, tasks, reminders | Neon, from the Vercel Marketplace | Any Postgres you can reach with a `postgres://` URL |
| `BETTER_AUTH_SECRET` | Signs sessions and OAuth tokens | Environment variable | Environment variable |
| [Resend](https://resend.com) | Sends the 6-digit sign-in codes | Environment variable | Environment variable |
| VAPID keys | Identify your instance to push services | Environment variables | Environment variables |
| Reminder scheduler | Sends each reminder at its minute | Upstash QStash, from the Marketplace | The server itself (`TASKLY_INTERNAL_SCHEDULER=1`) |
| HTTPS | Passkeys, push, the service worker and OAuth all require it | Built in | A reverse proxy (Caddy, nginx…) |

Nothing calls the Anthropic API: users connect their own Claude to your instance ([connect-claude.md](connect-claude.md)), so hosting Taskly has no AI cost.

<a id="vercel"></a>

## ▲ Vercel

### 1. Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fethanfrq%2FTaskly&project-name=taskly&repository-name=taskly&env=BETTER_AUTH_SECRET,RESEND_API_KEY,EMAIL_FROM,NEXT_PUBLIC_VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY,VAPID_SUBJECT&envDescription=Secrets%20for%20sign-in%2C%20email%20codes%20and%20push%20notifications.&envLink=https%3A%2F%2Fgithub.com%2Fethanfrq%2FTaskly%2Fblob%2Fmain%2Fdocs%2Fself-hosting.md%23environment-variables&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D)

The button copies the repository to your GitHub account, asks for the variables below and offers to create a Neon database. Prepare the values first:

```bash
openssl rand -base64 32
```

```bash
npx web-push generate-vapid-keys
```

| Variable | Value |
|---|---|
| `BETTER_AUTH_SECRET` | The output of `openssl rand -base64 32`. Keep it: changing it signs everyone out, and users may have to reconnect Claude. |
| `RESEND_API_KEY` | An API key from Resend. |
| `EMAIL_FROM` | A sender on a domain you verified in Resend, e.g. `Taskly <taskly@your-domain.com>`. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | The public key from `web-push generate-vapid-keys`. |
| `VAPID_PRIVATE_KEY` | The private key from the same command. |
| `VAPID_SUBJECT` | `mailto:` followed by an address push services can reach you at. |

### 2. Database

If the deploy didn't offer to create the database, open the project's **Storage** tab, add **Neon** and connect it to all environments. It sets `DATABASE_URL`.

The migrations run on every deployment (`vercel-build` runs `db:migrate` before `next build`). Without a `postgres://` `DATABASE_URL`, the build stops with a message saying so: on Vercel a local database would be lost after each deployment.

### 3. Reminders

Vercel functions don't run in the background, so something has to wake Taskly up when a reminder is due. Pick one:

- **Upstash QStash (recommended).** In **Storage** or the Marketplace, add **Upstash › QStash** to the project. It sets `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY`. Taskly then schedules each reminder for its exact minute, and QStash calls `/api/reminders/fire` with a signed request.
- **A cron, every minute.** Set `CRON_SECRET` to a random string and have any external cron call `GET https://your-domain/api/reminders/sweep` with the header `Authorization: Bearer <CRON_SECRET>` every minute. Vercel's own cron jobs on the Hobby plan can't run that often.

> [!NOTE]
> QStash has to reach your deployment. Production domains are public by default; if you turn on Deployment Protection for production, reminders stop arriving.

### 4. Redeploy and check

Environment variables only apply to new deployments: after adding the database, QStash or a variable, redeploy (**Deployments › ⋯ › Redeploy**).

Then open your instance on your phone, install it, and go through the onboarding. **Settings › Connect Claude** shows a health check: app installed, notifications allowed, test notification received, Claude connected.

### 5. Custom domain (optional)

Add it under **Settings › Domains**, then set `BETTER_AUTH_URL=https://your-domain` and redeploy. Without it, Taskly uses the project's production URL.

> [!IMPORTANT]
> Passkeys belong to a domain. If you move Taskly to another domain, existing passkeys stop working there; users sign in with an email code and add a new passkey. Claude has to be reconnected with the new address too.

> [!IMPORTANT]
> Vercel's Hobby plan is for personal, non-commercial use. To host Taskly for a company or its clients, use a Pro team.

<a id="your-own-server"></a>

## 🖥️ Your own server

Any machine with Node.js 22 or later (24 recommended, see `.nvmrc`), a Postgres database and a domain with HTTPS.

```bash
git clone https://github.com/ethanfrq/Taskly.git
cd Taskly
npm ci
```

Create `.env.local` from [`.env.example`](../.env.example) with at least `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, the three VAPID variables and `TASKLY_INTERNAL_SCHEDULER=1`. Then:

```bash
npm run db:migrate
```

```bash
npm run build
```

```bash
npm start
```

Taskly listens on port 3000; put a reverse proxy with HTTPS in front of it. Caddy does it in two lines:

```
taskly.your-domain.com {
  reverse_proxy localhost:3000
}
```

With `TASKLY_INTERNAL_SCHEDULER=1`, the server checks for due reminders every 20 seconds; no QStash or cron needed. Keep the process running with systemd, pm2 or your platform's equivalent. Each reminder is claimed in the database before it is sent, so a second instance can't send it twice.

To update: `git pull`, `npm ci`, `npm run db:migrate`, `npm run build`, then restart.

<a id="environment-variables"></a>

## 🔧 Environment variables

| Variable | Required | What it does |
|---|---|---|
| `DATABASE_URL` | Production | `postgres://` connection string. Unset locally: a PGlite database in `.data/pglite`. |
| `BETTER_AUTH_SECRET` | Production | Signs sessions and tokens. `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | Custom domain | Public URL of the instance. Unset: `http://localhost:3000` locally, the production URL on Vercel. |
| `RESEND_API_KEY` | Production | Sends sign-in codes. Unset locally: codes are printed in the server console. In production Taskly refuses to print them, since they would end up in logs. |
| `EMAIL_FROM` | With Resend | Sender address on a domain verified in Resend. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | For push | `npx web-push generate-vapid-keys`. Without them in production, notifications are off. Locally they are generated in `.data/vapid.json`. |
| `VAPID_SUBJECT` | For push | `mailto:` contact for push services. |
| `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` | One scheduler | Exact-time reminders through Upstash QStash. |
| `CRON_SECRET` | One scheduler | Protects `/api/reminders/sweep` for an external cron. |
| `TASKLY_INTERNAL_SCHEDULER` | One scheduler | `1` on a long-running server to send reminders from the process itself. |
| `NEXT_PUBLIC_SW_DEV` | No | `1` to register the service worker during `npm run dev`, to test push locally. |

## 🩺 Troubleshooting

| You see | Cause |
|---|---|
| Build fails with `DATABASE_URL is missing` | No Postgres connected on Vercel. Add Neon (step 2). |
| "This page couldn't load", logs say `BETTER_AUTH_SECRET is missing` | Set the secret and redeploy. |
| Sign-in says something went wrong, logs say `RESEND_API_KEY is missing` | Set the Resend key and `EMAIL_FROM`, then redeploy. |
| Codes never arrive | `EMAIL_FROM` isn't on a domain verified in Resend; check the Resend dashboard. |
| No notifications on iPhone | Taskly must be installed on the home screen (iOS 16.4 or later), and notifications allowed in its onboarding. |
| Notifications arrive but late | No scheduler configured: add QStash, a cron or `TASKLY_INTERNAL_SCHEDULER=1`. |
| Claude can't connect | The address must be `https://your-domain/api/mcp`, and the instance must be reachable from the internet. |

Your users can export all their data or delete their account at any time in **Settings**. Back up the database with your provider's tools.
