/**
 * SQLite Database Schema - Reminder Module
 * 鎻愰啋妯″潡鏁版嵁搴撴灦鏋?
 */

export const REMINDER_MODULE_SCHEMA = `
-- Reminder Responses Table
CREATE TABLE IF NOT EXISTS reminder_responses (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  template_uuid TEXT NOT NULL,
  action TEXT NOT NULL,
  responded_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
  FOREIGN KEY (template_uuid) REFERENCES reminder_templates(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reminder_responses_account_uuid ON reminder_responses(account_uuid);
CREATE INDEX IF NOT EXISTS idx_reminder_responses_template_uuid ON reminder_responses(template_uuid);

-- Reminder Groups Table
CREATE TABLE IF NOT EXISTS reminder_groups (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reminder_groups_account_uuid ON reminder_groups(account_uuid);

-- Reminder Templates Table
CREATE TABLE IF NOT EXISTS reminder_templates (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  group_uuid TEXT,
  title TEXT NOT NULL,
  description TEXT,
  reminder_type TEXT NOT NULL,
  trigger_time INTEGER,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
  FOREIGN KEY (group_uuid) REFERENCES reminder_groups(uuid) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reminder_templates_account_uuid ON reminder_templates(account_uuid);
CREATE INDEX IF NOT EXISTS idx_reminder_templates_group_uuid ON reminder_templates(group_uuid);
CREATE INDEX IF NOT EXISTS idx_reminder_templates_status ON reminder_templates(status);
`;
