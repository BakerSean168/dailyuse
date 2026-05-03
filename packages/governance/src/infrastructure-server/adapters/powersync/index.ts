/**
 * PowerSync Adapters — Barrel Export.
 * PowerSync 适配器 —— 统一导出。
 *
 * Provides SQLite-based repository implementations for offline-capable desktop (Electron).
 * Data is synced bidirectionally via PowerSync SDK.
 * 为支持离线的桌面端（Electron）提供基于 SQLite 的仓储实现。
 * 数据通过 PowerSync SDK 双向同步。
 *
 * @internal Concrete implementations — consumers should use domain interfaces (IRuleRepository, etc.).
 * @internal 具体实现 —— 消费方应使用领域接口（IRuleRepository 等）。
 */
export { PowerSyncRuleRepository } from './rule-powersync.repository';
export { PowerSyncRuleRevisionRepository } from './rule-revision-powersync.repository';
export * from './mappers';
