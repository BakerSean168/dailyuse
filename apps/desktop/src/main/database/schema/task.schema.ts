/**
 * @file Task Schema
 * @description Task 模块表定义
 */

import type Database from 'better-sqlite3';

/**
 * @function initializeTaskTables
 * @description 初始化任务模块表结构
 * @param {Database.Database} database - 数据库实例
 */
export function initializeTaskTables(database: Database.Database): void {
  // task_templates 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS task_templates (
      uuid TEXT PRIMARY KEY,
      account_uuid TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      task_type TEXT NOT NULL CHECK (task_type IN ('ONE_TIME', 'RECURRING')),
      status TEXT NOT NULL,
      importance INTEGER NOT NULL DEFAULT 2,
      urgency INTEGER NOT NULL DEFAULT 2,
      color TEXT,
      tags TEXT,
      folder_uuid TEXT,
      goal_uuid TEXT,
      key_result_uuid TEXT,
      parent_task_uuid TEXT,
      
      -- 一次性任务字段
      start_date INTEGER,
      due_date INTEGER,
      completed_at INTEGER,
      estimated_minutes INTEGER,
      actual_minutes INTEGER,
      note TEXT,
      
      -- 循环任务字段
      last_generated_date INTEGER,
      generate_ahead_days INTEGER,
      
      -- 时间配置
      time_config_type TEXT,
      time_config_start_time INTEGER,
      time_config_end_time INTEGER,
      time_config_duration_minutes INTEGER,
      
      -- 重复规则
      recurrence_rule_type TEXT,
      recurrence_rule_interval INTEGER,
      recurrence_rule_days_of_week TEXT,
      recurrence_rule_day_of_month INTEGER,
      recurrence_rule_month_of_year INTEGER,
      recurrence_rule_end_date INTEGER,
      recurrence_rule_count INTEGER,
      
      -- 提醒配置
      reminder_config_enabled INTEGER DEFAULT 0,
      reminder_config_time_offset_minutes INTEGER,
      reminder_config_unit TEXT,
      reminder_config_method TEXT,
      
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      
      FOREIGN KEY (goal_uuid) REFERENCES goals(uuid),
      FOREIGN KEY (parent_task_uuid) REFERENCES task_templates(uuid)
    )
  `);

  // task_instances 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS task_instances (
      uuid TEXT PRIMARY KEY,
      template_uuid TEXT NOT NULL,
      account_uuid TEXT NOT NULL,
      instance_date INTEGER NOT NULL,
      status TEXT NOT NULL,
      note TEXT,
      actual_start_time INTEGER,
      actual_end_time INTEGER,
      time_config TEXT NOT NULL,
      completion_record TEXT,
      skip_record TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (template_uuid) REFERENCES task_templates(uuid) ON DELETE CASCADE,
      FOREIGN KEY (account_uuid) REFERENCES accounts(uuid)
    )
  `);

  // task_statistics 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS task_statistics (
      uuid TEXT PRIMARY KEY,
      account_uuid TEXT UNIQUE NOT NULL,
      calculated_at INTEGER NOT NULL,
      template_total INTEGER DEFAULT 0,
      template_active INTEGER DEFAULT 0,
      template_paused INTEGER DEFAULT 0,
      template_archived INTEGER DEFAULT 0,
      template_one_time INTEGER DEFAULT 0,
      template_recurring INTEGER DEFAULT 0,
      instance_total INTEGER DEFAULT 0,
      instance_today INTEGER DEFAULT 0,
      instance_week INTEGER DEFAULT 0,
      instance_month INTEGER DEFAULT 0,
      instance_pending INTEGER DEFAULT 0,
      instance_in_progress INTEGER DEFAULT 0,
      instance_completed INTEGER DEFAULT 0,
      instance_skipped INTEGER DEFAULT 0,
      instance_expired INTEGER DEFAULT 0,
      completion_today INTEGER DEFAULT 0,
      completion_week INTEGER DEFAULT 0,
      completion_month INTEGER DEFAULT 0,
      completion_total INTEGER DEFAULT 0,
      completion_avg_time REAL,
      completion_rate REAL DEFAULT 0,
      time_all_day INTEGER DEFAULT 0,
      time_point INTEGER DEFAULT 0,
      time_range INTEGER DEFAULT 0,
      time_overdue INTEGER DEFAULT 0,
      time_upcoming INTEGER DEFAULT 0,
      distribution_by_importance TEXT,
      distribution_by_urgency TEXT,
      distribution_by_folder TEXT,
      distribution_by_tag TEXT,
      FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
    )
  `);

  // task_dependencies 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS task_dependencies (
      uuid TEXT PRIMARY KEY,
      predecessor_task_uuid TEXT NOT NULL,
      successor_task_uuid TEXT NOT NULL,
      dependency_type TEXT DEFAULT 'FINISH_TO_START',
      lag_days INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (predecessor_task_uuid) REFERENCES task_templates(uuid) ON DELETE CASCADE,
      FOREIGN KEY (successor_task_uuid) REFERENCES task_templates(uuid) ON DELETE CASCADE,
      UNIQUE(predecessor_task_uuid, successor_task_uuid)
    )
  `);

  // task_template_history 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS task_template_history (
      uuid TEXT PRIMARY KEY,
      template_uuid TEXT NOT NULL,
      action TEXT NOT NULL,
      changes TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (template_uuid) REFERENCES task_templates(uuid) ON DELETE CASCADE
    )
  `);

  // 创建索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_task_templates_account ON task_templates(account_uuid);
    CREATE INDEX IF NOT EXISTS idx_task_templates_status ON task_templates(status);
    CREATE INDEX IF NOT EXISTS idx_task_templates_type ON task_templates(task_type);
    CREATE INDEX IF NOT EXISTS idx_task_templates_goal ON task_templates(goal_uuid);
    CREATE INDEX IF NOT EXISTS idx_task_instances_template ON task_instances(template_uuid);
    CREATE INDEX IF NOT EXISTS idx_task_instances_date ON task_instances(instance_date);
    CREATE INDEX IF NOT EXISTS idx_task_instances_status ON task_instances(status);
    CREATE INDEX IF NOT EXISTS idx_task_dependencies_successor ON task_dependencies(successor_task_uuid);
    CREATE INDEX IF NOT EXISTS idx_task_history_template ON task_template_history(template_uuid);
  `);

  console.log('[Database] Task tables initialized');
}
