/**
 * SQLite Database Schema - Notification Module
 * 通知模块数据库架构
 */

export const NOTIFICATION_MODULE_SCHEMA = `
-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNREAD',
  read_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_account_uuid ON notifications(account_uuid);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Notification Templates Table
CREATE TABLE IF NOT EXISTS notification_templates (
  uuid TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  message_template TEXT NOT NULL,
  category TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_is_active ON notification_templates(is_active);

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL UNIQUE,
  email_enabled INTEGER DEFAULT 1,
  push_enabled INTEGER DEFAULT 1,
  sms_enabled INTEGER DEFAULT 0,
  quiet_hours_enabled INTEGER DEFAULT 0,
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);
`;
