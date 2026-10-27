# HomeCartel Behavioral Email Marketing Automation — System Design

**Date:** 2026-10-27  
**Status:** Draft for Review  
**Target Platform:** Shopify (`homecartel.net`)  
**Domain:** E-commerce Lighting & Home Improvement  

---

## 1. Intent & Context

HomeCartel (`homecartel.net`) is a specialized lighting fixture supplier and home retailer based in Quezon City, Metro Manila, Philippines. Lighting products (chandeliers, pendant lights, architectural lighting, wall sconces) are high-consideration purchases. Customers typically research styles, compare dimensions, and browse multiple times before purchasing.

Currently, marketing emails and automations rely on SaaS platforms (such as Omnisend) which charge recurring monthly subscription fees that scale as customer contacts accumulate. 

The goal of this project is to build an independent, self-hosted **Behavioral Email Marketing Automation Engine** that connects natively to Shopify, ingests on-site visitor behavior and Shopify checkout/order events, evaluates timing rules, and delivers responsive, branded behavioral emails via low-cost transactional email APIs (e.g., Resend or Amazon SES), permanently eliminating monthly SaaS contact fees.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Full Behavioral Lifecycle Coverage:** Implement all 5 core e-commerce behavioral flows:
  1. Abandoned Cart / Checkout Recovery (with recovery link and item preview).
  2. Welcome & Onboarding Series (store introduction, lighting selection guide).
  3. Browse Abandonment & Dynamic Recommendations (viewed product + related fixtures).
  4. Post-Purchase Care & Review Requests (installation tips, maintenance, photo review).
  5. Customer Re-engagement / Winback (lapsed users inactive for 60+ days).
- **Shopify Webhook Ingestion:** Secure HMAC-verified endpoints receiving cart, customer, and order lifecycle events from Shopify.
- **Storefront Behavioral Tracking:** Lightweight client tracking snippet (or Shopify Web Pixel) capturing product page views, category views, and user identification.
- **Reliable Scheduling Engine:** Precise delayed triggers (e.g., send 2 hours after abandonment; send 7 days post-fulfillment) with idempotency and cancellation when actions occur (e.g., purchasing cancels the abandoned cart reminder).
- **Strict Compliance:** Automated one-click unsubscribe handling, opt-out suppression, and mandatory physical store address in every email footer.
- **Minimal Operating Cost:** Run on a micro-service/container (free tier or <$5/mo) with transactional email API costs at pennies per thousand emails.

### Non-Goals
- **Visual Drag-and-Drop Template Builder:** Not building a WYSIWYG drag-and-drop editor. Email layouts are managed via clean, modular HTML/CSS component templates.
- **Ad Platform Synchronization:** Not syncing audiences to Facebook/Google Ad accounts (focus is strictly email automation).
- **Manual Mass Blast Campaigns:** While the system can send batches, its primary architecture is automated, event-driven behavioral sequences.

### Anti-Goals
- **Contact-Tier Penalties:** The system must never charge or throttle based on the size of the contact database.
- **Email Fatigue / Spamming:** The engine must enforce global frequency capping (e.g., no more than 1 marketing email per user per 48 hours, excluding immediate transactional alerts).

---

## 3. Approaches Considered & Trade-Offs

| Approach | Monthly Running Cost | Maintenance Overhead | Customization & Control | Selected? |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: Shopify Omnisend** | $16 – $130+/mo (scales with list size) | Zero (SaaS) | Limited to Omnisend UI & recipes | No (Rejected due to recurring contact fees) |
| **Option B: Brevo (Sendinblue)** | $0 – $25/mo (scales with email volume) | Low (SaaS app) | Limited to Brevo UI; requires migration | No (User prefers zero-subscription ownership) |
| **Option C: Custom In-House Engine** | ~$0 – $5/mo (Hosting + transactional API) | Moderate (self-hosted service) | **100% control over logic, data, and design** | **YES (Chosen)** |

**Why Option C Was Chosen:**  
HomeCartel wants to own the infrastructure and permanently eliminate monthly contact fees while retaining full algorithmic flexibility over product recommendation rules and event triggers.

---

## 4. System Architecture

```
+-------------------------------------------------------------------------+
|                              homecartel.net                             |
|                                                                         |
|  [ Storefront Browser ]                      [ Shopify Core ]           |
|         |                                           |                   |
|    Page Views & Product Views                 Shopify Webhooks          |
|    (homecartel-tracker.js)                (HMAC SHA256 Authenticated)   |
+---------|-------------------------------------------|-------------------+
          |                                           |
          v                                           v
+-------------------------------------------------------------------------+
|                  HomeCartel Email Automation Engine                     |
|                                                                         |
|  +--------------------+                     +-------------------------+ |
|  | Event Ingestion API|                     | Webhook Ingestion API   | |
|  +--------------------+                     +-------------------------+ |
|            |                                             |              |
|            +----------------------+----------------------+              |
|                                   v                                     |
|                       +----------------------+                          |
|                       |  Behavior & Session  |                          |
|                       |      Processor       |                          |
|                       +----------------------+                          |
|                                   |                                     |
|                                   v                                     |
|                       +----------------------+                          |
|                       |   SQLite / Postgres  |                          |
|                       |    Event & State DB  |                          |
|                       +----------------------+                          |
|                                   |                                     |
|                                   v                                     |
|                       +----------------------+                          |
|                       |   Delay & Trigger    |                          |
|                       |   Scheduler Worker   |                          |
|                       +----------------------+                          |
|                                   |                                     |
|                                   v                                     |
|                       +----------------------+                          |
|                       | Responsive Lighting  |                          |
|                       |   HTML Templates     |                          |
|                       +----------------------+                          |
|                                   |                                     |
+-----------------------------------|-------------------------------------+
                                    v
                        +----------------------+
                        | Transactional API    |
                        | (Resend / Amazon SES)|
                        +----------------------+
                                    |
                                    v
                        +----------------------+
                        |   Customer's Inbox   |
                        +----------------------+
```

### Components

1. **Ingestion Service (Fastify / Express Node.js):**
   - `POST /api/webhooks/shopify/checkouts`: Records new or modified checkouts.
   - `POST /api/webhooks/shopify/orders`: Cancels pending cart reminders; logs purchase history.
   - `POST /api/webhooks/shopify/fulfillments`: Schedules post-purchase follow-up.
   - `POST /api/webhooks/shopify/customers`: Triggers welcome onboarding series.
   - `POST /api/track/event`: Ingests storefront client events (`page_view`, `product_view`, `identify`).
   - `GET /api/unsubscribe`: One-click opt-out handler.

2. **Database Schema (Embedded SQLite with WAL or PostgreSQL):**
   - `customers`: `id`, `email`, `name`, `status` (`subscribed`/`unsubscribed`), `created_at`, `last_active_at`.
   - `events`: `id`, `customer_id`, `event_type`, `properties_json`, `timestamp`.
   - `carts`: `id`, `shopify_checkout_id`, `email`, `cart_token`, `items_json`, `subtotal`, `recovery_url`, `status` (`active`, `abandoned`, `recovered`, `expired`), `updated_at`.
   - `scheduled_jobs`: `id`, `flow_type`, `recipient_email`, `context_json`, `execute_at`, `status` (`pending`, `sent`, `cancelled`, `failed`), `created_at`.
   - `email_logs`: `id`, `recipient_email`, `flow_name`, `template_name`, `message_id`, `sent_at`.

3. **Behavioral Workflow Definitions:**

   - **Flow 1: Abandoned Cart Recovery**
     - *Trigger:* Checkout updated without completion.
     - *Delay:* 2 hours after last cart update.
     - *Condition:* If no `order/create` matching checkout ID exists.
     - *Content:* Items left behind, product thumbnail, direct Shopify checkout restore URL, warm lighting support reassurance.
     - *Follow-up:* Optional 2nd email at 24 hours if still uncompleted.

   - **Flow 2: Welcome & Onboarding Series**
     - *Trigger:* Customer newsletter signup or account creation.
     - *Step 1 (Immediate):* Welcome to HomeCartel, brand values, quality craftsmanship, customer support channels.
     - *Step 2 (+3 Days):* "The HomeCartel Lighting Guide" — choosing between pendant lights, chandeliers, and wall sconces; sizing and warm/cool light temperatures.

   - **Flow 3: Browse Abandonment & Smart Recommendations**
     - *Trigger:* Identified customer views a product page $\ge 2$ times within 48 hours without adding to cart.
     - *Delay:* 4 hours after session end.
     - *Content:* Highlight the specific fixture viewed + 2 hand-picked complementary pieces from the same collection (e.g. Modern Brass Chandelier + matching Brass Wall Sconce).

   - **Flow 4: Post-Purchase Follow-up & Review Request**
     - *Trigger:* Order marked fulfilled / delivered in Shopify.
     - *Delay:* 7 days after delivery.
     - *Content:* Installation tips, bulb selection advice (E27 warm white guide), and request for a photo review or feedback.

   - **Flow 5: Winback & Customer Re-engagement**
     - *Trigger:* Daily cron scanning customers with `last_active_at > 60 days` and no recent purchases.
     - *Content:* "We miss you" email showcasing newest fixture arrivals and trending collections on HomeCartel.

---

## 5. Security, Deliverability & Compliance

- **Shopify HMAC Verification:** All webhook payloads are cryptographically validated against `X-Shopify-Hmac-Sha256` using the shared app webhook secret. Unsigned requests return `401 Unauthorized`.
- **Anti-Spam Regulations:**
  - One-click unsubscribe link in header (`List-Unsubscribe`) and footer.
  - Physical footer address included in all email layouts:
    > HomeCartel  
    > 673 Banawe Street, Santa Mesa Heights, Quezon City, Metro Manila, Philippines
- **Frequency Capping:** Max 1 automated marketing email per recipient per 48 hours (excepting immediate Welcome or transactional emails).
- **Domain Authentication:** Uses verified DNS records (SPF, DKIM, DMARC) through the chosen sending API (Resend or SES) for `homecartel.net`.

---

## 6. What's Left to the Builder

The builder implementing this system has discretion over:
- Concrete programming language/framework (Node.js with TypeScript and Fastify/Express recommended for lightweight memory footprint).
- Choice between SQLite (WAL mode, zero-ops) or PostgreSQL.
- Specific job queue library (e.g., in-memory delay worker with SQLite persistence or BullMQ with Redis).
- Specific HTML email layout styling and modular template engine (e.g., `@react-email`, MJML, or Handlebars).
