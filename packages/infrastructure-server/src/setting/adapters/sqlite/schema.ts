/**
 * SQLite Database Schema - Setting Module
 * 设置模块数据库架构
 */

export const SETTING_MODULE_SCHEMA = `
-- App Configs Table
CREATE TABLE IF NOT EXISTS app_configs (
  uuid TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_app_configs_key ON app_configs(key);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
  uuid TEXT PRIMARY KEY,
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
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
  UNIQUE(account_uuid, category, key)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_account_uuid ON user_settings(account_uuid);
CREATE INDEX IF NOT EXISTS idx_user_settings_category ON user_settings(category);
`;
