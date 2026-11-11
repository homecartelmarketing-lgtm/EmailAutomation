# 5 Behavioral Email Flows & Per-Flow Automation Toggle Controls

> **ARCHIVED — 2026-11-11. Delivered.** All 19 checkboxes below were left unticked by mistake; every task in
> this plan shipped and is covered by tests. The bash checkboxes are not a status indicator.
>
> For the as-built behaviour, read [`docs/FLOWS.md`](../FLOWS.md) (flows, delays, toggle semantics) and
> [`docs/API.md`](../API.md) (endpoints). This file is kept for design history only.
>
> Shipped as planned: `flow_settings` table (`src/db/schema.sql`), `GET /api/admin/flows`,
> `POST /api/admin/flows/:flowKey/toggle` and `/delay` (`src/routes/admin.js`), the scheduler gatekeeper
> (`src/scheduler/worker.js`), and the dashboard toggle switches (`public/index.html`).

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 5 behavioral email flows (Welcome 3-message drip featuring influencer social proof, Cart Abandonment, Browse Abandonment, Customer Winback, and Post-Purchase Review), and equip each flow with an independent On/Off toggle switch in the Admin Dashboard and backend scheduler so unready flows can remain disabled while active flows dispatch on their behavioral delay schedule.

**Architecture:** 
1. **Flow State Persistence:** A new `flow_settings` SQLite table storing `{ flow_key, name, is_enabled, delay_hours, description }`.
2. **Scheduler Gatekeeper:** The background scheduler checks both the master safety switch and the flow-specific `is_enabled` toggle before dispatching any queued job.
3. **Webhook Scheduling Gatekeeper:** Ingestion webhooks record visitor/shopper events for full behavioral tracking, but only enqueue pending jobs if the target flow is enabled.
4. **Admin Dashboard UI:** Interactive visual toggle switches for all 5 flows on the dashboard with real-time status pills (Active / Paused) and delay badges.
5. **Template System:** 5 production-grade responsive templates adhering to HomeCartel luxury branding with no physical address, dynamic pricing in PHP (`₱`), and influencer social proof.

**Tech Stack:** Node.js (ESM), Fastify, SQLite (`node:sqlite`), Resend API, Vitest.

---

## Global Constraints

* **Zero Physical Store Address:** Never output `673 Banawe Street...` in email headers or footers across any flow.
* **Unified Header & Footer:** All 5 flows must use the verified clean luxury header and footer with working unsubscribe and view-in-browser links.
* **Currency Formatting:** Philippine Peso (`₱`) formatted with commas (e.g. `₱27,920.00`).
* **Safe Defaults:** Every newly initialized flow defaults to `OFF` (`is_enabled = 0`) until explicitly toggled on by the user.
* **Non-Destructive Event Tracking:** Even when a flow's email sending is toggled OFF, Shopify webhooks and website tracking must still capture shopper analytics and history.

---

## Detailed Task Breakdown

### Task 1: Database Flow Settings & Persistence Layer
- [ ] Add `flow_settings` table to `src/db/schema.sql` and `src/db/database.js`.
- [ ] Seed 5 default flows (`welcome`, `abandoned_cart`, `browse_abandonment`, `winback`, `post_purchase`) set to disabled (`0`).
- [ ] Add repository methods: `getAllFlowSettings()`, `getFlowSetting(key)`, `setFlowEnabled(key, isEnabled)`.
- [ ] Write unit tests in `tests/db/database.test.js`.

### Task 2: Flow Toggle API Endpoints & Scheduler Gatekeepers
- [ ] Add `GET /api/admin/flows` and `POST /api/admin/flows/:flowKey/toggle` in `src/routes/admin.js`.
- [ ] Hook into webhook handlers in `src/routes/webhooks.js` to check `isFlowEnabled` before enqueueing jobs.
- [ ] Add post-purchase fulfillment scheduling in `src/routes/webhooks.js` under `fulfillments/create`.
- [ ] Update `src/scheduler/worker.js` to cancel or skip jobs if flow is disabled.
- [ ] Write tests in `tests/routes/admin_manual_send.test.js` and `tests/scheduler/worker.test.js`.

### Task 3: Welcome 3-Part Drip Templates with Influencer Social Proof
- [ ] Update `src/templates/canvaWelcome.js` to support 3 drip parts or modular social proof blocks.
- [ ] Add influencer living space photos and customer reviews.
- [ ] Write unit tests in `tests/templates/canvaWelcome.test.js`.

### Task 4: Post-Purchase Review & Care Guide Template
- [ ] Create `src/templates/postPurchase.js` with lighting care tips, review button, and Instagram UGC callout.
- [ ] Register `post_purchase` in `src/templates/renderer.js`.
- [ ] Write unit tests in `tests/templates/postPurchase.test.js`.

### Task 5: Admin Dashboard Interactive Toggle Switches
- [ ] Add "Automations & Flow Control" panel in `public/index.html`.
- [ ] Render 5 iOS-style toggle switches with live status badges.
- [ ] Connect toggle actions via fetch to `POST /api/admin/flows/:flowKey/toggle`.
- [ ] Run full test suite (`npm test`).
