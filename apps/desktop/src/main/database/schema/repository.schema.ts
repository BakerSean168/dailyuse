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
      uuid TEXT PRIMARY KEY,
      account_uuid TEXT NOT NULL,
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
      FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
    )
  `);

  // resources 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      uuid TEXT PRIMARY KEY,
      repository_uuid TEXT NOT NULL,
      account_uuid TEXT NOT NULL,
      folder_uuid TEXT,
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
      FOREIGN KEY (repository_uuid) REFERENCES repositories(uuid) ON DELETE CASCADE,
      FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
      FOREIGN KEY (folder_uuid) REFERENCES folders(uuid)
    )
  `);

  // folders 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      uuid TEXT PRIMARY KEY,
      repository_uuid TEXT NOT NULL,
      parent_uuid TEXT,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      color TEXT,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      FOREIGN KEY (repository_uuid) REFERENCES repositories(uuid) ON DELETE CASCADE,
      FOREIGN KEY (parent_uuid) REFERENCES folders(uuid)
    )
  `);

  // repository_statistics 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS repository_statistics (
      uuid TEXT PRIMARY KEY,
      account_uuid TEXT UNIQUE NOT NULL,
      total_repositories INTEGER DEFAULT 0,
      total_resources INTEGER DEFAULT 0,
      total_folders INTEGER DEFAULT 0,
      total_size INTEGER DEFAULT 0,
      calculated_at INTEGER NOT NULL,
      FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
    )
  `);

  // 创建索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_repositories_account ON repositories(account_uuid);
    CREATE INDEX IF NOT EXISTS idx_resources_repository ON resources(repository_uuid);
    CREATE INDEX IF NOT EXISTS idx_resources_folder ON resources(folder_uuid);
    CREATE INDEX IF NOT EXISTS idx_folders_repository ON folders(repository_uuid);
    CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_uuid);
  `);

  console.log('[Database] Repository tables initialized');
}
