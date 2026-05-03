/**
 * Prisma Adapters — Barrel Export.
 * Prisma 适配器 —— 统一导出。
 *
 * Re-exports all Prisma-backed repository implementations and their mappers.
 * 重新导出所有基于 Prisma 的仓储实现及其映射器。
 *
 * @internal Concrete implementations — consumers should use domain interfaces (IRuleRepository, etc.).
 * @internal 具体实现 —— 消费方应使用领域接口（IRuleRepository 等）。
 */

export { RulePrismaRepository } from './rule-prisma.repository';
export { RuleRevisionPrismaRepository } from './rule-revision-prisma.repository';
export { RulePrismaMapper, RuleRevisionPrismaMapper } from './mappers';
