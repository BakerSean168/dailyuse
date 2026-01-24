/**
 * SQLite Database Schema - Editor Module
 * 缂栬緫鍣ㄦā鍧楁暟鎹簱鏋舵瀯
 */

export const EDITOR_MODULE_SCHEMA = `
-- Editor Sessions Table
CREATE TABLE IF NOT EXISTS editor_sessions (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  workspace_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
  FOREIGN KEY (workspace_uuid) REFERENCES editor_workspaces(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_editor_sessions_account_uuid ON editor_sessions(account_uuid);
CREATE INDEX IF NOT EXISTS idx_editor_sessions_workspace_uuid ON editor_sessions(workspace_uuid);

-- Linked Resources Table
CREATE TABLE IF NOT EXISTS linked_resources (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  source_document_uuid TEXT NOT NULL,
  target_document_uuid TEXT NOT NULL,
  source_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  is_valid INTEGER DEFAULT 1,
  needs_verification INTEGER DEFAULT 0,
  verified_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
  FOREIGN KEY (source_document_uuid) REFERENCES documents(uuid) ON DELETE CASCADE,
  FOREIGN KEY (target_document_uuid) REFERENCES documents(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_linked_resources_source ON linked_resources(source_document_uuid);
CREATE INDEX IF NOT EXISTS idx_linked_resources_target ON linked_resources(target_document_uuid);
CREATE INDEX IF NOT EXISTS idx_linked_resources_is_valid ON linked_resources(is_valid);

-- Search Engines Table
CREATE TABLE IF NOT EXISTS search_engines (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  workspace_uuid TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OUTDATED',
  last_indexed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
  FOREIGN KEY (workspace_uuid) REFERENCES editor_workspaces(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_search_engines_workspace_uuid ON search_engines(workspace_uuid);
CREATE INDEX IF NOT EXISTS idx_search_engines_status ON search_engines(status);

-- Editor Workspaces Table
CREATE TABLE IF NOT EXISTS editor_workspaces (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_editor_workspaces_account_uuid ON editor_workspaces(account_uuid);

-- Editor Tabs Table
CREATE TABLE IF NOT EXISTS editor_tabs (
  uuid TEXT PRIMARY KEY,
  group_uuid TEXT NOT NULL,
  document_uuid TEXT NOT NULL,
  tab_index INTEGER NOT NULL,
  is_pinned INTEGER DEFAULT 0,
  is_dirty INTEGER DEFAULT 0,
  last_accessed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (group_uuid) REFERENCES editor_groups(uuid) ON DELETE CASCADE,
  FOREIGN KEY (document_uuid) REFERENCES documents(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_editor_tabs_group_uuid ON editor_tabs(group_uuid);
CREATE INDEX IF NOT EXISTS idx_editor_tabs_document_uuid ON editor_tabs(document_uuid);
CREATE INDEX IF NOT EXISTS idx_editor_tabs_is_pinned ON editor_tabs(is_pinned);

-- Editor Groups Table
CREATE TABLE IF NOT EXISTS editor_groups (
  uuid TEXT PRIMARY KEY,
  session_uuid TEXT NOT NULL,
  group_index INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (session_uuid) REFERENCES editor_sessions(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_editor_groups_session_uuid ON editor_groups(session_uuid);

-- Document Versions Table
CREATE TABLE IF NOT EXISTS document_versions (
  uuid TEXT PRIMARY KEY,
  document_uuid TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  change_type TEXT NOT NULL,
  content TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (document_uuid) REFERENCES documents(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_uuid ON document_versions(document_uuid);
CREATE INDEX IF NOT EXISTS idx_document_versions_change_type ON document_versions(change_type);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  workspace_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  path TEXT,
  content_hash TEXT,
  index_status TEXT NOT NULL DEFAULT 'NOT_INDEXED',
  last_modified_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
  FOREIGN KEY (workspace_uuid) REFERENCES editor_workspaces(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_documents_account_uuid ON documents(account_uuid);
CREATE INDEX IF NOT EXISTS idx_documents_workspace_uuid ON documents(workspace_uuid);
CREATE INDEX IF NOT EXISTS idx_documents_index_status ON documents(index_status);
`;
