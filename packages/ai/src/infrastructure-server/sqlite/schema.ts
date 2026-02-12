/**
 * SQLite Database Schema - AI Module
 * AI 妯″潡鏁版嵁搴撴灦鏋?
 */

export const AI_MODULE_SCHEMA = `
-- AI Generation Tasks Table
CREATE TABLE IF NOT EXISTS ai_generation_tasks (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  input_data TEXT,
  output_data TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_generation_tasks_account_uuid ON ai_generation_tasks(account_uuid);
CREATE INDEX IF NOT EXISTS idx_ai_generation_tasks_status ON ai_generation_tasks(status);

-- Knowledge Generation Tasks Table
CREATE TABLE IF NOT EXISTS knowledge_generation_tasks (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_knowledge_generation_tasks_account_uuid ON knowledge_generation_tasks(account_uuid);

-- AI Conversations Table
CREATE TABLE IF NOT EXISTS ai_conversations (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_account_uuid ON ai_conversations(account_uuid);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_status ON ai_conversations(status);

-- AI Usage Quotas Table
CREATE TABLE IF NOT EXISTS ai_usage_quotas (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL UNIQUE,
  monthly_limit INTEGER NOT NULL DEFAULT 1000,
  used_count INTEGER DEFAULT 0,
  reset_date INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

-- AI Provider Configs Table
CREATE TABLE IF NOT EXISTS ai_provider_configs (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_provider_configs_account_uuid ON ai_provider_configs(account_uuid);
`;
