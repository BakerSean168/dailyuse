/**
 * SQLite Database Schema - Dashboard Support Tables
 */

export const DASHBOARD_MODULE_SCHEMA = `
CREATE TABLE IF NOT EXISTS dashboard_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identity_id TEXT UNIQUE NOT NULL,
  widget_config TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dashboard_configs_identity_id ON dashboard_configs(identity_id);
`;