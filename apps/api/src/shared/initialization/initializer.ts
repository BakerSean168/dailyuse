/**
 * @file initializer.ts
 * @description 应用初始化管理器，负责协调各模块的启动和生命周期管理。
 * @date 2025-01-22
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';

// 每个模块的初始化任务

// 已实现的模块
import { registerAuthenticationInitializationTasks } from '../../modules/authentication/initialization/authenticationInitialization';
import { registerGoalInitializationTasks } from '../../modules/goal/initialization/goalInitialization';
// import { registerScheduleInitializationTasks } from '../../modules/schedule/initialization/scheduleInitialization';
import { registerDashboardInitializationTasks } from '../../modules/dashboard/initialization/dashboardInitialization';
import { registerReminderInitializationTasks } from '../../modules/reminder/initialization/reminderInitialization';

// TODO: 以下模块尚未实现，待实现后取消注释
// import { registerAccountInitializationTasks } from '../../modules/account';
// import { registerGoalInitializationTasks } from '../../modules/goal';
// import { registerNotificationInitializationTasks } from '../../modules/notification/initialization/notificationInitialization';
// import { registerSettingInitializationTasks } from '../../modules/setting/initialization/settingInitialization';
// import { registerThemeInitializationTasks } from '../../modules/theme/initialization/themeInitialization';
// import { registerTaskInitializationTasks } from '../../modules/Task/initialization/taskInitialization';
// import { registerGoalInitializationTasks } from '../../modules/goal/initialization/goalInitialization';
// import { registerSessionLoggingInitializationTasks } from '../../modules/SessionLogging/initialization/sessionLoggingInitialization';
// import { registerRepositoryInitializationTasks } from '../../modules/Repository/initialization/repositoryInitialization';
// import { registerReminderInitializationTasks } from '../../modules/Reminder/initialization/reminderInitialization';
// import { registerInitializationEventsTask } from './application/events/initializationEventHandlers';

/**
 * 基础设施模块的初始化任务
 */
// 数据库初始化
// const databaseInitTask: InitializationTask = {
//   name: 'database',
//   phase: InitializationPhase.APP_STARTUP,
//   priority: 5,
//   initialize: async () => {
//     await initializeDatabase();
//     console.log('✓ Database initialized');
//   }
// };

// const eventSystemInitTask: InitializationTask = {
//   name: 'eventSystem',
//   phase: InitializationPhase.APP_STARTUP,
//   priority: 10,
//   initialize: async () => {
//     await initializeUnifiedEventHandlers();
//     console.log('✓ Event system initialized');
//   },
// };

/**
 * 注册所有模块的初始化任务。
 *
 * @remarks
 * 调用各模块的注册函数，将任务添加到 InitializationManager 中。
 */
export function registerAllInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 注册各模块的任务
  registerAuthenticationInitializationTasks(); // ✅ 已实现（事件处理器）
  registerGoalInitializationTasks(); // ✅ 已实现（Goal 统计事件处理器）
  // registerScheduleInitializationTasks(); // TODO: scheduleInitialization 文件缺失
  registerDashboardInitializationTasks(); // ✅ 已实现（Dashboard 缓存失效监听器）
  registerReminderInitializationTasks(); // ✅ 新增（Reminder SSE 事件桥接）

  // TODO: 待相应模块实现后取消注释
  // registerAccountInitializationTasks();
  // registerGoalInitializationTasks();
  // registerNotificationInitializationTasks();
  // registerSettingInitializationTasks();
  // registerThemeInitializationTasks();

  console.log('All initialization tasks registered');
}

/**
 * 应用启动时的初始化。
 *
 * @returns {Promise<void>}
 */
export async function initializeApp(): Promise<void> {
  console.log('Starting application initialization...');
  console.log('💫 [Debug] initializeApp() 调用堆栈:', new Error().stack);

  // 注册所有初始化任务
  registerAllInitializationTasks();

  // 执行应用启动阶段的初始化
  const manager = InitializationManager.getInstance();
  await manager.executePhase(InitializationPhase.APP_STARTUP);

  console.log('✓ Application initialization completed');
}

/**
 * 用户登录时的初始化。
 *
 * @param accountUuid - 登录用户的 UUID
 * @returns {Promise<void>}
 */
export async function initializeUserSession(accountUuid: string): Promise<void> {
  console.log(`Initializing user session for: ${accountUuid}`);

  const manager = InitializationManager.getInstance();

  // 执行用户登录阶段的初始化
  await manager.executePhase(InitializationPhase.USER_LOGIN, { accountUuid });

  console.log(`✓ User session initialized for: ${accountUuid}`);
}

/**
 * 用户登出时的清理。
 *
 * @returns {Promise<void>}
 */
export async function cleanupUserSession(): Promise<void> {
  console.log('Cleaning up user session...');

  const manager = InitializationManager.getInstance();

  // 执行用户登出阶段的清理
  await manager.cleanupPhase(InitializationPhase.USER_LOGIN);

  console.log('✓ User session cleaned up');
}

/**
 * 应用关闭时的清理。
 *
 * @returns {Promise<void>}
 */
export async function cleanupApp(): Promise<void> {
  console.log('Cleaning up application...');

  const manager = InitializationManager.getInstance();

  // 清理所有阶段
  await manager.cleanupPhase(InitializationPhase.USER_LOGIN);
  await manager.cleanupPhase(InitializationPhase.APP_STARTUP);

  console.log('✓ Application cleanup completed');
}

// /**
//  * 获取初始化状态
//  */
// export function getInitializationStatus() {
//   const manager = InitializationManager.getInstance();
//   return manager.getStatus();
// }

/**
 * 检查特定任务是否已完成。
 *
 * @param taskName - 任务名称
 * @returns {boolean} 是否完成
 */
export function isTaskCompleted(taskName: string): boolean {
  const manager = InitializationManager.getInstance();
  return manager.isTaskCompleted(taskName);
}
