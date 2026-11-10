CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'subscribed', -- 'subscribed', 'unsubscribed'
  created_at TEXT DEFAULT (datetime('now')),
  last_active_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  visitor_id TEXT,
  event_type TEXT NOT NULL,
  properties_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS visitor_carts (
  cart_token TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
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
  status TEXT DEFAULT 'active', -- 'active', 'abandoned', 'recovered', 'expired'
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flow_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  context_json TEXT,
  execute_at TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'cancelled', 'failed', 'skipped'
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_email TEXT NOT NULL,
  flow_name TEXT NOT NULL,
  template_name TEXT,
  message_id TEXT,
  sent_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS flow_settings (
  flow_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_enabled INTEGER DEFAULT 0, -- 0 for off, 1 for on
  delay_hours REAL DEFAULT 0,
  description TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_events_visitor ON events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_visitor_carts ON visitor_carts(cart_token);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_status_due ON scheduled_jobs(status, execute_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_sent ON email_logs(recipient_email, sent_at);
