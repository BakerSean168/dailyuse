/**
 * SQLite Database Schema - Notification Module
 * 閫氱煡妯″潡鏁版嵁搴撴灦鏋?
 */

export const NOTIFICATION_MODULE_SCHEMA = `
-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNREAD',
  read_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_account_id ON notifications(identity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Notification Templates Table
CREATE TABLE IF NOT EXISTS notification_templates (
  id TEXT PRIMARY KEY,
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
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL UNIQUE,
  email_enabled INTEGER DEFAULT 1,
  push_enabled INTEGER DEFAULT 1,
  sms_enabled INTEGER DEFAULT 0,
  quiet_hours_enabled INTEGER DEFAULT 0,
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);
`;
