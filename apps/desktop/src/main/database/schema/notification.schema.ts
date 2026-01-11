/**
 * @file Notification Schema
 * @description Notification 模块表定义
 */

import type Database from 'better-sqlite3';

/**
 * @function initializeNotificationTables
 * @description 初始化通知模块表结构
 * @param {Database.Database} database - 数据库实例
 */
export function initializeNotificationTables(database: Database.Database): void {
  // notifications 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      uuid TEXT PRIMARY KEY,
      account_uuid TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT,
      source_module TEXT,
      source_entity_id TEXT,
      priority TEXT NOT NULL DEFAULT 'NORMAL',
      status TEXT NOT NULL DEFAULT 'UNREAD',
      read_at INTEGER,
      dismissed_at INTEGER,
      action_taken TEXT,
      expires_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
    )
  `);

  // notification_preferences 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      uuid TEXT PRIMARY KEY,
      account_uuid TEXT UNIQUE NOT NULL,
      global_enabled INTEGER NOT NULL DEFAULT 1,
      sound_enabled INTEGER NOT NULL DEFAULT 1,
      desktop_enabled INTEGER NOT NULL DEFAULT 1,
      email_enabled INTEGER NOT NULL DEFAULT 0,
      channel_settings TEXT NOT NULL DEFAULT '{}',
      quiet_hours TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
    )
  `);

  // notification_templates 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS notification_templates (
      uuid TEXT PRIMARY KEY,
      type TEXT UNIQUE NOT NULL,
      title_template TEXT NOT NULL,
      message_template TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'NORMAL',
      sound TEXT,
      icon TEXT,
      actions TEXT DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // 创建索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_notifications_account ON notifications(account_uuid);
    CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
  `);

  console.log('[Database] Notification tables initialized');
}
