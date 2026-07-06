/**
 * Governance server domain layer.
 * Governance 服务端领域层。
 *
 * Owns the business model used by the governance runtime:
 * aggregates, entities, repository interfaces, and value objects.
 *
 * 负责治理运行时的业务模型：
 * 聚合根、实体、仓储接口和值对象。
 *
 * Public contracts remain centralized in `@dailyuse/contracts/governance`.
 * 公共契约继续集中在 `@dailyuse/contracts/governance`。
 */

export * from './aggregates';
export * from './entities';
export * from './repositories';
export * from './value-objects';