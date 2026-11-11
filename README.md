# HomeCartel Email Automation

Self-hosted behavioral email marketing engine for [homecartel.net](https://homecartel.net). Ingests Shopify
webhooks and storefront browsing events, applies behavioral timing rules, and sends branded transactional/
marketing email through Resend — with no per-contact SaaS fees.

- **Runtime:** Node.js 22+ (uses built-in `node:sqlite` `DatabaseSync` — no native build step)
- **Framework:** Fastify 5 (ES modules)
- **Database:** SQLite file at `DB_PATH` (default `./data/homecartel.db`)
- **Email:** pluggable — `mock` (default, no network) or `resend`
- **Tests:** Vitest, fully offline (20 files / 68 tests)

## Quick start

```bash
npm install
cp .env.example .env          # then edit SHOPIFY_WEBHOOK_SECRET at minimum
npm start                     # http://localhost:3000
npm test                      # offline test suite
```

`src/server.js` auto-loads `.env` if the file exists, so no `dotenv` package is needed locally.

### Dashboard

The admin dashboard is served at any of `/`, `/ui`, `/admin`, `/dashboard`. It shows live shopper events
(SSE), staged jobs, per-flow toggles, and template previews.

> **Emails will not send on their own until you opt in.** Automatic dispatch is gated behind
> `ENABLE_AUTO_DISPATCH=true` (default is `false`). See [docs/OPERATIONS.md](docs/OPERATIONS.md).

## Configuration

All configuration is environment-driven; nothing is hardcoded. `src/config.js` is the single source of truth.

| Variable | Required | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `SHOPIFY_WEBHOOK_SECRET` | **yes** | — | HMAC key for webhook + unsubscribe token signing. Server throws if missing. |
| `PORT` | no | `3000` | HTTP listen port (binds `0.0.0.0`). |
| `SHOP_DOMAIN` | no | `homecartel.net` | Store domain, used in health output. |
| `DB_PATH` | no | `./data/homecartel.db` | SQLite file path. Use `:memory:` for ephemeral runs. |
| `APP_BASE_URL` | no | `http://localhost:$PORT` | Public base URL. Used to build unsubscribe links and image URLs. |
| `RAILWAY_PUBLIC_DOMAIN` | no | — | Fallback for `APP_BASE_URL` on Railway (`https://<domain>`). |
| `EMAIL_PROVIDER` | no | `mock` | `mock` or `resend`. |
| `RESEND_API_KEY` | if `resend` | — | Required when `EMAIL_PROVIDER=resend`, else the server throws. |
| `FROM_EMAIL` | no | `HomeCartel <support@homecartel.net>` | Sender identity. `resend.dev` senders are rewritten to this. |
| `ENABLE_AUTO_DISPATCH` | no | `false` | Master killswitch. Must be exactly `true` for the 60s scheduler loop to send. |

`SHOPIFY_WEBHOOK_SECRET` also accepts the dashboard-style space-separated aliases `SHOPIFY WEBHOOK SECRET`
and `SHOPIFY_SECRET`. Likewise `EMAIL PROVIDER`, `RESEND API KEY`, `FROM EMAIL`.

## How it works

```
Shopify webhooks ──┐
                   ├──> HMAC verify ──> flow enabled? ──> scheduled_jobs (SQLite)
Storefront events ─┘                                          │
                                                              ▼
                                   60s scheduler (if ENABLE_AUTO_DISPATCH=true)
                                                              │
                          unsubscribe? disposable? flow off? 48h cap? ──> skip/cancel
                                                              ▼
                                                   render template ──> Resend
```

Every pending job is re-checked at send time — customer opt-out, disposable/bot email, per-flow toggle, and
the 48-hour frequency cap can each cancel or skip a job that was queued hours earlier.

## The five flows

| # | Flow key | Auto trigger | Default delay |
| :-- | :--- | :--- | :--- |
| 1 | `welcome` | `customers/create` webhook | 3-part drip: immediate, +48h, +120h |
| 2 | `abandoned_cart` | `checkouts/*` or `carts/*` webhook | 2 h |
| 3 | `browse_abandonment` | **none yet** — manual/simulate only | 3 h |
| 4 | `winback` | **none yet** — manual/simulate only | 1440 h (60 days) |
| 5 | `post_purchase` | `fulfillments/create` webhook | 120 h (5 days) |

All flows ship **disabled** (`is_enabled = 0`) until toggled on in the dashboard.

> **Known gap:** flows 3 and 4 have templates, toggles, scheduler support and UI labels, but no production
> code path enqueues them — `browse_abandonment` and `winback` are only reachable through
> `POST /api/admin/simulate`. Stickiness for browse abandonment needs a "viewed N times, no cart" rule that
> is not implemented. Full detail in [docs/FLOWS.md](docs/FLOWS.md).

## Project layout

```
src/
  server.js            # Fastify bootstrap, static assets, scheduler loop
  config.js            # env -> config object (all defaults + validation)
  db/
    schema.sql         # tables + indexes (idempotent CREATE IF NOT EXISTS)
    database.js        # query wrapper / repository (node:sqlite)
  routes/
    webhooks.js        # Shopify HMAC-verified ingestion
    tracking.js        # storefront event ingestion + identify + counter
    unsubscribe.js     # signed one-click unsubscribe
    admin.js           # dashboard APIs (overview, jobs, flows, previews)
  scheduler/worker.js  # dispatch cycle: gating, frequency cap, render, send
  templates/           # renderer.js dispatcher + canva*.js / postPurchase.js
  email/sender.js      # mock | resend adapters
  shopify/             # hmac.js, catalog.js
  utils/emailValidator.js
public/                # dashboard UI + storefront tracker snippet
tests/                 # Vitest, offline
docs/                  # see index below
```

## Documentation

| Doc | Contents |
| :--- | :--- |
| [docs/FLOWS.md](docs/FLOWS.md) | The five flows, exact timings, toggle semantics, frequency cap |
| [docs/API.md](docs/API.md) | Every HTTP route with request/response shapes |
| [docs/OPERATIONS.md](docs/OPERATIONS.md) | Deploy, Shopify webhook setup, Resend setup, troubleshooting |
| [docs/archive/](docs/archive/) | Historical spec + implementation plans (superseded, kept for design history) |

## Storefront tracking

Include the tracker on the storefront to capture browsing behavior:

```html
<script src="https://<your-app-domain>/homecartel-tracker.js"></script>
```

Events post to `/api/track/event`; identity stitching happens via `/api/track/identify`, which back-fills
anonymous history onto the customer record.
