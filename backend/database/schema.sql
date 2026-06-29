-- ================================================================
-- Office Asset Tracker - Complete Database Schema
-- SQLite Compatible SQL Script
-- ================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ================================================================
-- Table: users
-- ================================================================
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL UNIQUE,
  password_hash TEXT  NOT NULL,
  role        TEXT    NOT NULL DEFAULT 'employee' CHECK(role IN ('admin','employee')),
  department  TEXT    NOT NULL DEFAULT 'General',
  phone       TEXT,
  avatar_url  TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ================================================================
-- Table: asset_categories
-- ================================================================
CREATE TABLE IF NOT EXISTS asset_categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL UNIQUE,
  description TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ================================================================
-- Table: assets
-- ================================================================
CREATE TABLE IF NOT EXISTS assets (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,
  category_id     INTEGER NOT NULL REFERENCES asset_categories(id) ON DELETE RESTRICT,
  serial_number   TEXT    UNIQUE,
  model           TEXT,
  manufacturer    TEXT,
  purchase_date   TEXT,
  purchase_cost   REAL    DEFAULT 0,
  warranty_expiry TEXT,
  status          TEXT    NOT NULL DEFAULT 'available' CHECK(status IN ('available','assigned','maintenance','retired')),
  location        TEXT,
  notes           TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ================================================================
-- Table: asset_assignments
-- ================================================================
CREATE TABLE IF NOT EXISTS asset_assignments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id    INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by INTEGER NOT NULL REFERENCES users(id),
  assigned_at TEXT    NOT NULL DEFAULT (datetime('now')),
  returned_at TEXT,
  notes       TEXT
);

-- ================================================================
-- Table: service_requests
-- ================================================================
CREATE TABLE IF NOT EXISTS service_requests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT    NOT NULL CHECK(type IN ('asset_request','maintenance','service','other')),
  title       TEXT    NOT NULL,
  description TEXT    NOT NULL,
  priority    TEXT    NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),
  status      TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','in_progress','completed','cancelled')),
  asset_id    INTEGER REFERENCES assets(id),
  assigned_to INTEGER REFERENCES users(id),
  resolved_at TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ================================================================
-- Table: request_comments
-- ================================================================
CREATE TABLE IF NOT EXISTS request_comments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id  INTEGER NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  comment     TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ================================================================
-- Table: notifications
-- ================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT    NOT NULL,
  message         TEXT    NOT NULL,
  type            TEXT    NOT NULL DEFAULT 'info' CHECK(type IN ('info','success','warning','error')),
  is_read         INTEGER NOT NULL DEFAULT 0,
  reference_id    INTEGER,
  reference_type  TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ================================================================
-- Table: audit_logs
-- ================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id),
  action      TEXT    NOT NULL,
  entity_type TEXT    NOT NULL,
  entity_id   INTEGER,
  details     TEXT,
  old_values  TEXT,
  new_values  TEXT,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ================================================================
-- Indexes for performance
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_assets_status     ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category   ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_requests_user     ON service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status   ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_type     ON service_requests(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_entity      ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_assignments_asset ON asset_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user  ON asset_assignments(user_id);
