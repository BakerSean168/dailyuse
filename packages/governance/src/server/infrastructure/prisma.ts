/**
 * Prisma composition root for governance.
 * Governance 的 Prisma 组合根。
 *
 * Mirrors the PowerSync convenience root so HTTP and Electron assemble the
 * same module-owned runtime semantics with different persistence adapters.
 *
 * 与 PowerSync 便捷组合根保持对称，
 * 让 HTTP 与 Electron 只更换持久化适配器，而不改变模块生命周期语义。
 */

import type { PrismaClient } from '@memoflow/database';
import type { IRuleRepository, IRuleRevisionRepository } from '../domain';
import { createGovernanceModule, type GovernanceModuleInstance } from './governance.module';
import { RulePrismaRepository, RuleRevisionPrismaRepository } from './adapters/prisma';
import { createGovernanceEventLogRuntime } from './runtime';

/**
 * Host-facing governance repository set.
 * 面向宿主暴露的治理仓储集合。
 *
 * Represents the repository Ports that persistence adapters must satisfy.
 * Concrete adapter classes (RulePrismaRepository, etc.) never cross this seam —
 * hosts consume repositories only through these interfaces.
 *
 * 表示持久化适配器必须满足的仓储 Port。
 * 具体适配器类（如 RulePrismaRepository）从不越过该 seam——
 * 宿主只能通过这些接口使用仓储。
 */
export interface GovernanceRepositorySet {
  readonly ruleRepository: IRuleRepository;
  readonly revisionRepository: IRuleRevisionRepository;
}

/**
 * Creates Prisma-backed governance repositories.
 * 创建基于 Prisma 的治理仓储。
 *
 * Host-level composition ingredient: selects the Prisma adapters and returns the
 * repository Port shape. Use this together with createGovernanceEventLogRuntime()
 * and createGovernanceModule() to assemble a governance instance in a host runtime.
 *
 * 宿主级组合原料：选择 Prisma 适配器并返回仓储 Port 形状。
 * 与 createGovernanceEventLogRuntime()、createGovernanceModule() 配合，
 * 在宿主运行时装配治理实例。
 *
 * @param db - Prisma client owned by the host runtime.
 * @returns Repository set backed by the Prisma adapters.
 */
export function createGovernancePrismaRepositories(db: PrismaClient): GovernanceRepositorySet {
  return {
    ruleRepository: new RulePrismaRepository(db),
    revisionRepository: new RuleRevisionPrismaRepository(db),
  };
}

/**
 * Creates a Prisma-backed governance module instance.
 * 创建基于 Prisma 的治理模块实例。
 *
 * Convenience root kept for in-package reuse / rollback; delegates to
 * createGovernancePrismaRepositories() plus the canonical module assembly.
 *
 * 便捷组合根，保留用于包内复用与回滚；委托给
 * createGovernancePrismaRepositories() 与规范化模块装配。
 *
 * @param db - Prisma client used by the API runtime.
 * @returns GovernanceModuleInstance with module-owned runtime adapters attached.
 */
export function createGovernancePrismaModule(db: PrismaClient): GovernanceModuleInstance {
  const { ruleRepository, revisionRepository } = createGovernancePrismaRepositories(db);
  return createGovernanceModule({
    ruleRepository,
    revisionRepository,
    runtimeAdapters: createGovernanceEventLogRuntime(),
  });
}