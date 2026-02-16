/**
 * @file Repository Schema
 * @description Repository 知识库模块表定义
 */

import type Database from 'better-sqlite3';

/**
 * @function initializeRepositoryTables
 * @description 初始化知识库模块表结构
 * @param {Database.Database} database - 数据库实例
 */
export function initializeRepositoryTables(database: Database.Database): void {
  // repositories 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS repositories (
      id TEXT PRIMARY KEY,
      identity_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      path TEXT NOT NULL,
      description TEXT,
      config TEXT DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  // resources 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      repository_id TEXT NOT NULL,
      identity_id TEXT NOT NULL,
      folder_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      path TEXT NOT NULL,
      size INTEGER,
      content TEXT,
      metadata TEXT,
      tags TEXT DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
      FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (folder_id) REFERENCES folders(id)
    )
  `);

  // folders 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      repository_id TEXT NOT NULL,
      parent_id TEXT,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      color TEXT,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES folders(id)
    )
  `);

  // repository_statistics 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS repository_statistics (
      id TEXT PRIMARY KEY,
      identity_id TEXT UNIQUE NOT NULL,
      total_repositories INTEGER DEFAULT 0,
      total_resources INTEGER DEFAULT 0,
      total_folders INTEGER DEFAULT 0,
      total_size INTEGER DEFAULT 0,
      calculated_at INTEGER NOT NULL,
      FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  // 创建索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_repositories_account ON repositories(identity_id);
    CREATE INDEX IF NOT EXISTS idx_resources_repository ON resources(repository_id);
    CREATE INDEX IF NOT EXISTS idx_resources_folder ON resources(folder_id);
    CREATE INDEX IF NOT EXISTS idx_folders_repository ON folders(repository_id);
    CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
  `);

  console.log('[Database] Repository tables initialized');
}
