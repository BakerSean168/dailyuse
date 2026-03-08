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
  type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'SYSTEM',
  status TEXT NOT NULL DEFAULT 'UNREAD',
  message TEXT,
  content TEXT,
  importance TEXT NOT NULL DEFAULT 'NORMAL',
  urgency TEXT NOT NULL DEFAULT 'NORMAL',
  related_entity_type TEXT,
  related_entity_id TEXT,
  metadata TEXT,
  actions TEXT,
  read_at INTEGER,
  sent_at INTEGER,
  expires_at INTEGER,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  is_read INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_account_id ON notifications(identity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Notification Channels Table
CREATE TABLE IF NOT EXISTS notification_channels (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  notification_id TEXT NOT NULL,
  channel_type TEXT NOT NULL,
  status TEXT NOT NULL,
  recipient TEXT,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error TEXT,
  response TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notification_channels_identity_id ON notification_channels(identity_id);
CREATE INDEX IF NOT EXISTS idx_notification_channels_notification_id ON notification_channels(notification_id);

-- Notification History Table
CREATE TABLE IF NOT EXISTS notification_history (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  notification_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  actor_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notification_history_identity_id ON notification_history(identity_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_notification_id ON notification_history(notification_id);

-- Notification Templates Table
CREATE TABLE IF NOT EXISTS notification_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT,
  description TEXT,
  type TEXT,
  title TEXT NOT NULL,
  title_template TEXT,
  message_template TEXT NOT NULL,
  content_template TEXT,
  category TEXT,
  variables TEXT,
  default_actions TEXT,
  is_system INTEGER NOT NULL DEFAULT 0,
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
  enabled INTEGER NOT NULL DEFAULT 1,
  channels TEXT,
  categories TEXT,
  do_not_disturb TEXT,
  rate_limit TEXT,
  email_enabled INTEGER DEFAULT 1,
  push_enabled INTEGER DEFAULT 1,
  sms_enabled INTEGER DEFAULT 0,
  quiet_hours_enabled INTEGER DEFAULT 0,
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);
`;
