# Operations Guide

Running, deploying and debugging the engine. For what the flows do, see [FLOWS.md](FLOWS.md); for route
shapes see [API.md](API.md).

---

## Local development

```bash
npm install
cp .env.example .env
npm start        # node src/server.js
npm test         # vitest, offline, no network
```

Requirements:

- **Node.js 22.5+** — the app imports `DatabaseSync` from the built-in `node:sqlite` module. There is no
  `better-sqlite3` native build step.
- No `dotenv` dependency. `src/server.js` calls `process.loadEnvFile('.env')` when the file exists.

The server binds `0.0.0.0:PORT` (default `3000`) and creates the SQLite file at `DB_PATH`, applying
`src/db/schema.sql` with `CREATE TABLE IF NOT EXISTS` on every boot — migration is idempotent and safe to
re-run.

For throwaway runs use `DB_PATH=:memory:`.

### First-run checklist

1. Set `SHOPIFY_WEBHOOK_SECRET` — the server throws at boot without it.
   Note: `buildServer()` falls back to the literal `'homecartel_secret_key'` when started via
   `src/server.js`, but `loadConfig()` itself throws. Always set the real secret.
2. Leave `EMAIL_PROVIDER=mock` until you have a verified Resend domain. Mock records messages in memory and
   never touches the network.
3. Leave `ENABLE_AUTO_DISPATCH` unset. Nothing sends automatically until you opt in.

---

## The master killswitch — `ENABLE_AUTO_DISPATCH`

This is the single most common source of "why isn't it sending".

`src/server.js` starts a `setInterval(..., 60000)` loop that calls `runSchedulerCycle()` **only when**
`app.config.autoDispatch === true`. `autoDispatch` comes from `env.ENABLE_AUTO_DISPATCH === 'true'` — the
string must be exactly `true`, lowercase. `1`, `TRUE`, `yes` and `True` all evaluate to `false`.

When it is off:

- Webhooks still ingest, customers/carts/events are still recorded, and jobs are still scheduled as
  `pending`.
- No email is ever dispatched by the scheduler.

### The two ways to send with autosend off

1. **Manual, per job** — `POST /api/admin/jobs/:id/send` sends one staged job immediately.
2. **Flush everything due** — `POST /api/admin/simulate` with `{ "scenario": "run_scheduler" }` runs one
   cycle with `now` set 30 days ahead, making every staged job due.

The dashboard exposes both.

### Runtime override

`POST /api/admin/autosend/toggle` flips `app.config.autoDispatch` in memory and, when turning **off**,
cancels all pending jobs. This override is **not persisted** — a restart reverts to the env value.

---

## Deploying to Railway

The production instance currently runs at `https://emailautomation-production-d651.up.railway.app`
(hardcoded as the tracker's fallback backend and as the renderer's default `baseUrl`).

Set these in the Railway service:

| Variable | Value |
| :--- | :--- |
| `SHOPIFY_WEBHOOK_SECRET` | the Shopify webhook signing secret |
| `EMAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | `re_...` |
| `FROM_EMAIL` | `HomeCartel <support@homecartel.net>` |
| `ENABLE_AUTO_DISPATCH` | leave unset until you intend to send |
| `DB_PATH` | path on a mounted volume (see warning) |

`PORT` is injected by Railway. `RAILWAY_PUBLIC_DOMAIN` is read automatically and used to derive
`APP_BASE_URL` when you have not set it explicitly — keep that fallback working, because unsubscribe links
and header image URLs are built from it.

> **⚠️ Persistence warning.** Railway's container filesystem is ephemeral unless a volume is mounted. The
> SQLite database (`DB_PATH`, default `./data/homecartel.db`) holds all customers, events, scheduled jobs and
> send history. If the file lives on the container disk, a redeploy can wipe it. Mount a persistent volume and
> point `DB_PATH` at it before relying on this for real sends. Verify this on the live service rather than
> assuming it is configured.
>
> `data/` and `*.db*` are gitignored, so the database is never committed.

`RAILWAY_GIT_COMMIT_SHA` is surfaced by `GET /api/admin/diagnostics` as the version — useful for confirming
which commit is actually live.

---

## Shopify webhook setup

Create five webhooks in Shopify (Settings → Notifications, or via the Admin API), all pointing at the same
host:

| Topic | URL |
| :--- | :--- |
| `checkouts/create`, `checkouts/update` | `https://<host>/api/webhooks/shopify/checkouts` |
| `carts/update` | `https://<host>/api/webhooks/shopify/carts` |
| `orders/create` | `https://<host>/api/webhooks/shopify/orders` |
| `fulfillments/create` | `https://<host>/api/webhooks/shopify/fulfillments` |
| `customers/create` | `https://<host>/api/webhooks/shopify/customers` |

All five must use the **same signing secret** as `SHOPIFY_WEBHOOK_SECRET`.

### Verifying delivery

Every webhook attempt is appended to `recentWebhookLogs` (last 50) with `hmacHeaderPresent`, `hmacValid`,
`email`, `checkoutId` and a `status` of `accepted` / `skipped_no_email` / `rejected_401`. Read them from:

```bash
curl -s https://<host>/api/admin/overview | jq .recentWebhookLogs
```

If you see `rejected_401`, the secret does not match — check for a trailing newline or whitespace when
pasting the secret into Railway.

### Why a webhook was accepted but nothing was scheduled

- Payload had no email ⇒ `skipped_no_email`. Events are still recorded.
- The target flow is toggled off ⇒ `skipped_flow_disabled`. This is the expected default.

---

## Resend setup

1. Add and verify `homecartel.net` in Resend (SPF, DKIM, DMARC).
2. Put the API key in `RESEND_API_KEY` and set `EMAIL_PROVIDER=resend`.
3. Check verification state: `GET /api/admin/resend/status`.
4. Force a re-check after DNS changes: `POST /api/admin/resend/verify`.

`FROM_EMAIL` must use the verified domain. Any address containing `resend.dev` is silently rewritten to
`HomeCartel <support@homecartel.net>`, because Resend's sandbox sender cannot deliver to arbitrary
recipients.

Delivery status for a specific message: `GET /api/admin/resend/email/:id` using the `messageId` returned when
the email was sent (also stored in `email_logs.message_id`).

---

## Storefront tracker

Add to the Shopify theme, before `</head>` in `theme.liquid`:

```html
<script src="https://<host>/homecartel-tracker.js"></script>
```

The tracker picks its API origin from the script tag's own `src`, falling back to the production Railway host.
To point it elsewhere without editing the file, set `window.HOMECARTEL_API_URL` **before** the script tag:

```html
<script>window.HOMECARTEL_API_URL = 'https://staging.example.com';</script>
```

It maintains a persistent visitor id (`hc_vid` cookie + `homecartel_vid` localStorage) and captures page
views, item/collection clicks, page leaves with duration and scroll depth, and cart-token sync. Identity
stitching fires when the shopper enters an email at checkout or signup, via `/api/track/identify`.

---

## Troubleshooting

### Nothing sends

Check in this order — each is an independent gate:

1. `ENABLE_AUTO_DISPATCH` is not the string `true` (see above).
2. The specific flow is disabled. `GET /api/admin/flows` — look at `is_enabled`. All five ship `false`.
3. The recipient already received a marketing email in the last 48 h — job moves to `skipped`. This is the
   frequency cap in `runSchedulerCycle`.
4. The job is not yet due. `GET /api/admin/staged-jobs` shows `execute_at`; delays are up to 60 days for
   winback.
5. The recipient unsubscribed or the address is disposable/bot — job is `cancelled`.

`GET /api/admin/diagnostics` gives you the version, provider, masked secret, and `autoDispatchEnabled` in one
call.

### A job vanished

Toggling a flow off, `POST /api/admin/cancel-all-pending`, `POST /api/admin/autosend/toggle` with
`enabled: false`, or an `orders/create` webhook all cancel `pending` jobs outright. Cancellation is
permanent — the event must be re-triggered. Check `scheduled_jobs.status` for `cancelled`.

### Emails go out with broken images or unsubscribe links

`APP_BASE_URL` is wrong. Header images and unsubscribe links are absolute URLs built from it (or from
`RAILWAY_PUBLIC_DOMAIN`). It must be the public HTTPS origin, reachable from the recipient's inbox.

### Drip emails arrive 2 days apart but you expected the dashboard's delay setting

The welcome step offsets are hardcoded (`+0`, `+48 h`, `+120 h`). The dashboard delay for `welcome` does not
respace the drip. See [FLOWS.md](FLOWS.md#flow-1--welcome-series-3-part-drip).

### `Missing required environment variable: SHOPIFY_WEBHOOK_SECRET`

`loadConfig()` throws when no secret is present. Also confirm you did not paste a secret with a trailing
newline — HMAC verification will fail even though boot succeeds.

### Bots signing up

`POST /api/admin/clean-bots` deletes customers whose email or name matches the disposable/bot rules, along
with their logs, jobs and events. Returns the removed list with a reason per entry. This is destructive and
irreversible — the same filter normally prevents these rows from being created in the first place.

---

## Security posture

Be deliberate here; the defaults favour convenience over safety.

- **No authentication on any route.** Every `/api/admin/*` endpoint — including `send-test`,
  `cancel-all-pending`, `clean-bots` and the SSE feed — is open to anyone who can reach the host. There is
  no session, token or IP allowlist in the codebase. Do not expose the service on a public URL without an
  upstream proxy, auth layer, or network restriction.
- **CORS is `*`** on all responses, with `GET, POST, OPTIONS` allowed. Required for the storefront tracker;
  it also means any origin can call the admin endpoints from a browser.
- **What *is* protected.** Shopify webhooks are HMAC-verified against the raw body with a timing-safe
  comparison (invalid ⇒ `401`, no writes). Unsubscribe tokens are HMAC-signed and verified in constant time
  (invalid ⇒ `403`).
- **Secrets are never logged in full.** `GET /api/admin/diagnostics` returns only the first 6 characters plus
  the length.
- **Image serving is path-traversal safe** — `/images/:file` runs `path.basename` before resolving.

If this service is ever exposed beyond a trusted network, put authentication in front of `/api/admin/*`
first. The storefront tracking and unsubscribe routes must stay reachable by browsers and by email clients
respectively.
