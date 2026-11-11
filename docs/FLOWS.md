# Behavioral Flows

The engine ships five flows. All of them are **disabled by default** (`flow_settings.is_enabled = 0`) and
must be switched on individually from the dashboard or via the API.

Source of truth for the numbers below: the `INSERT OR IGNORE` seed block in
[`src/db/database.js`](../src/db/database.js) and the scheduling calls in
[`src/routes/webhooks.js`](../src/routes/webhooks.js).

## Summary

| # | Flow key | Name | Auto trigger | Default `delay_hours` | Template |
| :-- | :--- | :--- | :--- | :--- | :--- |
| 1 | `welcome` | Welcome Series (3-Part Drip) | `POST /api/webhooks/shopify/customers` | `0` | `canvaWelcome.js` |
| 2 | `abandoned_cart` | Cart Abandonment | `POST /api/webhooks/shopify/checkouts` or `/carts` | `2` | `canvaCart.js` |
| 3 | `browse_abandonment` | Browse Abandonment | **none — manual only** | `3` | `canvaBrowse.js` |
| 4 | `winback` | Customer Winback | **none — manual only** | `1440` | `canvaWinback.js` |
| 5 | `post_purchase` | Post-Purchase Review | `POST /api/webhooks/shopify/fulfillments` | `120` | `postPurchase.js` |

## Flow 1 — Welcome Series (3-part drip)

Triggered by a `customers/create` webhook. When the flow is enabled, **three** separate jobs are enqueued
in one request, which is why the welcome flow has child keys:

| Job key | Offset from signup | Template function | Content |
| :--- | :--- | :--- | :--- |
| `welcome_1` | immediate (`+0`) | `renderCanvaWelcomeTemplate` | Brand intro, 10% welcome discount, category links |
| `welcome_2` | `+48 h` | `renderWelcomeSocialProofTemplate` | Influencer living-space photos + customer reviews |
| `welcome_3` | `+120 h` (5 days) | `renderWelcomeBestSellersTemplate` | Best sellers / lighting selection guide |

The delays are **hardcoded offsets**, not derived from `flow_settings.delay_hours`. Changing the welcome
delay in the dashboard affects the gate, not the drip spacing.

If the welcome flow is disabled at signup time, no jobs are created — but the customer and the
`customer_created` event are still recorded.

Disposable and bot addresses are rejected before any job is written (`validateCustomerEmail`).

## Flow 2 — Cart / Checkout Abandonment

Triggered by `checkouts/*` or `carts/*`. Behaviour:

1. Customer is upserted, cart row stored with `status = 'abandoned'`.
2. If the flow is enabled, one job is scheduled at `now + delay_hours` (default **2 h**).
3. If the flow is disabled, the cart is still recorded and the response is
   `{ "success": true, "scheduled": "skipped_flow_disabled" }`.

The email carries the line items (enriched with live Shopify images at send time) and the recovery URL.

**Cancellation:** an `orders/create` webhook with a matching `checkout_id` marks the cart `recovered` and
cancels pending `abandoned_cart` jobs for that email. There is no 24-hour second reminder — the old spec
mentioned one, it was never built.

## Flow 3 — Browse Abandonment

**Not wired to production triggers.** The template, toggle, delay and scheduler support all exist, and the
worker will fall back to `db.getCustomerBrowsingHistory()` if the job context has no `viewedItems`. But no
code path in `tracking.js` or `webhooks.js` enqueues a `browse_abandonment` job.

To exercise it today, use `POST /api/admin/simulate` with `{ "scenario": "flow_3" }`.

Adding a real trigger requires a stickiness rule that does not exist yet, e.g. "customer viewed a product
≥ 2 times in 48 h without adding to cart". That rule would live in `src/routes/tracking.js`.

## Flow 4 — Customer Winback

Same situation as flow 3: template + toggle + delay (`1440` h = 60 days) exist, but nothing enqueues it
automatically. There is no daily cron scanning for lapsed customers.

Use `POST /api/admin/simulate` with `{ "scenario": "flow_4" }` to stage one.

## Flow 5 — Post-Purchase Review

Triggered by `fulfillments/create`. When enabled, a job is queued at `now + delay_hours` (default **120 h**
≈ 5 days). The context carries `orderNumber`, `customerName` and `line_items`; the template renders lighting
care tips plus a review/UGC ask.

If the flow is disabled the fulfillment event is still recorded and the response reports
`post-purchase flow disabled`.

## Toggle semantics

Toggle state lives in the `flow_settings` table and is manipulated through
`POST /api/admin/flows/:flowKey/toggle`.

**Parent/child key mapping.** The welcome drip writes jobs with keys `welcome_1`, `welcome_2`, `welcome_3`.
`db.isFlowEnabled()` maps any key starting with `welcome` back to the parent `welcome` row, so you never
toggle the drip parts individually — one switch controls all three.

**Toggling off is destructive to pending work.** `POST /api/admin/flows/:flowKey/toggle` with
`{"enabled": false}` immediately cancels every `pending` job for that flow:

- `welcome` cancels `welcome`, `welcome_1`, `welcome_2`, `welcome_3`
- any other key cancels only itself

Re-enabling does **not** resurrect cancelled jobs. The customer must re-trigger the event.

**Per-flow delay.** `POST /api/admin/flows/:flowKey/delay` with `{"delayHours": <number>}` updates
`delay_hours`. Applies to flows 2–5 from the next scheduled job onward. Flows already in `scheduled_jobs`
keep their original `execute_at`. It does not affect the welcome drip offsets.

## Send-time gates

Every pending job is re-evaluated in `runSchedulerCycle` ([`src/scheduler/worker.js`](../src/scheduler/worker.js))
in this order. Any failure cancels or skips the job without sending:

| # | Gate | Outcome |
| :-- | :--- | :--- |
| 1 | Master switch `ENABLE_AUTO_DISPATCH` | Loop does not run at all unless exactly `true` |
| 2 | Customer `status = 'unsubscribed'` | `cancelled` |
| 3 | Disposable / bot / invalid email | `cancelled` |
| 4 | Flow toggle `is_enabled = 0` | `cancelled` |
| 5 | Sent another marketing email in last 48 h | `skipped` |
| 6 | Atomic job claim (concurrency guard) | skipped silently if already claimed |
| 7 | Render + send | `sent`, or `failed` on error |

Gate 5 is the **48-hour frequency cap** — one marketing email per recipient per 48 h, measured from
`email_logs.sent_at`. It is the reason a queued drip email can be skipped even when its flow is on.

## State machine (`scheduled_jobs.status`)

```
pending ──> sent          (gate 7 success)
        ├─> skipped       (48 h frequency cap)
        ├─> cancelled     (unsubscribe, disposable, flow off, toggle-off, order placed)
        └─> failed        (render/send error)
```

Only `pending` rows are considered by the scheduler; terminal states are never retried.
