/**
 * SQLite Database Schema - Editor Module
 * 缂栬緫鍣ㄦā鍧楁暟鎹簱鏋舵瀯
 */

export const EDITOR_MODULE_SCHEMA = `
-- Editor Sessions Table
CREATE TABLE IF NOT EXISTS editor_sessions (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES editor_workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_editor_sessions_account_id ON editor_sessions(identity_id);
CREATE INDEX IF NOT EXISTS idx_editor_sessions_workspace_id ON editor_sessions(workspace_id);

-- Linked Resources Table
CREATE TABLE IF NOT EXISTS linked_resources (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  source_document_id TEXT NOT NULL,
  target_document_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  is_valid INTEGER DEFAULT 1,
  needs_verification INTEGER DEFAULT 0,
  verified_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (source_document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (target_document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_linked_resources_source ON linked_resources(source_document_id);
CREATE INDEX IF NOT EXISTS idx_linked_resources_target ON linked_resources(target_document_id);
CREATE INDEX IF NOT EXISTS idx_linked_resources_is_valid ON linked_resources(is_valid);

-- Search Engines Table
CREATE TABLE IF NOT EXISTS search_engines (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OUTDATED',
  last_indexed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES editor_workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_search_engines_workspace_id ON search_engines(workspace_id);
CREATE INDEX IF NOT EXISTS idx_search_engines_status ON search_engines(status);

-- Editor Workspaces Table
CREATE TABLE IF NOT EXISTS editor_workspaces (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_editor_workspaces_account_id ON editor_workspaces(identity_id);

-- Editor Tabs Table
CREATE TABLE IF NOT EXISTS editor_tabs (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  tab_index INTEGER NOT NULL,
  is_pinned INTEGER DEFAULT 0,
  is_dirty INTEGER DEFAULT 0,
  last_accessed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (group_id) REFERENCES editor_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_editor_tabs_group_id ON editor_tabs(group_id);
CREATE INDEX IF NOT EXISTS idx_editor_tabs_document_id ON editor_tabs(document_id);
CREATE INDEX IF NOT EXISTS idx_editor_tabs_is_pinned ON editor_tabs(is_pinned);

-- Editor Groups Table
CREATE TABLE IF NOT EXISTS editor_groups (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  group_index INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES editor_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_editor_groups_session_id ON editor_groups(session_id);

-- Document Versions Table
CREATE TABLE IF NOT EXISTS document_versions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  change_type TEXT NOT NULL,
  content TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_change_type ON document_versions(change_type);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  path TEXT,
  content_hash TEXT,
  index_status TEXT NOT NULL DEFAULT 'NOT_INDEXED',
  last_modified_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES editor_workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_documents_account_id ON documents(identity_id);
CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_index_status ON documents(index_status);
`;
