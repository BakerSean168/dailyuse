/**
 * SQLite Database Schema - Setting Module
 * JSONB-style single-table storage
 */

export const SETTING_MODULE_SCHEMA = `
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  identity_id TEXT UNIQUE NOT NULL,
  preferences TEXT NOT NULL DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_settings_identity_id ON user_settings(identity_id);
`;
