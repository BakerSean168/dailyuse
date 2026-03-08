/**
 * SQLite Database Schema - Task Module
 * 浠诲姟妯″潡鏁版嵁搴撴灦鏋?
 */

export const TASK_MODULE_SCHEMA = `
-- Task Instances Table
CREATE TABLE IF NOT EXISTS task_instances (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  instance_date INTEGER,
  scheduled_date INTEGER NOT NULL,
  actual_date INTEGER,
  status TEXT NOT NULL DEFAULT 'PENDING',
  importance TEXT NOT NULL DEFAULT 'moderate',
  priority INTEGER,
  time_config TEXT,
  actual_start_time INTEGER,
  actual_end_time INTEGER,
  comment TEXT,
  duration_minutes INTEGER,
  notes TEXT,
  completed_at INTEGER,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES task_templates(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_instances_account_id ON task_instances(identity_id);
CREATE INDEX IF NOT EXISTS idx_task_instances_template_id ON task_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_task_instances_status ON task_instances(status);
CREATE INDEX IF NOT EXISTS idx_task_instances_scheduled_date ON task_instances(scheduled_date);

-- Task Templates Table
CREATE TABLE IF NOT EXISTS task_templates (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  folder_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  importance TEXT NOT NULL DEFAULT 'moderate',
  priority INTEGER,
  color TEXT,
  estimated_duration INTEGER,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  tags TEXT NOT NULL DEFAULT '[]',
  goal_id TEXT,
  parent_task_id TEXT,
  time_config_type TEXT,
  time_config_start_time INTEGER,
  time_config_end_time INTEGER,
  time_config_duration_minutes INTEGER,
  time_config_time_point INTEGER,
  time_config_time_range_start INTEGER,
  time_config_time_range_end INTEGER,
  recurrence_rule_type TEXT,
  recurrence_rule_interval INTEGER,
  recurrence_rule_days_of_week TEXT,
  recurrence_rule_day_of_month INTEGER,
  recurrence_rule_month_of_year INTEGER,
  recurrence_rule_end_date INTEGER,
  recurrence_rule_count INTEGER,
  reminder_config_enabled INTEGER,
  reminder_config_time_offset_minutes INTEGER,
  reminder_config_unit TEXT,
  reminder_config_channel TEXT,
  last_generated_date INTEGER,
  generate_ahead_days INTEGER,
  goal_binding TEXT,
  checklist TEXT,
  blocking_reason TEXT,
  dependency_status TEXT NOT NULL DEFAULT 'NONE',
  is_blocked INTEGER NOT NULL DEFAULT 0,
  is_recurring INTEGER DEFAULT 0,
  recurrence_pattern TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_templates_account_id ON task_templates(identity_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_status ON task_templates(status);
CREATE INDEX IF NOT EXISTS idx_task_templates_folder_id ON task_templates(folder_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_importance ON task_templates(importance);
CREATE INDEX IF NOT EXISTS idx_task_templates_parent_task_id ON task_templates(parent_task_id);

-- Task Folders Table
CREATE TABLE IF NOT EXISTS task_folders (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_folders_account_id ON task_folders(identity_id);
CREATE INDEX IF NOT EXISTS idx_task_folders_order ON task_folders(order_index);

-- Task Dependencies Table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  predecessor_id TEXT NOT NULL,
  successor_id TEXT NOT NULL,
  dependency_type TEXT NOT NULL,
  predecessor_task_id TEXT,
  successor_task_id TEXT,
  lag_days INTEGER,
  version INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (predecessor_id) REFERENCES task_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (successor_id) REFERENCES task_templates(id) ON DELETE CASCADE,
  UNIQUE(predecessor_id, successor_id)
);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_account_id ON task_dependencies(identity_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_predecessor ON task_dependencies(predecessor_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_successor ON task_dependencies(successor_id);
`;
