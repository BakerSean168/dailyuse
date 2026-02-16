/**
 * @file Setting Schema
 * @description Setting 模块表定义
 */

import type Database from 'better-sqlite3';

/**
 * @function initializeSettingTables
 * @description 初始化设置模块表结构
 * @param {Database.Database} database - 数据库实例
 */
export function initializeSettingTables(database: Database.Database): void {
  // user_settings 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      identity_id TEXT UNIQUE NOT NULL,
      theme TEXT DEFAULT 'light',
      language TEXT DEFAULT 'en',
      timezone TEXT DEFAULT 'UTC',
      date_format TEXT DEFAULT 'YYYY-MM-DD',
      time_format TEXT DEFAULT '24h',
      first_day_of_week TEXT DEFAULT 'monday',
      notification_settings TEXT DEFAULT '{}',
      privacy_settings TEXT DEFAULT '{}',
      accessibility_settings TEXT DEFAULT '{}',
      experimental_features TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  console.log('[Database] Setting tables initialized');
}
