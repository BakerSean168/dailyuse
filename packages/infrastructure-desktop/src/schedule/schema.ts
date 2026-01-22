/**
 * SQLite Database Schema - Schedule Module
 * 日程模块数据库架构
 */

export const SCHEDULE_MODULE_SCHEMA = `
-- Schedules Table
CREATE TABLE IF NOT EXISTS schedules (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  title TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  is_all_day INTEGER DEFAULT 0,
  description TEXT,
  location TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_schedules_account_uuid ON schedules(account_uuid);
CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON schedules(start_time);
CREATE INDEX IF NOT EXISTS idx_schedules_end_time ON schedules(end_time);

-- Schedule Tasks Table
CREATE TABLE IF NOT EXISTS schedule_tasks (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  schedule_uuid TEXT NOT NULL,
  source_module TEXT NOT NULL,
  source_entity TEXT NOT NULL,
  source_uuid TEXT NOT NULL,
  due_date INTEGER,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
  FOREIGN KEY (schedule_uuid) REFERENCES schedules(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_schedule_tasks_account_uuid ON schedule_tasks(account_uuid);
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_schedule_uuid ON schedule_tasks(schedule_uuid);
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_status ON schedule_tasks(status);
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_source ON schedule_tasks(source_module, source_entity);

-- Schedule Executions Table
CREATE TABLE IF NOT EXISTS schedule_executions (
  uuid TEXT PRIMARY KEY,
  task_uuid TEXT NOT NULL,
  executed_at INTEGER NOT NULL,
  result TEXT,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (task_uuid) REFERENCES schedule_tasks(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_schedule_executions_task_uuid ON schedule_executions(task_uuid);
CREATE INDEX IF NOT EXISTS idx_schedule_executions_executed_at ON schedule_executions(executed_at);

-- Schedule Statistics Table
CREATE TABLE IF NOT EXISTS schedule_statistics (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL UNIQUE,
  total_schedules INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  pending_tasks INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);
`;
