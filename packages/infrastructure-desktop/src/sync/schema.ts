/**
 * SQLite Database Schema - Sync Module
 * 同步模块数据库架构
 */

export const SYNC_MODULE_SCHEMA = `
-- Sync Conflicts Table
CREATE TABLE IF NOT EXISTS sync_conflicts (
  uuid TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_uuid TEXT NOT NULL,
  conflict_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNRESOLVED',
  auto_resolvable INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_session_id ON sync_conflicts(session_id);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_entity_type ON sync_conflicts(entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_status ON sync_conflicts(status);

-- Sync Sessions Table
CREATE TABLE IF NOT EXISTS sync_sessions (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  error_message TEXT,
  sync_type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sync_sessions_account_uuid ON sync_sessions(account_uuid);
CREATE INDEX IF NOT EXISTS idx_sync_sessions_status ON sync_sessions(status);

-- Sync Profiles Table
CREATE TABLE IF NOT EXISTS sync_profiles (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  sync_interval INTEGER NOT NULL,
  conflict_resolution_strategy TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  last_sync_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sync_profiles_account_uuid ON sync_profiles(account_uuid);

-- Pending Changes Table
CREATE TABLE IF NOT EXISTS pending_changes (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_uuid TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data TEXT,
  new_data TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  sync_status TEXT NOT NULL DEFAULT 'PENDING',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pending_changes_account_uuid ON pending_changes(account_uuid);
CREATE INDEX IF NOT EXISTS idx_pending_changes_entity ON pending_changes(entity_type, entity_uuid);
CREATE INDEX IF NOT EXISTS idx_pending_changes_sync_status ON pending_changes(sync_status);
`;
