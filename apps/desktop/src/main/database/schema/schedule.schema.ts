/**
 * @file Schedule Schema
 * @description Schedule 模块表定义
 */

import type Database from 'better-sqlite3';

/**
 * @function initializeScheduleTables
 * @description 初始化日程模块表结构
 * @param {Database.Database} database - 数据库实例
 */
export function initializeScheduleTables(database: Database.Database): void {
  // schedule_tasks 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS schedule_tasks (
      uuid TEXT PRIMARY KEY,
      account_uuid TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      source_module TEXT NOT NULL,
      source_entity_id TEXT NOT NULL,
      status TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      cron_expression TEXT,
      timezone TEXT NOT NULL DEFAULT 'UTC',
      start_date INTEGER,
      end_date INTEGER,
      max_executions INTEGER,
      next_run_at INTEGER,
      last_run_at INTEGER,
      execution_count INTEGER DEFAULT 0,
      last_execution_status TEXT,
      last_execution_duration INTEGER,
      consecutive_failures INTEGER DEFAULT 0,
      max_retries INTEGER NOT NULL DEFAULT 3,
      initial_delay_ms INTEGER NOT NULL DEFAULT 1000,
      max_delay_ms INTEGER NOT NULL DEFAULT 60000,
      backoff_multiplier REAL NOT NULL DEFAULT 2.0,
      retryable_statuses TEXT DEFAULT '[]',
      payload TEXT,
      tags TEXT DEFAULT '[]',
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      timeout INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
    )
  `);

  // schedules 表 (个人日程安排)
  database.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      uuid TEXT PRIMARY KEY,
      account_uuid TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      has_conflict INTEGER DEFAULT 0,
      conflicting_schedules TEXT,
      priority INTEGER,
      location TEXT,
      attendees TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
    )
  `);

  // schedule_executions 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS schedule_executions (
      uuid TEXT PRIMARY KEY,
      task_uuid TEXT NOT NULL,
      execution_time INTEGER NOT NULL,
      status TEXT NOT NULL,
      duration INTEGER,
      result TEXT,
      error TEXT,
      retry_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (task_uuid) REFERENCES schedule_tasks(uuid) ON DELETE CASCADE
    )
  `);

  // schedule_statistics 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS schedule_statistics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_uuid TEXT UNIQUE NOT NULL,
      total_tasks INTEGER DEFAULT 0,
      active_tasks INTEGER DEFAULT 0,
      paused_tasks INTEGER DEFAULT 0,
      completed_tasks INTEGER DEFAULT 0,
      cancelled_tasks INTEGER DEFAULT 0,
      failed_tasks INTEGER DEFAULT 0,
      total_executions INTEGER DEFAULT 0,
      successful_executions INTEGER DEFAULT 0,
      failed_executions INTEGER DEFAULT 0,
      skipped_executions INTEGER DEFAULT 0,
      timeout_executions INTEGER DEFAULT 0,
      avg_execution_duration REAL DEFAULT 0,
      min_execution_duration REAL DEFAULT 0,
      max_execution_duration REAL DEFAULT 0,
      module_statistics TEXT DEFAULT '{}',
      last_updated_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
    )
  `);

  // 创建索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_schedule_tasks_account ON schedule_tasks(account_uuid);
    CREATE INDEX IF NOT EXISTS idx_schedule_tasks_status ON schedule_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_schedule_tasks_next_run ON schedule_tasks(next_run_at);
    CREATE INDEX IF NOT EXISTS idx_schedules_account ON schedules(account_uuid);
    CREATE INDEX IF NOT EXISTS idx_schedules_time ON schedules(start_time, end_time);
    CREATE INDEX IF NOT EXISTS idx_schedule_executions_task ON schedule_executions(task_uuid);
  `);

  console.log('[Database] Schedule tables initialized');
}
