/**
 * @file AI Schema
 * @description AI 模块表定义
 */

import type Database from 'better-sqlite3';

/**
 * @function initializeAITables
 * @description 初始化AI模块表结构
 * @param {Database.Database} database - 数据库实例
 */
export function initializeAITables(database: Database.Database): void {
  // ai_conversations 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      identity_id TEXT NOT NULL,
      title TEXT NOT NULL,
      context TEXT NOT NULL,
      messages TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  // ai_generation_tasks 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS ai_generation_tasks (
      id TEXT PRIMARY KEY,
      identity_id TEXT NOT NULL,
      type TEXT NOT NULL,
      prompt TEXT NOT NULL,
      result TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      error TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      completed_at INTEGER,
      FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  // ai_usage_quotas 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS ai_usage_quotas (
      id TEXT PRIMARY KEY,
      identity_id TEXT UNIQUE NOT NULL,
      daily_limit INTEGER NOT NULL DEFAULT 100,
      daily_used INTEGER NOT NULL DEFAULT 0,
      monthly_limit INTEGER NOT NULL DEFAULT 3000,
      monthly_used INTEGER NOT NULL DEFAULT 0,
      last_reset_date INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  // ai_provider_configs 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS ai_provider_configs (
      id TEXT PRIMARY KEY,
      identity_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      api_key TEXT NOT NULL,
      model TEXT,
      config TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  // 创建索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_ai_conversations_account ON ai_conversations(identity_id);
    CREATE INDEX IF NOT EXISTS idx_ai_generation_tasks_account ON ai_generation_tasks(identity_id);
    CREATE INDEX IF NOT EXISTS idx_ai_generation_tasks_status ON ai_generation_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_ai_provider_configs_account ON ai_provider_configs(identity_id);
  `);

  console.log('[Database] AI tables initialized');
}
