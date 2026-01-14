/**
 * Sync Module - Desktop Main Process
 * 同步模块 - 桌面端主进程
 *
 * 负责数据同步功能：
 * - 同步应用服务 (SyncDesktopApplicationService)
 * - IPC 处理器 (SyncIPCHandlerV2)
 */

// Application
export * from './application';

// IPC Handlers
export {
  SyncIPCHandlerV2,
  getSyncIPCHandlerV2,
  resetSyncIPCHandlerV2,
} from './ipc';
