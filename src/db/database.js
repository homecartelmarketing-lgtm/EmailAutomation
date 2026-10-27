import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Initializes SQLite database and returns repository methods.
 * @param {string} dbPath - File path or ':memory:'
 */
export function initDatabase(dbPath = ':memory:') {
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);

  // Enable foreign keys and WAL mode
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  // Run schema setup
  const schemaPath = path.resolve('src/db/schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  } else {
    db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        status TEXT DEFAULT 'subscribed',
        created_at TEXT DEFAULT (datetime('now')),
        last_active_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        visitor_id TEXT,
        event_type TEXT NOT NULL,
        properties_json TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        checkout_id TEXT UNIQUE NOT NULL,
        email TEXT,
        cart_token TEXT,
        items_json TEXT,
        subtotal TEXT,
        recovery_url TEXT,
        status TEXT DEFAULT 'active',
        updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS scheduled_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flow_type TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        context_json TEXT,
        execute_at TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS email_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_email TEXT NOT NULL,
        flow_name TEXT NOT NULL,
        template_name TEXT,
        message_id TEXT,
        sent_at TEXT NOT NULL
      );
    `);
  }

  return {
    rawDb: db,

    upsertCustomer({ email, name, status = 'subscribed' }) {
      const existing = db.prepare('SELECT id, status FROM customers WHERE email = ?').get(email);
      if (existing) {
        db.prepare("UPDATE customers SET name = coalesce(?, name), last_active_at = datetime('now') WHERE id = ?").run(name, existing.id);
        return existing.id;
      }
      const res = db.prepare('INSERT INTO customers (email, name, status) VALUES (?, ?, ?)').run(email, name, status);
      return Number(res.lastInsertRowid);
    },

    getCustomerByEmail(email) {
      return db.prepare('SELECT * FROM customers WHERE email = ?').get(email);
    },

    setCustomerUnsubscribed(email) {
      db.prepare(`
        INSERT INTO customers (email, status) 
        VALUES (?, 'unsubscribed')
        ON CONFLICT(email) DO UPDATE SET status = 'unsubscribed'
      `).run(email);
      db.prepare("UPDATE scheduled_jobs SET status = 'cancelled' WHERE recipient_email = ? AND status = 'pending'").run(email);
    },

    recordEvent({ customerId = null, visitorId = null, eventType, propertiesJson = '{}' }) {
      const res = db.prepare(
        'INSERT INTO events (customer_id, visitor_id, event_type, properties_json) VALUES (?, ?, ?, ?)'
      ).run(customerId, visitorId, eventType, propertiesJson);
      return Number(res.lastInsertRowid);
    },

    linkVisitorEventsToCustomer(visitorId, customerId) {
      db.prepare('UPDATE events SET customer_id = ? WHERE visitor_id = ? AND customer_id IS NULL').run(customerId, visitorId);
    },

    getEventsByCustomerId(customerId) {
      return db.prepare('SELECT * FROM events WHERE customer_id = ? ORDER BY created_at DESC').all(customerId);
    },

    upsertCart({ checkoutId, email, cartToken = '', itemsJson = '[]', subtotal = '0.00', recoveryUrl = '', status = 'active' }) {
      const existing = db.prepare('SELECT id FROM carts WHERE checkout_id = ?').get(checkoutId);
      if (existing) {
        db.prepare(`
          UPDATE carts 
          SET email = coalesce(?, email), items_json = ?, subtotal = ?, recovery_url = ?, status = ?, updated_at = datetime('now')
          WHERE checkout_id = ?
        `).run(email, itemsJson, subtotal, recoveryUrl, status, checkoutId);
        return existing.id;
      }
      const res = db.prepare(`
        INSERT INTO carts (checkout_id, email, cart_token, items_json, subtotal, recovery_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(checkoutId, email, cartToken, itemsJson, subtotal, recoveryUrl, status);
      return Number(res.lastInsertRowid);
    },

    getCartByCheckoutId(checkoutId) {
      return db.prepare('SELECT * FROM carts WHERE checkout_id = ?').get(checkoutId);
    },

    markCartRecovered(checkoutId) {
      db.prepare("UPDATE carts SET status = 'recovered' WHERE checkout_id = ?").run(checkoutId);
    },

    scheduleJob({ flowType, recipientEmail, contextJson = '{}', executeAt }) {
      const res = db.prepare(`
        INSERT INTO scheduled_jobs (flow_type, recipient_email, context_json, execute_at, status)
        VALUES (?, ?, ?, ?, 'pending')
      `).run(flowType, recipientEmail, contextJson, executeAt);
      return Number(res.lastInsertRowid);
    },

    cancelPendingJobsByEmail(email, flowType = null) {
      if (flowType) {
        db.prepare("UPDATE scheduled_jobs SET status = 'cancelled' WHERE recipient_email = ? AND flow_type = ? AND status = 'pending'").run(email, flowType);
      } else {
        db.prepare("UPDATE scheduled_jobs SET status = 'cancelled' WHERE recipient_email = ? AND status = 'pending'").run(email);
      }
    },

    cancelPendingJobsByCheckoutId(checkoutId) {
      db.prepare(`
        UPDATE scheduled_jobs 
        SET status = 'cancelled' 
        WHERE flow_type = 'abandoned_cart' 
          AND status = 'pending' 
          AND context_json LIKE ?
      `).run(`%"checkoutId":"${checkoutId}"%`);
    },

    getPendingDueJobs(isoNow) {
      return db.prepare(`
        SELECT * FROM scheduled_jobs 
        WHERE status = 'pending' AND execute_at <= ? 
        ORDER BY execute_at ASC
      `).all(isoNow);
    },

    claimJobForExecution(jobId) {
      const res = db.prepare("UPDATE scheduled_jobs SET status = 'in_progress' WHERE id = ? AND status = 'pending'").run(jobId);
      return res.changes > 0;
    },

    markJobSent(jobId) {
      db.prepare("UPDATE scheduled_jobs SET status = 'sent' WHERE id = ?").run(jobId);
    },

    markJobSkipped(jobId) {
      db.prepare("UPDATE scheduled_jobs SET status = 'skipped' WHERE id = ?").run(jobId);
    },

    recordEmailLog({ recipientEmail, flowName, templateName = '', messageId = '', sentAt = new Date().toISOString() }) {
      const res = db.prepare(`
        INSERT INTO email_logs (recipient_email, flow_name, template_name, message_id, sent_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(recipientEmail, flowName, templateName, messageId, sentAt);
      return Number(res.lastInsertRowid);
    },

    getLastMarketingEmailTime(email) {
      const row = db.prepare('SELECT sent_at FROM email_logs WHERE recipient_email = ? ORDER BY sent_at DESC LIMIT 1').get(email);
      if (!row || !row.sent_at) return null;
      // Ensure ISO UTC format
      let str = row.sent_at;
      if (!str.endsWith('Z') && !str.includes('+')) {
        str = str.replace(' ', 'T') + 'Z';
      }
      return str;
    }
  };
}
