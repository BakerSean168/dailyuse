/**
 * @file Electron Main Process Entry Point
 * @description Electron 主进程入口点
 *
 * 遵循 ADR-006: IPC invoke/handle 模式
 * 遵循 STORY-002: 主进程 DI 初始化
 * 遵循 STORY-003: Preload API 暴露
 * 
 * 职责划分：
 * - lifecycle/app-lifecycle.ts: 应用生命周期事件管理
 * - desktop-features/: 桌面功能初始化和清理
 * - ipc/system-handlers.ts: 系统级 IPC 处理器注册
 * - modules/: 业务模块 IPC 处理器和初始化
 * - database/: 数据库初始化和清理
 * - di/: 依赖注入配置
 * - services/: 应用层服务（notification、sync）
 * - events/: 事件监听器注册
 * - utils/: 通用工具（性能监控、IPC 缓存）
 */

import { app } from 'electron';
import { initializeDatabase, startMemoryCleanup } from './database';
import { initMemoryMonitorForDev, registerCacheIpcHandlers } from './utils';
import { configureMainProcessDependencies } from './di';
import { registerAllModules, initializeAllModules } from './modules';
import { initializeIPCHandlers } from './modules/ipc-registry';
import { initSyncManager } from './services';
import { registerAppLifecycleHandlers } from './lifecycle';
import { initializeEventListeners } from './events/initialize-event-listeners';
import { initializeContainers } from './modules/infrastructure';

/**
 * @function initializeApp
 * @description 应用初始化
 * 
 * EPIC-003: 性能优化
 * - 添加启动时间测量
 * - 核心模块优先加载
 * - 非核心模块懒加载
 *
 * @returns {Promise<void>} Promise indicating completion
 */
async function initializeApp(): Promise<void> {
  const startTime = performance.now();
  console.log('[App] Initializing...');

  // 1. 初始化数据库
  const db = initializeDatabase();
  console.log('[App] Database initialized');

  // 2. 初始化DI容器（注册所有Repository）
  await initializeContainers();
  console.log('[App] DI containers initialized');

  // 3. EPIC-004: 初始化同步管理器
  initSyncManager(db);
  console.log('[App] Sync manager initialized');

  // 4. 配置依赖注入（核心模块立即加载，非核心懒加载）
  configureMainProcessDependencies();
  console.log('[App] DI configured');

  // 6. EPIC-010: 注册所有模块
  registerAllModules();
  console.log('[App] All modules registered');

  // 7. EPIC-010: 初始化所有模块（按 priority 顺序）
  const moduleResult = await initializeAllModules();
  console.log(`[App] All modules initialized: ${moduleResult.ok ? 'SUCCESS' : 'FAILED'} (${moduleResult.duration}ms)`);
  if (!moduleResult.ok) {
    console.error('[App] Failed modules:', moduleResult.failedModules);
  }

  // 8. 初始化事件监听器
  await initializeEventListeners();
  console.log('[App] Event listeners initialized');

  // 9. 启动数据库内存清理定时器
  startMemoryCleanup();

  // 10
  // 7. 启动数据库内存清理定时器
  startMemoryCleanup();

  // 8. EPIC-003: 初始化性能监控工具
  initMemoryMonitorForDev();
  registerCacheIpcHandlers();
  console.log('[App] Performance monitoring initialized');

  const initTime = performance.now() - startTime;
  console.log(`[App] Initialization complete in ${initTime.toFixed(2)}ms`);
  
  // 发送启动完成信号（用于性能测试）
  if (process.env.BENCHMARK_MODE === 'true') {
    console.log('[BENCHMARK] READY');
  }
}

/**
 * @description 注册应用生命周期处理器
 * 
 * 所有关键的生命周期逻辑已迁移到：
 * - lifecycle/app-lifecycle.ts (创建窗口、激活、清理)
 * - desktop-features/index.ts (桌面特性初始化)
 * - ipc/system-handlers.ts (系统 IPC 注册)
 */
registerAppLifecycleHandlers(initializeApp);

// ========== 安全性：阻止创建新窗口 ==========
// 此处理器已在 lifecycle/app-lifecycle.ts 中设置

