/**
 * @file Repository Schema
 * @description Repository 知识库模块表定义
 */

import type Database from 'better-sqlite3';
import { REPOSITORY_MODULE_SCHEMA } from '@dailyuse/repository/infrastructure-server';

/**
 * @function initializeRepositoryTables
 * @description 初始化知识库模块表结构
 * @param {Database.Database} database - 数据库实例
 */
export function initializeRepositoryTables(database: Database.Database): void {
  database.exec(REPOSITORY_MODULE_SCHEMA);

  console.log('[Database] Repository tables initialized');
}
