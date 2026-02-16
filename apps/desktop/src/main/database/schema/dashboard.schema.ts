/**
 * @file Dashboard Schema
 * @description Dashboard 模块表定义
 */

import type Database from 'better-sqlite3';

/**
 * @function initializeDashboardTables
 * @description 初始化仪表盘模块表结构
 * @param {Database.Database} database - 数据库实例
 */
export function initializeDashboardTables(database: Database.Database): void {
  // dashboard_configs 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS dashboard_configs (
      id TEXT PRIMARY KEY,
      identity_id TEXT UNIQUE NOT NULL,
      layout TEXT NOT NULL DEFAULT '[]',
      widgets TEXT NOT NULL DEFAULT '[]',
      theme TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  console.log('[Database] Dashboard tables initialized');
}
