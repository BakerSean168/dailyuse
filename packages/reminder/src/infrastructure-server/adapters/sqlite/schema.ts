/**
 * SQLite Database Schema - Reminder Module
 * 鎻愰啋妯″潡鏁版嵁搴撴灦鏋?
 */

export const REMINDER_MODULE_SCHEMA = `
-- Reminder Responses Table
CREATE TABLE IF NOT EXISTS reminder_responses (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  action TEXT NOT NULL,
  responded_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES reminder_templates(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reminder_responses_account_id ON reminder_responses(identity_id);
CREATE INDEX IF NOT EXISTS idx_reminder_responses_template_id ON reminder_responses(template_id);

-- Reminder Groups Table
CREATE TABLE IF NOT EXISTS reminder_groups (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reminder_groups_account_id ON reminder_groups(identity_id);

-- Reminder Templates Table
CREATE TABLE IF NOT EXISTS reminder_templates (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  group_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  reminder_type TEXT NOT NULL,
  trigger_time INTEGER,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES reminder_groups(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reminder_templates_account_id ON reminder_templates(identity_id);
CREATE INDEX IF NOT EXISTS idx_reminder_templates_group_id ON reminder_templates(group_id);
CREATE INDEX IF NOT EXISTS idx_reminder_templates_status ON reminder_templates(status);
`;
