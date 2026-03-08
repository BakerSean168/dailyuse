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
  path TEXT,
  status TEXT NOT NULL,
  config JSON,
  stats JSON,
  related_goals TEXT,
  git TEXT,
  sync_status TEXT,
  last_accessed_at INTEGER,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_repositories_account_id
ON repositories(identity_id);

CREATE INDEX IF NOT EXISTS idx_repositories_status
ON repositories(status);

-- Resource Table
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  repository_id TEXT NOT NULL,
  identity_id TEXT,
  folder_id TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  path TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  content TEXT,
  metadata JSON,
  stats JSON,
  description TEXT,
  author TEXT,
  version TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  category TEXT,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  modified_at INTEGER,
  deleted_at INTEGER,
  FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resources_repository_id
ON resources(repository_id);

CREATE INDEX IF NOT EXISTS idx_resources_identity_id
ON resources(identity_id);

CREATE INDEX IF NOT EXISTS idx_resources_folder_id
ON resources(folder_id);

CREATE INDEX IF NOT EXISTS idx_resources_path
ON resources(path);

CREATE INDEX IF NOT EXISTS idx_resources_status
ON resources(status);

CREATE INDEX IF NOT EXISTS idx_resources_category
ON resources(category);

-- Folder Table
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  repository_id TEXT NOT NULL,
  identity_id TEXT,
  parent_id TEXT,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_expanded INTEGER NOT NULL DEFAULT 1,
  metadata JSON NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_folders_repository_id
ON folders(repository_id);

CREATE INDEX IF NOT EXISTS idx_folders_identity_id
ON folders(identity_id);

CREATE INDEX IF NOT EXISTS idx_folders_parent_id
ON folders(parent_id);

CREATE INDEX IF NOT EXISTS idx_folders_path
ON folders(path);
`;