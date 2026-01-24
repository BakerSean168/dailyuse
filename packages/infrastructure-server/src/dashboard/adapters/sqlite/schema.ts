/**
 * SQLite Database Schema - Dashboard Module
 * 浠〃鏉挎ā鍧楁暟鎹簱鏋舵瀯
 */

export const DASHBOARD_MODULE_SCHEMA = `
-- Dashboard Configs Table
CREATE TABLE IF NOT EXISTS dashboard_configs (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL UNIQUE,
  config_data TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dashboard_configs_account_uuid ON dashboard_configs(account_uuid);
`;
