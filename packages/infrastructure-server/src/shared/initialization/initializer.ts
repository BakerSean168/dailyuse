/**
 * Initialization Manager for Infrastructure Server
 * 基础设施服务器初始化管理�?
 *
 * 职责�?
 * - 注册基础设施层的初始化任�?
 * - 管理应用启动和关闭流�?
 *
 * @module Shared/Initialization
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';

/**
 * 注册基础设施层的所有初始化任务
 */
export function registerAllInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  
  console.log('All infrastructure initialization tasks registered');
}

/**
 * 应用启动时的初始�?
 */
export async function initializeApp(): Promise<void> {
  console.log('Starting infrastructure application initialization...');

  // 注册所有初始化任务
  registerAllInitializationTasks();

  // 执行应用启动阶段的初始化
  const manager = InitializationManager.getInstance();
  await manager.executePhase(InitializationPhase.APP_STARTUP);

  console.log('�?Infrastructure application initialization completed');
}

/**
 * 应用关闭时的清理
 */
export async function cleanupApp(): Promise<void> {
  console.log('Cleaning up infrastructure application...');

  const manager = InitializationManager.getInstance();
  await manager.cleanupPhase(InitializationPhase.USER_LOGIN);
  await manager.cleanupPhase(InitializationPhase.APP_STARTUP);

  console.log('�?Infrastructure application cleanup completed');
}

/**
 * 检查特定任务是否已完成
 */
export function isTaskCompleted(taskName: string): boolean {
  const manager = InitializationManager.getInstance();
  return manager.isTaskCompleted(taskName);
}
