/**
 * @file Task Schema
 * @description Task 模块表定义
 */

import type Database from 'better-sqlite3';
import { TASK_MODULE_SCHEMA } from '@dailyuse/task/schema';

/**
 * @function initializeTaskTables
 * @description 初始化任务模块表结构
 * @param {Database.Database} database - 数据库实例
 */
export function initializeTaskTables(database: Database.Database): void {
  database.exec(TASK_MODULE_SCHEMA);

  console.log('[Database] Task tables initialized');
}
