/**
 * @file Goal Schema
 * @description Goal 模块表定义
 */

import type Database from 'better-sqlite3';
import { GOAL_MODULE_SCHEMA } from '@dailyuse/goal/infrastructure-server';

/**
 * @function initializeGoalTables
 * @description 初始化目标模块表结构
 * @param {Database.Database} database - 数据库实例
 */
export function initializeGoalTables(database: Database.Database): void {
  database.exec(GOAL_MODULE_SCHEMA);

  console.log('[Database] Goal tables initialized');
}
