/**
 * @file Sync Schema
 * @description EPIC-004: Offline Sync 同步基础设施表定义
 */

import type Database from 'better-sqlite3';

/**
 * @function initializeSyncTables
 * @description 初始化同步相关表结构
 * EPIC-004: Offline Sync - 多设备数据同步
 * @param {Database.Database} database - 数据库实例
 */
export function initializeSyncTables(database: Database.Database): void {
  // sync_log 表 - 记录所有本地变更
  database.exec(`
    CREATE TABLE IF NOT EXISTS sync_log (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
      payload TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      device_id TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      version INTEGER NOT NULL,
      sync_error TEXT,
      retry_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // sync_log 索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_sync_log_synced ON sync_log(synced);
    CREATE INDEX IF NOT EXISTS idx_sync_log_entity ON sync_log(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_sync_log_timestamp ON sync_log(timestamp);
    CREATE INDEX IF NOT EXISTS idx_sync_log_device ON sync_log(device_id);
  `);

  // devices 表 - 设备注册信息
  database.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      device_name TEXT NOT NULL,
      platform TEXT NOT NULL,
      app_version TEXT,
      last_sync_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `);

  // sync_state 表 - 同步状态 (单例)
  database.exec(`
    CREATE TABLE IF NOT EXISTS sync_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_state TEXT DEFAULT 'idle',
      pending_count INTEGER DEFAULT 0,
      last_sync_version INTEGER DEFAULT 0,
      last_sync_at INTEGER,
      last_error TEXT,
      updated_at INTEGER NOT NULL
    )
  `);

  // 初始化 sync_state 默认行
  database.exec(`
    INSERT OR IGNORE INTO sync_state (id, current_state, pending_count, updated_at)
    VALUES (1, 'idle', 0, ${Date.now()})
  `);

  // conflict_records 表 - 冲突记录
  database.exec(`
    CREATE TABLE IF NOT EXISTS conflict_records (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      local_data TEXT NOT NULL,
      server_data TEXT NOT NULL,
      conflicting_fields TEXT NOT NULL,
      resolution TEXT,
      resolved_at INTEGER,
      resolved_by TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  // conflict_records 索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_conflict_unresolved ON conflict_records(entity_type) WHERE resolved_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_conflict_entity ON conflict_records(entity_type, entity_id);
  `);

  // sync_settings 表 - 同步设置
  database.exec(`
    CREATE TABLE IF NOT EXISTS sync_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      enabled INTEGER DEFAULT 1,
      auto_sync INTEGER DEFAULT 1,
      wifi_only INTEGER DEFAULT 0,
      conflict_notification TEXT DEFAULT 'taskbar',
      manual_sync_interval INTEGER DEFAULT 0,
      updated_at INTEGER NOT NULL
    )
  `);

  // 初始化 sync_settings 默认行
  database.exec(`
    INSERT OR IGNORE INTO sync_settings (id, updated_at)
    VALUES (1, ${Date.now()})
  `);

  // app_config 表 - 应用配置 (用于存储设备 ID 等)
  database.exec(`
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  console.log('[Database] Sync tables initialized (EPIC-004)');
}
