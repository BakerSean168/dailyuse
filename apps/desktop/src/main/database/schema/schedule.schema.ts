/**
 * @file Schedule Schema
 * @description Schedule 模块表定义
 */

import type Database from 'better-sqlite3';
import { SCHEDULE_MODULE_SCHEMA } from '@dailyuse/schedule/infrastructure-server';

/**
 * @function initializeScheduleTables
 * @description 初始化日程模块表结构
 * @param {Database.Database} database - 数据库实例
 */
export function initializeScheduleTables(database: Database.Database): void {
  database.exec(SCHEDULE_MODULE_SCHEMA);

  console.log('[Database] Schedule tables initialized');
}
