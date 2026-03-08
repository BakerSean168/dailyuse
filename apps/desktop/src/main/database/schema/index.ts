/**
 * @file Schema Entry Point
 * @description Unified SQLite schema initialization for desktop.
 *
 * Canonical table definitions live inside packages. The desktop app keeps only
 * this orchestration layer so local development can recreate the database from
 * package-owned schemas without carrying module-specific DDL or legacy patches.
 */

import type Database from 'better-sqlite3';
import { ACCOUNT_MODULE_SCHEMA } from '@dailyuse/account/schema';
import { GOAL_MODULE_SCHEMA } from '@dailyuse/goal/schema';
import { TASK_MODULE_SCHEMA } from '@dailyuse/task/schema';
import { SCHEDULE_MODULE_SCHEMA } from '@dailyuse/schedule/schema';
import { REMINDER_MODULE_SCHEMA } from '@dailyuse/reminder/schema';
import { AI_MODULE_SCHEMA } from '@dailyuse/ai/schema';
import { NOTIFICATION_MODULE_SCHEMA } from '@dailyuse/notification/schema';
import { REPOSITORY_MODULE_SCHEMA } from '@dailyuse/repository/schema';
import { SETTING_MODULE_SCHEMA } from '@dailyuse/setting/schema';
import { AUTHENTICATION_MODULE_SCHEMA } from '@dailyuse/authentication/schema';
import { DASHBOARD_MODULE_SCHEMA } from '@dailyuse/database/dashboard-schema';

export const DESKTOP_SQLITE_SCHEMA_VERSION = '2026-03-08-package-owned-schema-v1';

function execSchema(database: Database.Database, schema: string, label: string): void {
  database.exec(schema);
  console.log(`[Database] ${label} tables initialized`);
}

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
  execSchema(database, ACCOUNT_MODULE_SCHEMA, 'Account');
  execSchema(database, AUTHENTICATION_MODULE_SCHEMA, 'Authentication');

  // Core Business Modules
  execSchema(database, GOAL_MODULE_SCHEMA, 'Goal');
  execSchema(database, TASK_MODULE_SCHEMA, 'Task');
  execSchema(database, SCHEDULE_MODULE_SCHEMA, 'Schedule');
  execSchema(database, REMINDER_MODULE_SCHEMA, 'Reminder');

  // Support Modules
  execSchema(database, AI_MODULE_SCHEMA, 'AI');
  execSchema(database, NOTIFICATION_MODULE_SCHEMA, 'Notification');
  execSchema(database, DASHBOARD_MODULE_SCHEMA, 'Dashboard');
  execSchema(database, REPOSITORY_MODULE_SCHEMA, 'Repository');
  execSchema(database, SETTING_MODULE_SCHEMA, 'Setting');

  console.log('[Database] ✅ All module tables initialized successfully');
}
