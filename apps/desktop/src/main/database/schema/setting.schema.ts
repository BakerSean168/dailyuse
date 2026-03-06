/**
 * @file Setting Schema
 * @description Setting 模块表定义
 */

import type Database from 'better-sqlite3';
import { SETTING_MODULE_SCHEMA } from '@dailyuse/setting/schema';

/**
 * @function initializeSettingTables
 * @description 初始化设置模块表结构
 * @param {Database.Database} database - 数据库实例
 */
export function initializeSettingTables(database: Database.Database): void {
  database.exec(SETTING_MODULE_SCHEMA);

  console.log('[Database] Setting tables initialized');
}
