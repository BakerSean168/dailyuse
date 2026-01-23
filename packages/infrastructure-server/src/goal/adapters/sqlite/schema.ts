/**
 * SQLite Database Schema - Goal Module
 * 目标模块数据库架构
 */

export const GOAL_MODULE_SCHEMA = `
-- Goals Table
CREATE TABLE IF NOT EXISTS goals (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  folder_uuid TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  progress_percentage REAL DEFAULT 0,
  start_date INTEGER,
  target_date INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_goals_account_uuid ON goals(account_uuid);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_folder_uuid ON goals(folder_uuid);

-- Goal Statistics Table
CREATE TABLE IF NOT EXISTS goal_statistics (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL UNIQUE,
  total_goals INTEGER DEFAULT 0,
  active_goals INTEGER DEFAULT 0,
  completed_goals INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

-- Goal Folders Table
CREATE TABLE IF NOT EXISTS goal_folders (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_goal_folders_account_uuid ON goal_folders(account_uuid);

-- Focus Sessions Table
CREATE TABLE IF NOT EXISTS focus_sessions (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  goal_uuid TEXT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  duration_minutes INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
  FOREIGN KEY (goal_uuid) REFERENCES goals(uuid) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_account_uuid ON focus_sessions(account_uuid);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_goal_uuid ON focus_sessions(goal_uuid);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_status ON focus_sessions(status);

-- Focus Modes Table
CREATE TABLE IF NOT EXISTS focus_modes (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  start_time INTEGER,
  end_time INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_focus_modes_account_uuid ON focus_modes(account_uuid);

-- Weight Snapshots Table
CREATE TABLE IF NOT EXISTS weight_snapshots (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  goal_uuid TEXT,
  key_result_uuid TEXT,
  weight_value REAL NOT NULL,
  recorded_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
  FOREIGN KEY (goal_uuid) REFERENCES goals(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_weight_snapshots_account_uuid ON weight_snapshots(account_uuid);
CREATE INDEX IF NOT EXISTS idx_weight_snapshots_goal_uuid ON weight_snapshots(goal_uuid);
CREATE INDEX IF NOT EXISTS idx_weight_snapshots_recorded_at ON weight_snapshots(recorded_at);
`;
