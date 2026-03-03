/**
 * SQLite Database Schema - Reminder Module
 */

export const REMINDER_MODULE_SCHEMA = `
-- Reminder Responses Table
CREATE TABLE IF NOT EXISTS reminder_responses (
  id TEXT PRIMARY KEY,
  reminder_template_id TEXT NOT NULL,
  action TEXT NOT NULL,
  response_time INTEGER,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (reminder_template_id) REFERENCES reminder_templates(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reminder_responses_template_id ON reminder_responses(reminder_template_id);
CREATE INDEX IF NOT EXISTS idx_reminder_responses_timestamp ON reminder_responses(timestamp);

-- Reminder Groups Table
CREATE TABLE IF NOT EXISTS reminder_groups (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  control_mode TEXT NOT NULL DEFAULT 'manual',
  is_enabled INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  "order" INTEGER NOT NULL DEFAULT 0,
  color TEXT,
  icon TEXT,
  stats TEXT NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reminder_groups_identity_id ON reminder_groups(identity_id);
CREATE INDEX IF NOT EXISTS idx_reminder_groups_status ON reminder_groups(status);

-- Reminder Templates Table
CREATE TABLE IF NOT EXISTS reminder_templates (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  trigger TEXT NOT NULL,
  recurrence TEXT,
  active_time TEXT NOT NULL DEFAULT '{}',
  active_hours TEXT,
  notification_config TEXT NOT NULL DEFAULT '{}',
  self_enabled INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  group_id TEXT,
  importance_level TEXT NOT NULL DEFAULT 'MEDIUM',
  tags TEXT NOT NULL DEFAULT '[]',
  color TEXT,
  icon TEXT,
  next_trigger_at INTEGER,
  stats TEXT NOT NULL DEFAULT '{}',
  click_rate REAL,
  ignore_rate REAL,
  avg_response_time REAL,
  snooze_count INTEGER DEFAULT 0,
  smart_frequency_enabled INTEGER DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES reminder_groups(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reminder_templates_identity_id ON reminder_templates(identity_id);
CREATE INDEX IF NOT EXISTS idx_reminder_templates_group_id ON reminder_templates(group_id);
CREATE INDEX IF NOT EXISTS idx_reminder_templates_status ON reminder_templates(status);
CREATE INDEX IF NOT EXISTS idx_reminder_templates_next_trigger ON reminder_templates(next_trigger_at);

-- User Reminder Preferences Table
CREATE TABLE IF NOT EXISTS user_reminder_preferences (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL UNIQUE,
  best_time_slots TEXT NOT NULL DEFAULT '[]',
  worst_time_slots TEXT NOT NULL DEFAULT '[]',
  global_smart_frequency INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_reminder_preferences_identity_id ON user_reminder_preferences(identity_id);
`;
