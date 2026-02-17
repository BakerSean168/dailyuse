/**
 * SQLite Database Schema - Repository Module
 */

export const REPOSITORY_MODULE_SCHEMA = `
-- Repository Table
CREATE TABLE IF NOT EXISTS repositories (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  config JSON,
  stats JSON,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_repositories_account_id
ON repositories(identity_id);

CREATE INDEX IF NOT EXISTS idx_repositories_status
ON repositories(status);

-- Resource Table
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  repository_id TEXT NOT NULL,
  folder_id TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  path TEXT NOT NULL,
  size INTEGER,
  content TEXT,
  metadata JSON,
  stats JSON,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resources_repository_id
ON resources(repository_id);

CREATE INDEX IF NOT EXISTS idx_resources_folder_id
ON resources(folder_id);

CREATE INDEX IF NOT EXISTS idx_resources_path
ON resources(path);

-- Folder Table
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  repository_id TEXT NOT NULL,
  parent_id TEXT,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_folders_repository_id
ON folders(repository_id);

CREATE INDEX IF NOT EXISTS idx_folders_parent_id
ON folders(parent_id);

-- Repository Statistics Table
CREATE TABLE IF NOT EXISTS repository_statistics (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL UNIQUE,
  total_repositories INTEGER DEFAULT 0,
  active_repositories INTEGER DEFAULT 0,
  archived_repositories INTEGER DEFAULT 0,
  total_resources INTEGER DEFAULT 0,
  total_folders INTEGER DEFAULT 0,
  total_tags INTEGER DEFAULT 0,
  total_storage_bytes INTEGER DEFAULT 0,
  last_updated_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_repository_statistics_account_id
ON repository_statistics(identity_id);
`;