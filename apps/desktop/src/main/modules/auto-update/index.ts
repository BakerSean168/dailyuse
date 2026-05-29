/**
 * Auto Update Module - Desktop Main Process
 *
 * Story 13.51: 自动更新集成
 *
 * 使用 electron-updater 实现自动更新功能
 * 支持多种更新策略和用户交互
 *
 * @module modules/auto-update
 */

export { AutoUpdateManager, createAutoUpdateManager, type UpdateConfig, type UpdateProgress } from './auto-update-manager';
export { registerAutoUpdateIpcHandlers } from './ipc';
