/**
 * @file Goal Schema
 * @description Goal 模块表定义
 */

import type Database from 'better-sqlite3';

/**
 * @function initializeGoalTables
 * @description 初始化目标模块表结构
 * @param {Database.Database} database - 数据库实例
 */
export function initializeGoalTables(database: Database.Database): void {
  // Goals 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      uuid TEXT PRIMARY KEY,
      account_uuid TEXT NOT NULL,
      folder_uuid TEXT,
      parent_goal_uuid TEXT,
      title TEXT NOT NULL,
      description TEXT,
      color TEXT,
      feasibility_analysis TEXT,
      motivation TEXT,
      status TEXT DEFAULT 'ACTIVE',
      importance TEXT DEFAULT 'MEDIUM',
      urgency TEXT DEFAULT 'MEDIUM',
      category TEXT,
      tags TEXT,
      start_date INTEGER,
      target_date INTEGER,
      completed_at INTEGER,
      archived_at INTEGER,
      sort_order INTEGER DEFAULT 0,
      reminder_config TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      FOREIGN KEY (folder_uuid) REFERENCES goal_folders(uuid)
    )
  `);

  // Goal Folders 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS goal_folders (
      uuid TEXT PRIMARY KEY,
      account_uuid TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT,
      icon TEXT,
      parent_folder_uuid TEXT,
      sort_order INTEGER DEFAULT 0,
      is_system_folder INTEGER DEFAULT 0,
      folder_type TEXT,
      goal_count INTEGER DEFAULT 0,
      completed_goal_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      FOREIGN KEY (parent_folder_uuid) REFERENCES goal_folders(uuid)
    )
  `);

  // Key Results 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS key_results (
      uuid TEXT PRIMARY KEY,
      goal_uuid TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      progress TEXT NOT NULL,
      weight REAL DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (goal_uuid) REFERENCES goals(uuid) ON DELETE CASCADE
    )
  `);

  // Goal Reviews 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS goal_reviews (
      uuid TEXT PRIMARY KEY,
      goal_uuid TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      rating INTEGER,
      achievements TEXT,
      challenges TEXT,
      next_actions TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (goal_uuid) REFERENCES goals(uuid) ON DELETE CASCADE
    )
  `);

  // Goal Records 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS goal_records (
      uuid TEXT PRIMARY KEY,
      goal_uuid TEXT NOT NULL,
      key_result_uuid TEXT,
      value REAL NOT NULL,
      note TEXT,
      recorded_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (goal_uuid) REFERENCES goals(uuid) ON DELETE CASCADE,
      FOREIGN KEY (key_result_uuid) REFERENCES key_results(uuid) ON DELETE SET NULL
    )
  `);

  // Goal Statistics 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS goal_statistics (
      account_uuid TEXT PRIMARY KEY,
      total_goals INTEGER DEFAULT 0,
      active_goals INTEGER DEFAULT 0,
      completed_goals INTEGER DEFAULT 0,
      archived_goals INTEGER DEFAULT 0,
      overdue_goals INTEGER DEFAULT 0,
      total_key_results INTEGER DEFAULT 0,
      completed_key_results INTEGER DEFAULT 0,
      average_progress REAL DEFAULT 0,
      goals_by_importance TEXT,
      goals_by_urgency TEXT,
      goals_by_category TEXT,
      goals_by_status TEXT,
      goals_created_this_week INTEGER DEFAULT 0,
      goals_completed_this_week INTEGER DEFAULT 0,
      goals_created_this_month INTEGER DEFAULT 0,
      goals_completed_this_month INTEGER DEFAULT 0,
      total_reviews INTEGER DEFAULT 0,
      average_rating REAL,
      last_calculated_at INTEGER NOT NULL
    )
  `);

  // 创建索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_goals_account ON goals(account_uuid);
    CREATE INDEX IF NOT EXISTS idx_goals_folder ON goals(folder_uuid);
    CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
    CREATE INDEX IF NOT EXISTS idx_key_results_goal ON key_results(goal_uuid);
    CREATE INDEX IF NOT EXISTS idx_goal_reviews_goal ON goal_reviews(goal_uuid);
    CREATE INDEX IF NOT EXISTS idx_goal_records_goal ON goal_records(goal_uuid);
  `);

  console.log('[Database] Goal tables initialized');
}
