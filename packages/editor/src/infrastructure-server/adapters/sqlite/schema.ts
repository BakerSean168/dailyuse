/**
 * SQLite Database Schema - Editor Module
 */

export const EDITOR_MODULE_SCHEMA = `
-- Editor Workspaces Table
CREATE TABLE IF NOT EXISTS editor_workspaces (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  project_path TEXT,
  project_type TEXT DEFAULT 'Other',
  layout TEXT,
  settings TEXT,
  is_active INTEGER DEFAULT 1,
  last_active_session_id TEXT,
  last_accessed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_editor_workspaces_identity_id ON editor_workspaces(identity_id);

-- Editor Sessions Table
CREATE TABLE IF NOT EXISTS editor_sessions (
  id TEXT PRIMARY KEY,
  identity_id TEXT,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  layout TEXT,
  active_group_index INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  last_accessed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES editor_workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_editor_sessions_workspace_id ON editor_sessions(workspace_id);

-- Editor Groups Table
CREATE TABLE IF NOT EXISTS editor_groups (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  workspace_id TEXT,
  identity_id TEXT,
  group_index INTEGER NOT NULL,
  active_tab_index INTEGER DEFAULT -1,
  name TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES editor_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_editor_groups_session_id ON editor_groups(session_id);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  identity_id TEXT,
  workspace_id TEXT NOT NULL,
  name TEXT,
  path TEXT,
  content TEXT,
  content_hash TEXT,
  file_size INTEGER,
  language TEXT DEFAULT 'Other',
  index_status TEXT NOT NULL DEFAULT 'NOT_INDEXED',
  last_indexed_at INTEGER,
  last_modified_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES editor_workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_index_status ON documents(index_status);
CREATE INDEX IF NOT EXISTS idx_documents_content_hash ON documents(content_hash);

-- Document Versions Table
CREATE TABLE IF NOT EXISTS document_versions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  workspace_id TEXT,
  identity_id TEXT,
  version_number INTEGER NOT NULL,
  change_type TEXT NOT NULL,
  content TEXT,
  content_hash TEXT,
  content_diff TEXT,
  change_description TEXT,
  previous_version_id TEXT,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_change_type ON document_versions(change_type);

-- Editor Tabs Table
CREATE TABLE IF NOT EXISTS editor_tabs (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  session_id TEXT,
  workspace_id TEXT,
  identity_id TEXT,
  document_id TEXT NOT NULL,
  tab_index INTEGER NOT NULL,
  tab_type TEXT DEFAULT 'Document',
  name TEXT DEFAULT 'Untitled',
  view_state TEXT,
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

-- Linked Resources Table
CREATE TABLE IF NOT EXISTS linked_resources (
  id TEXT PRIMARY KEY,
  workspace_id TEXT,
  identity_id TEXT,
  source_document_id TEXT NOT NULL,
  target_document_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  source_line INTEGER,
  source_column INTEGER,
  target_path TEXT,
  target_anchor TEXT,
  is_valid INTEGER DEFAULT 1,
  last_verified_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (source_document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (target_document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_linked_resources_source ON linked_resources(source_document_id);
CREATE INDEX IF NOT EXISTS idx_linked_resources_target ON linked_resources(target_document_id);
CREATE INDEX IF NOT EXISTS idx_linked_resources_is_valid ON linked_resources(is_valid);

-- Search Engines Table
CREATE TABLE IF NOT EXISTS search_engines (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  identity_id TEXT,
  name TEXT,
  description TEXT,
  index_path TEXT,
  index_size INTEGER DEFAULT 0,
  indexed_document_count INTEGER DEFAULT 0,
  total_document_count INTEGER DEFAULT 0,
  is_indexing INTEGER DEFAULT 0,
  index_progress REAL,
  last_indexed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES editor_workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_search_engines_workspace_id ON search_engines(workspace_id);
`;
