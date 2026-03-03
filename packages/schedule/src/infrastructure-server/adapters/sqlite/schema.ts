/**
 * SQLite Database Schema - Schedule Module
 */

export const SCHEDULE_MODULE_SCHEMA = `
-- Schedules Table
CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  is_all_day INTEGER DEFAULT 0,
  description TEXT,
  location TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_schedules_account_id ON schedules(identity_id);
CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON schedules(start_time);
CREATE INDEX IF NOT EXISTS idx_schedules_end_time ON schedules(end_time);

-- Schedule Tasks Table
CREATE TABLE IF NOT EXISTS schedule_tasks (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_module TEXT NOT NULL,
  source_entity_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  enabled INTEGER NOT NULL DEFAULT 1,
  cron_expression TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Shanghai',
  start_date INTEGER,
  end_date INTEGER,
  max_executions INTEGER,
  next_run_at INTEGER,
  last_run_at INTEGER,
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_execution_status TEXT,
  last_execution_duration INTEGER,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  initial_delay_ms INTEGER NOT NULL DEFAULT 0,
  max_delay_ms INTEGER NOT NULL DEFAULT 0,
  backoff_multiplier REAL NOT NULL DEFAULT 1,
  retryable_statuses TEXT NOT NULL DEFAULT '[]',
  payload TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  priority INTEGER NOT NULL DEFAULT 0,
  timeout INTEGER,
  version INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_schedule_tasks_identity_id ON schedule_tasks(identity_id);
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_status ON schedule_tasks(status);
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_source ON schedule_tasks(source_module, source_entity_id);
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_next_run ON schedule_tasks(next_run_at);
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_enabled ON schedule_tasks(enabled);

-- Schedule Executions Table
CREATE TABLE IF NOT EXISTS schedule_executions (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  execution_time INTEGER NOT NULL,
  status TEXT NOT NULL,
  duration INTEGER,
  result TEXT,
  error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (task_id) REFERENCES schedule_tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_schedule_executions_task_id ON schedule_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_schedule_executions_execution_time ON schedule_executions(execution_time);
CREATE INDEX IF NOT EXISTS idx_schedule_executions_status ON schedule_executions(status);
`;
