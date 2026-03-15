/**
 * PowerSync Adapter - Infrastructure Server
 * PowerSync 适配器 - 基础设施服务端
 *
 * Provides SQLite-based repository implementations for offline-capable
 * desktop (Electron). Data synced via PowerSync SDK.
 * 为支持离线的桌面端（Electron）提供基于 SQLite 的仓储实现。
 * 数据通过 PowerSync SDK 同步。
 */
export { PowerSyncRuleRepository } from './rule-powersync.repository';
export { PowerSyncRuleRevisionRepository } from './rule-revision-powersync.repository';
export * from './mappers';
