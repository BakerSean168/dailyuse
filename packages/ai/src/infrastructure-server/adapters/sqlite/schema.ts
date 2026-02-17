/**
 * SQLite Database Schema - AI Module
 * AI 妯″潡鏁版嵁搴撴灦鏋?
 */

export const AI_MODULE_SCHEMA = `
-- AI Generation Tasks Table
CREATE TABLE IF NOT EXISTS ai_generation_tasks (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  input_data TEXT,
  output_data TEXT,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  token_usage TEXT,
  processing_ms INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_generation_tasks_account_id ON ai_generation_tasks(identity_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_tasks_status ON ai_generation_tasks(status);

-- Knowledge Generation Tasks Table
CREATE TABLE IF NOT EXISTS knowledge_generation_tasks (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  document_count INTEGER NOT NULL DEFAULT 5,
  target_audience TEXT,
  folder_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  progress INTEGER NOT NULL DEFAULT 0,
  generated_document_ids TEXT NOT NULL DEFAULT '[]',
  error TEXT,
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_knowledge_generation_tasks_account_id ON knowledge_generation_tasks(identity_id);

-- AI Conversations Table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  message_count INTEGER NOT NULL DEFAULT 0,
  last_message_at INTEGER,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_account_id ON ai_conversations(identity_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_status ON ai_conversations(status);

-- AI Messages Table
CREATE TABLE IF NOT EXISTS ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  token_usage TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages(created_at);

-- AI Usage Quotas Table
CREATE TABLE IF NOT EXISTS ai_usage_quotas (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL UNIQUE,
  quota_limit INTEGER NOT NULL DEFAULT 50,
  current_usage INTEGER NOT NULL DEFAULT 0,
  reset_period TEXT NOT NULL DEFAULT 'Daily',
  last_reset_at INTEGER NOT NULL,
  next_reset_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_quotas_identity_id ON ai_usage_quotas(identity_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_quotas_next_reset_at ON ai_usage_quotas(next_reset_at);

-- AI Provider Configs Table
CREATE TABLE IF NOT EXISTS ai_provider_configs (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  default_model TEXT,
  available_models TEXT NOT NULL DEFAULT '[]',
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 100,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_provider_configs_account_id ON ai_provider_configs(identity_id);
CREATE INDEX IF NOT EXISTS idx_ai_provider_configs_is_default ON ai_provider_configs(is_default);
CREATE INDEX IF NOT EXISTS idx_ai_provider_configs_priority ON ai_provider_configs(priority);
`;
