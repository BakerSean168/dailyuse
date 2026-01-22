/**
 * SQLite Database Schema - Task Module
 * 任务模块数据库架构
 */

export const TASK_MODULE_SCHEMA = `
-- Task Instances Table
CREATE TABLE IF NOT EXISTS task_instances (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  template_uuid TEXT NOT NULL,
  scheduled_date INTEGER NOT NULL,
  actual_date INTEGER,
  status TEXT NOT NULL DEFAULT 'PENDING',
  duration_minutes INTEGER,
  notes TEXT,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
  FOREIGN KEY (template_uuid) REFERENCES task_templates(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_instances_account_uuid ON task_instances(account_uuid);
CREATE INDEX IF NOT EXISTS idx_task_instances_template_uuid ON task_instances(template_uuid);
CREATE INDEX IF NOT EXISTS idx_task_instances_status ON task_instances(status);
CREATE INDEX IF NOT EXISTS idx_task_instances_scheduled_date ON task_instances(scheduled_date);

-- Task Templates Table
CREATE TABLE IF NOT EXISTS task_templates (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  folder_uuid TEXT,
  name TEXT NOT NULL,
  description TEXT,
  estimated_duration INTEGER,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  tags TEXT,
  goal_uuid TEXT,
  is_recurring INTEGER DEFAULT 0,
  recurrence_pattern TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_templates_account_uuid ON task_templates(account_uuid);
CREATE INDEX IF NOT EXISTS idx_task_templates_status ON task_templates(status);
CREATE INDEX IF NOT EXISTS idx_task_templates_folder_uuid ON task_templates(folder_uuid);

-- Task Dependencies Table
CREATE TABLE IF NOT EXISTS task_dependencies (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  predecessor_uuid TEXT NOT NULL,
  successor_uuid TEXT NOT NULL,
  dependency_type TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
  FOREIGN KEY (predecessor_uuid) REFERENCES task_templates(uuid) ON DELETE CASCADE,
  FOREIGN KEY (successor_uuid) REFERENCES task_templates(uuid) ON DELETE CASCADE,
  UNIQUE(predecessor_uuid, successor_uuid)
);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_account_uuid ON task_dependencies(account_uuid);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_predecessor ON task_dependencies(predecessor_uuid);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_successor ON task_dependencies(successor_uuid);

-- Task Statistics Table
CREATE TABLE IF NOT EXISTS task_statistics (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL UNIQUE,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  pending_tasks INTEGER DEFAULT 0,
  overdue_tasks INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);
`;
