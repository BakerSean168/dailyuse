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

// 已注册为 IApiModule 的模块在各自 register() 内处理初始化，
// 此文件仅保留尚未迁移到模块化注册的全局初始化逻辑。

// 旧模块初始化任务（等各模块完成 IApiModule 迁移后可删除）
import { registerAuthenticationInitializationTasks } from '../../modules/authentication/initialization/authenticationInitialization';

/**
 * 注册所有模块的初始化任务。
 *
 * @remarks
 * 新模块（如 Governance）已在各自 IApiModule.register() 中处理初始化，
 * 此处仅保留尚未迁移的旧模块初始化任务。
 */
export function registerAllInitializationTasks(): void {
  registerAuthenticationInitializationTasks(); // ⚠️ 旧模块 — 待 IApiModule 迁移后移除

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
