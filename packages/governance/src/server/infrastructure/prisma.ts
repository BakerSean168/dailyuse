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
import { createGovernanceModule, type GovernanceModuleInstance } from './governance.module';
import { RulePrismaRepository, RuleRevisionPrismaRepository } from './adapters/prisma';
import { createGovernanceEventLogRuntime } from './runtime';

/**
 * Creates a Prisma-backed governance module instance.
 * 创建基于 Prisma 的治理模块实例。
 *
 * @param db - Prisma client used by the API runtime.
 * @returns GovernanceModuleInstance with module-owned runtime adapters attached.
 */
export function createGovernancePrismaModule(db: PrismaClient): GovernanceModuleInstance {
  return createGovernanceModule({
    ruleRepository: new RulePrismaRepository(db),
    revisionRepository: new RuleRevisionPrismaRepository(db),
    runtimeAdapters: createGovernanceEventLogRuntime(),
  });
}