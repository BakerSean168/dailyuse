/**
 * @file Reminder Schema
 * @description Reminder 模块表定义
 */

import type Database from 'better-sqlite3';

/**
 * @function initializeReminderTables
 * @description 初始化提醒模块表结构
 * @param {Database.Database} database - 数据库实例
 */
export function initializeReminderTables(database: Database.Database): void {
  // reminder_groups 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS reminder_groups (
      id TEXT PRIMARY KEY,
      identity_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT,
      icon TEXT,
      control_mode TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL,
      order_idx INTEGER NOT NULL DEFAULT 0,
      stats TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  // reminder_templates 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS reminder_templates (
      id TEXT PRIMARY KEY,
      identity_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      self_enabled INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL,
      group_id TEXT,
      importance_level TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      color TEXT,
      icon TEXT,
      next_trigger_at INTEGER,
      
      -- Trigger 配置 (JSON)
      trigger TEXT NOT NULL,
      recurrence TEXT,
      active_time TEXT NOT NULL,
      active_hours TEXT,
      notification_config TEXT NOT NULL,
      stats TEXT NOT NULL DEFAULT '{}',
      
      -- Smart Frequency: Response Metrics
      click_rate REAL,
      ignore_rate REAL,
      avg_response_time INTEGER,
      snooze_count INTEGER DEFAULT 0,
      effectiveness_score REAL,
      sample_size INTEGER DEFAULT 0,
      last_analysis_time INTEGER,
      
      -- Smart Frequency: Frequency Adjustment
      original_interval INTEGER,
      adjusted_interval INTEGER,
      adjustment_reason TEXT,
      adjustment_time INTEGER,
      is_auto_adjusted INTEGER DEFAULT 0,
      user_confirmed INTEGER DEFAULT 0,
      smart_frequency_enabled INTEGER DEFAULT 1,
      
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      
      FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES reminder_groups(id)
    )
  `);

  // reminder_instances 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS reminder_instances (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      identity_id TEXT NOT NULL,
      trigger_at INTEGER NOT NULL,
      status TEXT NOT NULL,
      result TEXT,
      processed_at INTEGER,
      note TEXT,
      payload TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (template_id) REFERENCES reminder_templates(id) ON DELETE CASCADE,
      FOREIGN KEY (identity_id) REFERENCES accounts(id)
    )
  `);

  // reminder_statistics 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS reminder_statistics (
      id TEXT PRIMARY KEY,
      identity_id TEXT UNIQUE NOT NULL,
      template_stats TEXT NOT NULL,
      group_stats TEXT NOT NULL,
      trigger_stats TEXT NOT NULL,
      calculated_at INTEGER NOT NULL,
      FOREIGN KEY (identity_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  // reminder_history 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS reminder_history (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      triggered_at INTEGER NOT NULL,
      result TEXT NOT NULL,
      error TEXT,
      notification_sent INTEGER NOT NULL DEFAULT 0,
      notification_channel TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (template_id) REFERENCES reminder_templates(id) ON DELETE CASCADE
    )
  `);

  // reminder_responses 表 (Smart Frequency)
  database.exec(`
    CREATE TABLE IF NOT EXISTS reminder_responses (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('clicked', 'ignored', 'snoozed', 'dismissed', 'completed')),
      response_time INTEGER,
      timestamp INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (template_id) REFERENCES reminder_templates(id) ON DELETE CASCADE
    )
  `);

  // 创建索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_reminder_groups_account ON reminder_groups(identity_id);
    CREATE INDEX IF NOT EXISTS idx_reminder_templates_account ON reminder_templates(identity_id);
    CREATE INDEX IF NOT EXISTS idx_reminder_templates_status ON reminder_templates(status);
    CREATE INDEX IF NOT EXISTS idx_reminder_templates_group ON reminder_templates(group_id);
    CREATE INDEX IF NOT EXISTS idx_reminder_instances_template ON reminder_instances(template_id);
    CREATE INDEX IF NOT EXISTS idx_reminder_instances_trigger ON reminder_instances(trigger_at);
    CREATE INDEX IF NOT EXISTS idx_reminder_history_template ON reminder_history(template_id);
    CREATE INDEX IF NOT EXISTS idx_reminder_responses_template ON reminder_responses(template_id, timestamp);
  `);

  console.log('[Database] Reminder tables initialized');
}
