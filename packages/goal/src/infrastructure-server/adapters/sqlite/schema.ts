/**
 * SQLite Database Schema - Goal Module
 * 目标模块数据库架构
 *
 * 列名使用 snake_case，与 SQLite 约定一致
 * 时间戳使用 INTEGER（毫秒级 epoch）
 * 布尔值使用 INTEGER（0/1）
 * JSON 数据使用 TEXT
 */

export const GOAL_MODULE_SCHEMA = `
-- ============================================================
-- Goals Table (聚合根)
-- ============================================================
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#4A90D9',
  feasibility_analysis TEXT,
  motivation TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  importance TEXT NOT NULL DEFAULT 'MEDIUM',
  priority INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  tags TEXT DEFAULT '[]',
  start_date INTEGER,
  target_date INTEGER,
  completed_at INTEGER,
  archived_at INTEGER,
  folder_id TEXT,
  parent_goal_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  reminder_config TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_goals_identity_id ON goals(identity_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_folder_id ON goals(folder_id);
CREATE INDEX IF NOT EXISTS idx_goals_parent_goal_id ON goals(parent_goal_id);

-- ============================================================
-- Key Results Table (实体，属于 Goal 聚合)
-- ============================================================
CREATE TABLE IF NOT EXISTS key_results (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  progress TEXT NOT NULL DEFAULT '{}',
  weight REAL NOT NULL DEFAULT 1.0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_key_results_goal_id ON key_results(goal_id);

-- ============================================================
-- Goal Reviews Table (实体，属于 Goal 聚合)
-- ============================================================
CREATE TABLE IF NOT EXISTS goal_reviews (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL,
  type TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 3,
  summary TEXT NOT NULL DEFAULT '',
  achievements TEXT,
  challenges TEXT,
  improvements TEXT,
  key_result_snapshots TEXT DEFAULT '[]',
  reviewed_at INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_goal_reviews_goal_id ON goal_reviews(goal_id);

-- ============================================================
-- Goal Records Table (进度记录，属于 KeyResult)
-- ============================================================
CREATE TABLE IF NOT EXISTS goal_records (
  id TEXT PRIMARY KEY,
  key_result_id TEXT NOT NULL,
  value REAL NOT NULL DEFAULT 0,
  note TEXT,
  recorded_at INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (key_result_id) REFERENCES key_results(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_goal_records_key_result_id ON goal_records(key_result_id);
CREATE INDEX IF NOT EXISTS idx_goal_records_recorded_at ON goal_records(recorded_at);

-- ============================================================
-- Goal Statistics Table (统计聚合)
-- ============================================================
CREATE TABLE IF NOT EXISTS goal_statistics (
  identity_id TEXT PRIMARY KEY,
  total_goals INTEGER DEFAULT 0,
  active_goals INTEGER DEFAULT 0,
  completed_goals INTEGER DEFAULT 0,
  archived_goals INTEGER DEFAULT 0,
  overdue_goals INTEGER DEFAULT 0,
  total_key_results INTEGER DEFAULT 0,
  completed_key_results INTEGER DEFAULT 0,
  average_progress REAL DEFAULT 0,
  goals_by_importance TEXT DEFAULT '{}',
  goals_by_category TEXT DEFAULT '{}',
  goals_by_status TEXT DEFAULT '{}',
  goals_created_this_week INTEGER DEFAULT 0,
  goals_completed_this_week INTEGER DEFAULT 0,
  goals_created_this_month INTEGER DEFAULT 0,
  goals_completed_this_month INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  average_rating REAL DEFAULT 0,
  last_calculated_at INTEGER NOT NULL
);

-- ============================================================
-- Goal Folders Table (聚合根)
-- ============================================================
CREATE TABLE IF NOT EXISTS goal_folders (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  parent_folder_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  folder_type TEXT,
  goal_count INTEGER NOT NULL DEFAULT 0,
  completed_goal_count INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (parent_folder_id) REFERENCES goal_folders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_goal_folders_identity_id ON goal_folders(identity_id);
CREATE INDEX IF NOT EXISTS idx_goal_folders_parent_folder_id ON goal_folders(parent_folder_id);

-- ============================================================
-- Focus Sessions Table (聚合根)
-- ============================================================
CREATE TABLE IF NOT EXISTS focus_sessions (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  goal_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  duration_minutes INTEGER NOT NULL,
  actual_duration_minutes INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  started_at INTEGER,
  paused_at INTEGER,
  resumed_at INTEGER,
  completed_at INTEGER,
  cancelled_at INTEGER,
  pause_count INTEGER NOT NULL DEFAULT 0,
  paused_duration_minutes INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_identity_id ON focus_sessions(identity_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_goal_id ON focus_sessions(goal_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_status ON focus_sessions(status);

-- ============================================================
-- Focus Modes Table (值对象)
-- ============================================================
CREATE TABLE IF NOT EXISTS focus_modes (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  hidden_goals_mode TEXT NOT NULL DEFAULT 'hide',
  is_active INTEGER NOT NULL DEFAULT 1,
  actual_end_time INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_focus_modes_identity_id ON focus_modes(identity_id);
CREATE INDEX IF NOT EXISTS idx_focus_modes_is_active ON focus_modes(is_active);

-- ============================================================
-- Focus Mode Goals Table (关联表：FocusMode <-> Goal)
-- ============================================================
CREATE TABLE IF NOT EXISTS focus_mode_goals (
  focus_mode_id TEXT NOT NULL,
  goal_id TEXT NOT NULL,
  PRIMARY KEY (focus_mode_id, goal_id),
  FOREIGN KEY (focus_mode_id) REFERENCES focus_modes(id) ON DELETE CASCADE,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);

-- ============================================================
-- Weight Snapshots Table (值对象)
-- ============================================================
CREATE TABLE IF NOT EXISTS weight_snapshots (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL,
  key_result_id TEXT NOT NULL,
  old_weight REAL NOT NULL,
  new_weight REAL NOT NULL,
  weight_delta REAL NOT NULL,
  snapshot_time INTEGER NOT NULL,
  trigger TEXT NOT NULL DEFAULT 'MANUAL',
  reason TEXT,
  operator_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  FOREIGN KEY (key_result_id) REFERENCES key_results(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_weight_snapshots_goal_id ON weight_snapshots(goal_id);
CREATE INDEX IF NOT EXISTS idx_weight_snapshots_key_result_id ON weight_snapshots(key_result_id);
CREATE INDEX IF NOT EXISTS idx_weight_snapshots_snapshot_time ON weight_snapshots(snapshot_time);
`;

