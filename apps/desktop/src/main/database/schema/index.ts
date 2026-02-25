/**
 * @file Schema Entry Point
 * @description 统一导出所有模块的 Schema 初始化函数
 *
 * 架构说明：
 * - 每个模块对应一个独立的 schema 文件
 * - 遵循 Package-First 架构，与 @dailyuse/domain-* 包对齐
 * - 便于团队协作和独立维护
 */

import type Database from 'better-sqlite3';

export { initializeAccountTables } from './account.schema';
export { initializeGoalTables } from './goal.schema';
export { initializeTaskTables } from './task.schema';
export { initializeScheduleTables } from './schedule.schema';
export { initializeReminderTables } from './reminder.schema';
export { initializeAITables } from './ai.schema';
export { initializeNotificationTables } from './notification.schema';
export { initializeDashboardTables } from './dashboard.schema';
export { initializeRepositoryTables } from './repository.schema';
export { initializeSettingTables } from './setting.schema';

import { initializeAccountTables } from './account.schema';
import { initializeGoalTables } from './goal.schema';
import { initializeTaskTables } from './task.schema';
import { initializeScheduleTables } from './schedule.schema';
import { initializeReminderTables } from './reminder.schema';
import { initializeAITables } from './ai.schema';
import { initializeNotificationTables } from './notification.schema';
import { initializeDashboardTables } from './dashboard.schema';
import { initializeRepositoryTables } from './repository.schema';
import { initializeSettingTables } from './setting.schema';

/**
 * @function initializeAllTables
 * @description 初始化所有模块的数据库表
 *
 * 执行顺序：
 * 1. Account & Auth (基础设施，其他模块依赖)
 * 2. Goal (核心业务模块)
 * 3. Task (核心业务模块)
 * 4. Schedule (核心业务模块)
 * 5. Reminder (核心业务模块)
 * 6. AI (支持模块)
 * 7. Notification (支持模块)
 * 8. Dashboard (支持模块)
 * 9. Repository (支持模块)
 * 10. Setting (支持模块)
 *
 * @param {Database.Database} database - 数据库实例
 */
export function initializeAllTables(database: Database.Database): void {
  console.log('[Database] Initializing all module tables...');

  // Core Infrastructure
  initializeAccountTables(database);

  // Core Business Modules
  initializeGoalTables(database);
  initializeTaskTables(database);
  initializeScheduleTables(database);
  initializeReminderTables(database);

  // Support Modules
  initializeAITables(database);
  initializeNotificationTables(database);
  initializeDashboardTables(database);
  initializeRepositoryTables(database);
  initializeSettingTables(database);

  console.log('[Database] ✅ All module tables initialized successfully');
}
