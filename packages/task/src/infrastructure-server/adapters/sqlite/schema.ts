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
  scheduled_date INTEGER NOT NULL,
  actual_date INTEGER,
  status TEXT NOT NULL DEFAULT 'PENDING',
  duration_minutes INTEGER,
  notes TEXT,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
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
  estimated_duration INTEGER,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  tags TEXT,
  goal_id TEXT,
  is_recurring INTEGER DEFAULT 0,
  recurrence_pattern TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_templates_account_id ON task_templates(identity_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_status ON task_templates(status);
CREATE INDEX IF NOT EXISTS idx_task_templates_folder_id ON task_templates(folder_id);

-- Task Dependencies Table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  predecessor_id TEXT NOT NULL,
  successor_id TEXT NOT NULL,
  dependency_type TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (predecessor_id) REFERENCES task_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (successor_id) REFERENCES task_templates(id) ON DELETE CASCADE,
  UNIQUE(predecessor_id, successor_id)
);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_account_id ON task_dependencies(identity_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_predecessor ON task_dependencies(predecessor_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_successor ON task_dependencies(successor_id);

-- Task Statistics Table
CREATE TABLE IF NOT EXISTS task_statistics (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL UNIQUE,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  pending_tasks INTEGER DEFAULT 0,
  overdue_tasks INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);
`;
