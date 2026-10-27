# HomeCartel Behavioral Email Marketing Automation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-hosted, subscription-free behavioral email marketing automation engine for HomeCartel (`homecartel.net`) that ingests Shopify webhooks and storefront browsing events, manages behavioral states and delayed triggers, and renders responsive HTML email campaigns.

**Architecture:** A lightweight Node.js (v24) service running Fastify with a local embedded SQLite database (`better-sqlite3` / `node:sqlite`). It provides HMAC-authenticated webhook ingestion for Shopify checkout/order/customer events, an on-site tracking endpoint for browsing behavior, an idempotent delay scheduler worker with 48-hour frequency capping, responsive HTML template renderers, and an abstract email delivery adapter (mock for tests, Resend/SES for production). All configuration is driven by environment variables with zero hardcoded credentials.

**Tech Stack:** Node.js 24, Fastify, SQLite (`better-sqlite3`), Vitest (for test suite), HTML/CSS responsive email templates.

**Spec:** [`docs/superpowers/specs/2026-10-27-behavioral-email-automation-design.md`](file:///c:/Users/Administrator/Documents/Email%20Marketing/docs/superpowers/specs/2026-10-27-behavioral-email-automation-design.md)

---

## Global Constraints

- **No hardcoded secrets or tokens:** All credentials must be loaded exclusively via environment variables (`.env`).
- **Offline testability:** All unit, integration, and end-to-end tests must run completely offline without calling external Shopify or email APIs.
- **Node.js 24 ES Modules:** Use standard ES module syntax (`import`/`export`) across all source and test files.
- **Physical address & compliance:** Every rendered email template must contain HomeCartel's physical store address (`673 Banawe Street, Santa Mesa Heights, Quezon City, Metro Manila, Philippines`) and a functional one-click unsubscribe link.
- **Frequency Capping:** Never send more than 1 automated marketing email to the same recipient in any 48-hour window (excluding immediate transactional confirmation).

---

## Review Focus

1. **Webhook Payload Tampering / Unsigned Requests:** Incoming Shopify webhooks with missing or invalid `X-Shopify-Hmac-Sha256` headers must be rejected with HTTP 401 and never execute database changes or schedule emails.
2. **Post-Purchase Cart Cancellation Race Condition:** If an `orders/create` webhook arrives while an abandoned cart reminder is pending, the scheduled cart job must be immediately marked `cancelled` so customers who bought are never nudged to buy again.
3. **Unsubscribe Opt-Out Enforcement:** If a customer unsubscribes, all pending scheduled jobs for their email must be cancelled immediately, and any future trigger for that email must be silently suppressed.
4. **Frequency Cap Boundary:** If an event triggers a valid flow but the recipient received another marketing email within the last 48 hours, the job must be skipped or deferred, not spammed.
5. **Session Identity Stitching:** When an anonymous visitor identified only by session cookie `hc_vid` later submits their email in a form or starts checkout, past browsing events must be stitched to their customer record.

---

### Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `package.json`
- Create: `.env.example`
- Create: `src/config.js`
- Test: `tests/config.test.js`

**Interfaces:**
- Produces: `loadConfig(envOverrides?: object) -> AppConfig` containing `{ port, shopDomain, shopifyWebhookSecret, emailProvider, resendApiKey, dbPath }`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/config.test.js
import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  it('loads valid configuration from environment variables', () => {
    const config = loadConfig({
      PORT: '3000',
      SHOP_DOMAIN: 'homecartel.net',
      SHOPIFY_WEBHOOK_SECRET: 'test_secret_123',
      EMAIL_PROVIDER: 'mock',
      DB_PATH: ':memory:'
    });
    expect(config.port).toBe(3000);
    expect(config.shopDomain).toBe('homecartel.net');
    expect(config.shopifyWebhookSecret).toBe('test_secret_123');
    expect(config.emailProvider).toBe('mock');
  });

  it('throws an error when mandatory variables are missing', () => {
    expect(() => loadConfig({})).toThrow(/Missing required environment variable/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/config.test.js`  
Expected: FAIL with module not found or missing `loadConfig`

- [ ] **Step 3: Implement `src/config.js`, `package.json`, and `.env.example`**

Setup `package.json` with `"type": "module"`, install Fastify, Vitest, and Better-SQLite3. Implement `loadConfig` validating presence of `SHOP_DOMAIN` and `SHOPIFY_WEBHOOK_SECRET` with sensible defaults for `PORT` (3000) and `DB_PATH` (`./data/homecartel.db`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/config.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json .env.example src/config.js tests/config.test.js
git commit -m "feat: scaffold project and config loader"
```

---

### Task 2: Shopify HMAC Webhook Verification

**Files:**
- Create: `src/shopify/hmac.js`
- Test: `tests/shopify/hmac.test.js`

**Interfaces:**
- Consumes: `rawBody: Buffer | string`, `signature: string`, `secret: string`
- Produces: `verifyShopifyHmac(rawBody, signature, secret) -> boolean`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/shopify/hmac.test.js
import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { verifyShopifyHmac } from '../../src/shopify/hmac.js';

describe('verifyShopifyHmac', () => {
  const secret = 'h_secret_key_xyz';
  const body = JSON.stringify({ id: 12345, note: 'cart test' });

  it('returns true for a valid Shopify HMAC signature', () => {
    const validHmac = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
    expect(verifyShopifyHmac(body, validHmac, secret)).toBe(true);
  });

  it('returns false for an invalid signature', () => {
    expect(verifyShopifyHmac(body, 'invalid_hmac_base64', secret)).toBe(false);
  });

  it('returns false when signature or secret is empty', () => {
    expect(verifyShopifyHmac(body, '', secret)).toBe(false);
    expect(verifyShopifyHmac(body, 'abc', '')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/shopify/hmac.test.js`  
Expected: FAIL with `verifyShopifyHmac is not defined`

- [ ] **Step 3: Implement `verifyShopifyHmac` in `src/shopify/hmac.js`**

Compute `crypto.createHmac('sha256', secret).update(rawBody).digest('base64')` and compare using `crypto.timingSafeEqual` to guard against timing attacks.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/shopify/hmac.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shopify/hmac.js tests/shopify/hmac.test.js
git commit -m "feat: implement shopify hmac webhook verification"
```

---

### Task 3: SQLite Database & State Management

**Files:**
- Create: `src/db/schema.sql`
- Create: `src/db/database.js`
- Test: `tests/db/database.test.js`

**Interfaces:**
- Consumes: `dbPath: string`
- Produces: `initDatabase(dbPath) -> DB` methods:
  - `upsertCustomer(customer: { email, name, status }) -> customerId`
  - `getCustomerByEmail(email: string) -> Customer | null`
  - `recordEvent(event: { customerId?, visitorId, eventType, propertiesJson })`
  - `upsertCart(cart: { checkoutId, email, cartToken, itemsJson, subtotal, recoveryUrl, status })`
  - `scheduleJob(job: { flowType, recipientEmail, contextJson, executeAt })`
  - `cancelPendingJobsByEmail(email: string, flowType?: string)`
  - `setCustomerUnsubscribed(email: string)`
  - `getPendingDueJobs(now: string)`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/db/database.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { initDatabase } from '../../src/db/database.js';

describe('Database State Store', () => {
  let db;
  beforeEach(() => {
    db = initDatabase(':memory:');
  });

  it('upserts customers and manages subscription status', () => {
    const id = db.upsertCustomer({ email: 'shopper@test.com', name: 'Maria Santos', status: 'subscribed' });
    expect(id).toBeDefined();

    const customer = db.getCustomerByEmail('shopper@test.com');
    expect(customer.name).toBe('Maria Santos');
    expect(customer.status).toBe('subscribed');

    db.setCustomerUnsubscribed('shopper@test.com');
    expect(db.getCustomerByEmail('shopper@test.com').status).toBe('unsubscribed');
  });

  it('cancels pending jobs when requested', () => {
    db.scheduleJob({
      flowType: 'abandoned_cart',
      recipientEmail: 'shopper@test.com',
      contextJson: JSON.stringify({ checkoutId: 'chk_101' }),
      executeAt: new Date(Date.now() + 7200000).toISOString()
    });

    db.cancelPendingJobsByEmail('shopper@test.com', 'abandoned_cart');
    const due = db.getPendingDueJobs(new Date(Date.now() + 10000000).toISOString());
    expect(due.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/db/database.test.js`  
Expected: FAIL with module not found

- [ ] **Step 3: Implement `schema.sql` and `src/db/database.js`**

Implement schema migrations and query wrappers using `better-sqlite3` with foreign keys enabled, WAL journal mode, and prepared statements.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/db/database.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/db/ tests/db/database.test.js
git commit -m "feat: implement sqlite behavioral state database"
```

---

### Task 4: Storefront Behavioral Event Tracking API

**Files:**
- Create: `public/homecartel-tracker.js`
- Create: `src/routes/tracking.js`
- Test: `tests/routes/tracking.test.js`

**Interfaces:**
- Consumes: `initDatabase` instance, Fastify server
- Produces:
  - `POST /api/track/event`: Ingests `{ visitorId, eventType, properties }`
  - `POST /api/track/identify`: Ingests `{ visitorId, email, name }` and links existing visitor events to the customer.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/routes/tracking.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { initDatabase } from '../../src/db/database.js';
import { registerTrackingRoutes } from '../../src/routes/tracking.js';

describe('Tracking API Routes', () => {
  let app, db;
  beforeEach(async () => {
    db = initDatabase(':memory:');
    app = Fastify();
    await registerTrackingRoutes(app, { db });
  });

  it('ingests product view events', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/track/event',
      payload: {
        visitorId: 'vid_abc123',
        eventType: 'product_view',
        properties: { productId: 'prod_99', title: 'Aura Chandelier' }
      }
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ success: true });
  });

  it('links visitor session to email upon identify', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/track/identify',
      payload: { visitorId: 'vid_abc123', email: 'guest@homecartel.ph', name: 'Guest User' }
    });
    const customer = db.getCustomerByEmail('guest@homecartel.ph');
    expect(customer).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/routes/tracking.test.js`  
Expected: FAIL

- [ ] **Step 3: Implement `src/routes/tracking.js` and `public/homecartel-tracker.js`**

Implement route handlers that validate payload JSON and record events. Create client-side tracker setting `hc_vid` cookie and attaching to `DOMContentLoaded` to send pageview and viewed fixture data.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/routes/tracking.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add public/ src/routes/tracking.js tests/routes/tracking.test.js
git commit -m "feat: implement storefront behavioral tracking endpoint"
```

---

### Task 5: Shopify Webhook Ingestion Routes & Event Mapping

**Files:**
- Create: `src/routes/webhooks.js`
- Test: `tests/routes/webhooks.test.js`

**Interfaces:**
- Consumes: Fastify raw body plugin, `verifyShopifyHmac`, `DB`
- Produces:
  - `POST /api/webhooks/shopify/checkouts`: Schedules abandoned cart job (+2 hours).
  - `POST /api/webhooks/shopify/orders`: Cancels abandoned cart job, records completed order.
  - `POST /api/webhooks/shopify/fulfillments`: Schedules post-purchase review job (+7 days).
  - `POST /api/webhooks/shopify/customers`: Schedules welcome onboarding job (+0 mins).

- [ ] **Step 1: Write the failing test**

```javascript
// tests/routes/webhooks.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import Fastify from 'fastify';
import crypto from 'node:crypto';
import { initDatabase } from '../../src/db/database.js';
import { registerWebhookRoutes } from '../../src/routes/webhooks.js';

describe('Shopify Webhook Routes', () => {
  let app, db;
  const secret = 'webhook_secret_test';

  function sign(payload) {
    return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');
  }

  beforeEach(async () => {
    db = initDatabase(':memory:');
    app = Fastify();
    await registerWebhookRoutes(app, { db, secret });
  });

  it('rejects unsigned webhook requests with 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/webhooks/shopify/checkouts',
      payload: { id: 101 }
    });
    expect(res.statusCode).toBe(401);
  });

  it('schedules an abandoned cart email on valid checkout webhook', async () => {
    const payload = JSON.stringify({
      id: 202,
      email: 'cart_abandoner@homecartel.ph',
      abandoned_checkout_url: 'https://homecartel.net/checkout/202',
      line_items: [{ title: 'Solomon Pendant Light', price: '4500.00', quantity: 1 }]
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/webhooks/shopify/checkouts',
      headers: {
        'x-shopify-hmac-sha256': sign(payload),
        'content-type': 'application/json'
      },
      payload
    });
    expect(res.statusCode).toBe(200);

    const jobs = db.getPendingDueJobs(new Date(Date.now() + 8000000).toISOString());
    expect(jobs.some(j => j.flow_type === 'abandoned_cart')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/routes/webhooks.test.js`  
Expected: FAIL

- [ ] **Step 3: Implement `src/routes/webhooks.js`**

Parse raw payloads, verify HMAC, upsert customer and cart records, and schedule/cancel jobs according to webhook event types.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/routes/webhooks.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/routes/webhooks.js tests/routes/webhooks.test.js
git commit -m "feat: implement shopify webhook routes and event mapping"
```

---

### Task 6: Delay Scheduler & Frequency Cap Worker

**Files:**
- Create: `src/scheduler/worker.js`
- Test: `tests/scheduler/worker.test.js`

**Interfaces:**
- Consumes: `DB`, `EmailSender`, `TemplateRenderer`
- Produces: `runSchedulerCycle({ db, sender, renderer, now }) -> { sent: number, skipped: number, cancelled: number }`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/scheduler/worker.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { initDatabase } from '../../src/db/database.js';
import { runSchedulerCycle } from '../../src/scheduler/worker.js';

describe('Scheduler Worker', () => {
  let db, mockSender, mockRenderer;
  beforeEach(() => {
    db = initDatabase(':memory:');
    mockSender = { send: vitest.fn().mockResolvedValue({ messageId: 'msg_1' }) };
    mockRenderer = { render: vitest.fn().mockReturnValue('<html>Email Body</html>') };
  });

  it('dispatches due jobs and enforces 48-hour frequency cap on marketing emails', async () => {
    db.upsertCustomer({ email: 'buyer@test.com', name: 'Buyer', status: 'subscribed' });
    
    // Schedule two jobs due now
    db.scheduleJob({ flowType: 'welcome', recipientEmail: 'buyer@test.com', contextJson: '{}', executeAt: new Date().toISOString() });
    db.scheduleJob({ flowType: 'browse_abandonment', recipientEmail: 'buyer@test.com', contextJson: '{}', executeAt: new Date().toISOString() });

    const result = await runSchedulerCycle({ db, sender: mockSender, renderer: mockRenderer, now: new Date().toISOString() });
    
    expect(result.sent).toBe(1);
    expect(result.skipped).toBe(1); // Second email skipped due to 48h frequency cap
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/scheduler/worker.test.js`  
Expected: FAIL

- [ ] **Step 3: Implement `src/scheduler/worker.js`**

Fetch due jobs, verify customer is `subscribed`, check `email_logs` for any marketing email within 48 hours. If allowed, render template, invoke sender, and record in `email_logs`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/scheduler/worker.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/scheduler/worker.js tests/scheduler/worker.test.js
git commit -m "feat: implement delay scheduler and frequency capping worker"
```

---

### Task 7: Responsive HTML Email Templates & Rendering

**Files:**
- Create: `src/templates/base.html`
- Create: `src/templates/abandoned_cart.html`
- Create: `src/templates/welcome.html`
- Create: `src/templates/browse_abandonment.html`
- Create: `src/templates/post_purchase.html`
- Create: `src/templates/winback.html`
- Create: `src/templates/renderer.js`
- Test: `tests/templates/renderer.test.js`

**Interfaces:**
- Consumes: `templateName: string`, `context: object`
- Produces: `renderTemplate(templateName, context) -> { subject: string, html: string }`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/templates/renderer.test.js
import { describe, it, expect } from 'vitest';
import { renderTemplate } from '../../src/templates/renderer.js';

describe('Email Template Renderer', () => {
  it('renders abandoned cart email with product items, restore button, and mandatory footer', () => {
    const { subject, html } = renderTemplate('abandoned_cart', {
      customerName: 'Claire',
      storeName: 'HomeCartel',
      items: [{ title: 'Nordic Glass Chandelier', price: '₱12,500' }],
      recoveryUrl: 'https://homecartel.net/cart/restore/123',
      unsubscribeUrl: 'https://api.homecartel.net/unsubscribe?t=tok'
    });

    expect(subject).toMatch(/leave something behind/i);
    expect(html).toContain('Nordic Glass Chandelier');
    expect(html).toContain('₱12,500');
    expect(html).toContain('673 Banawe Street');
    expect(html).toContain('https://api.homecartel.net/unsubscribe?t=tok');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/templates/renderer.test.js`  
Expected: FAIL

- [ ] **Step 3: Implement templates and `src/templates/renderer.js`**

Build clean, responsive table-based HTML email templates with inline CSS styling compatible across Outlook, Gmail, and Apple Mail. Enforce physical address and unsubscribe token variable interpolation in `base.html`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/templates/renderer.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/templates/ tests/templates/renderer.test.js
git commit -m "feat: implement responsive email templates with compliance footer"
```

---

### Task 8: Abstract Email Delivery Adapter & One-Click Unsubscribe

**Files:**
- Create: `src/email/sender.js`
- Create: `src/routes/unsubscribe.js`
- Test: `tests/email/sender.test.js`
- Test: `tests/routes/unsubscribe.test.js`

**Interfaces:**
- Consumes: Config, Fastify, DB
- Produces:
  - `createEmailSender(config) -> { send({ to, subject, html, text }) -> Promise<{ messageId }> }`
  - `GET /api/unsubscribe`: marks email as `unsubscribed` and renders a clean confirmation page.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/routes/unsubscribe.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { initDatabase } from '../../src/db/database.js';
import { registerUnsubscribeRoutes } from '../../src/routes/unsubscribe.js';

describe('Unsubscribe Handler', () => {
  let app, db;
  beforeEach(async () => {
    db = initDatabase(':memory:');
    db.upsertCustomer({ email: 'optout@test.com', name: 'Opt Out', status: 'subscribed' });
    app = Fastify();
    await registerUnsubscribeRoutes(app, { db });
  });

  it('marks customer as unsubscribed and returns confirmation', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/unsubscribe?email=optout@test.com'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('successfully unsubscribed');
    expect(db.getCustomerByEmail('optout@test.com').status).toBe('unsubscribed');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/routes/unsubscribe.test.js`  
Expected: FAIL

- [ ] **Step 3: Implement `src/email/sender.js` and `src/routes/unsubscribe.js`**

Implement `createEmailSender` supporting `provider: 'mock'` (logs to array for testing) and `provider: 'resend'` (uses Resend REST API via `fetch`). Implement unsubscribe route with cryptographically signed tokens or verified emails.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/routes/unsubscribe.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/email/ src/routes/unsubscribe.js tests/email/ tests/routes/unsubscribe.test.js
git commit -m "feat: implement email sender adapter and unsubscribe route"
```

---

### Task 9: Server Assembly & End-to-End Flow Verification

**Files:**
- Create: `src/server.js`
- Test: `tests/e2e/flows.test.js`

**Interfaces:**
- Assembles: Config, Database, Routes (Webhooks, Tracking, Unsubscribe), Scheduler Worker, and Email Sender into a runnable service.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/e2e/flows.test.js
import { describe, it, expect } from 'vitest';
import { buildServer } from '../../src/server.js';
import crypto from 'node:crypto';

describe('End-to-End Behavioral Lifecycle', () => {
  it('processes abandoned checkout, triggers email, and cancels upon purchase', async () => {
    const secret = 'e2e_secret';
    const server = await buildServer({
      DB_PATH: ':memory:',
      SHOPIFY_WEBHOOK_SECRET: secret,
      EMAIL_PROVIDER: 'mock',
      SHOP_DOMAIN: 'homecartel.net'
    });

    function sign(payload) {
      return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');
    }

    // 1. Checkout started
    const checkoutPayload = JSON.stringify({
      id: 5050,
      email: 'cart_user@homecartel.ph',
      abandoned_checkout_url: 'https://homecartel.net/checkout/5050',
      line_items: [{ title: 'Solomon Pendant Light', price: '4500.00', quantity: 1 }]
    });

    await server.inject({
      method: 'POST',
      url: '/api/webhooks/shopify/checkouts',
      headers: { 'x-shopify-hmac-sha256': sign(checkoutPayload), 'content-type': 'application/json' },
      payload: checkoutPayload
    });

    // 2. Order completed -> should cancel the cart job
    const orderPayload = JSON.stringify({
      id: 9090,
      checkout_id: 5050,
      email: 'cart_user@homecartel.ph'
    });

    await server.inject({
      method: 'POST',
      url: '/api/webhooks/shopify/orders',
      headers: { 'x-shopify-hmac-sha256': sign(orderPayload), 'content-type': 'application/json' },
      payload: orderPayload
    });

    // 3. Run scheduler cycle -> 0 abandoned cart emails should be sent
    const cycle = await server.runScheduler(new Date(Date.now() + 10000000).toISOString());
    expect(cycle.sent).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/e2e/flows.test.js`  
Expected: FAIL

- [ ] **Step 3: Implement `src/server.js`**

Implement `buildServer(envConfig)` factory registering all plugins, routes, database lifecycle, and scheduler execution interval.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/e2e/flows.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/server.js tests/e2e/flows.test.js
git commit -m "feat: assemble server and verify end-to-end behavioral lifecycle"
```
