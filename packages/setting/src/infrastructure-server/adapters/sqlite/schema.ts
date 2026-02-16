/**
 * SQLite Database Schema - Setting Module
 * 璁剧疆妯″潡鏁版嵁搴撴灦鏋?
 */

export const SETTING_MODULE_SCHEMA = `
-- App Configs Table
CREATE TABLE IF NOT EXISTS app_configs (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_app_configs_key ON app_configs(key);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(category, key)
);

CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE,
  UNIQUE(identity_id, category, key)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_account_id ON user_settings(identity_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_category ON user_settings(category);
`;
