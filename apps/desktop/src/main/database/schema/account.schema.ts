/**
 * @file Account & Auth Schema
 * @description Account, Auth Credentials, Auth Sessions 表定义
 */

import type Database from 'better-sqlite3';

/**
 * @function initializeAccountTables
 * @description 初始化账号和认证模块表结构
 * @param {Database.Database} database - 数据库实例
 */
export function initializeAccountTables(database: Database.Database): void {
  // Accounts 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      display_name TEXT,
      avatar_url TEXT,
      locale TEXT DEFAULT 'en',
      timezone TEXT DEFAULT 'UTC',
      status TEXT DEFAULT 'ACTIVE',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Auth Credentials 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS auth_credentials (
      id TEXT PRIMARY KEY,
      identity_id TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  // Sessions 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      identity_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      device_info TEXT,
      ip_address TEXT,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  // Settings 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      identity_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(identity_id, key)
    )
  `);

  // 创建索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(identity_id);
    CREATE INDEX IF NOT EXISTS idx_settings_account ON settings(identity_id);
  `);

  console.log('[Database] Account & Auth tables initialized');
}
