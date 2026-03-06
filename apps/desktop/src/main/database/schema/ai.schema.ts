/**
 * @file AI Schema
 * @description AI 模块表定义
 */

import type Database from 'better-sqlite3';
import { AI_MODULE_SCHEMA } from '@dailyuse/ai/schema';

/**
 * @function initializeAITables
 * @description 初始化AI模块表结构
 * @param {Database.Database} database - 数据库实例
 */
export function initializeAITables(database: Database.Database): void {
  database.exec(AI_MODULE_SCHEMA);

  console.log('[Database] AI tables initialized');
}
