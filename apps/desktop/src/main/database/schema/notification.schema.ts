/**
 * @file Notification Schema
 * @description Notification 模块表定义
 */

import type Database from 'better-sqlite3';
import { NOTIFICATION_MODULE_SCHEMA } from '@dailyuse/notification/infrastructure-server';

/**
 * @function initializeNotificationTables
 * @description 初始化通知模块表结构
 * @param {Database.Database} database - 数据库实例
 */
export function initializeNotificationTables(database: Database.Database): void {
  database.exec(NOTIFICATION_MODULE_SCHEMA);

  console.log('[Database] Notification tables initialized');
}
