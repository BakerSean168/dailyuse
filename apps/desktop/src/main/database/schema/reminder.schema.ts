/**
 * @file Reminder Schema
 * @description Reminder 模块表定义
 */

import type Database from 'better-sqlite3';
import { REMINDER_MODULE_SCHEMA } from '@dailyuse/reminder/schema';

/**
 * @function initializeReminderTables
 * @description 初始化提醒模块表结构
 * @param {Database.Database} database - 数据库实例
 */
export function initializeReminderTables(database: Database.Database): void {
  database.exec(REMINDER_MODULE_SCHEMA);

  console.log('[Database] Reminder tables initialized');
}
