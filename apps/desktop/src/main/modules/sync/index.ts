/**
 * Sync Module - Desktop Main Process
 * 同步模块 - 桌面端主进程
 *
 * 负责数据同步功能：
 * - 同步管理器 (SyncManager)
 * - 同步提供者 (GitHub Gist, WebDAV, etc.)
 * - 数据导入/导出
 */

// Infrastructure
export * from './infrastructure';

// IPC Handlers
export {
  registerSyncIpcHandlers,
  unregisterSyncIpcHandlers,
  configureGitHubGistProvider,
} from './ipc';

// Application Service (to be added)
// export * from './application';
