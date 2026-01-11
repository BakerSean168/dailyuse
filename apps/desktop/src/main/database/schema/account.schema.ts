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
      uuid TEXT PRIMARY KEY,
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
      uuid TEXT PRIMARY KEY,
      account_uuid TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
    )
  `);

  // Sessions 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      uuid TEXT PRIMARY KEY,
      account_uuid TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      device_info TEXT,
      ip_address TEXT,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
    )
  `);

  // Settings 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      uuid TEXT PRIMARY KEY,
      account_uuid TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(account_uuid, key)
    )
  `);

  // 创建索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_uuid);
    CREATE INDEX IF NOT EXISTS idx_settings_account ON settings(account_uuid);
  `);

  console.log('[Database] Account & Auth tables initialized');
}
