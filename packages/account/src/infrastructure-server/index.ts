/**
 * Account Infrastructure Server Layer
 * 账户基础设施服务端层 — 仓储实现与组合根
 *
 * Prisma / PowerSync / Memory repository adapters + composition root.
 * Prisma / PowerSync / Memory 仓储适配器 + 组合根。
 */

/** @internal Concrete Prisma implementation — use IAccountRepository interface instead. Prisma 具体实现 — 请使用 IAccountRepository 接口。 */
export { PrismaAccountRepository } from './adapters/prisma/account-prisma.repository';
/** @internal Concrete PowerSync implementation — use IAccountRepository interface instead. PowerSync 具体实现 — 请使用 IAccountRepository 接口。 */
export { PowerSyncAccountRepository, type Transactional } from './adapters/powersync/account-powersync.repository';
/** @internal In-memory implementation for testing — use IAccountRepository interface instead. 内存实现（测试用）— 请使用 IAccountRepository 接口。 */
export { MemoryAccountRepository } from './adapters/memory/account-memory.repository';
export {
  createAccountModule,
  createAccountUseCases,
  type AccountApplicationPort,
  type AccountModuleDependencies,
  type AccountModuleInstance,
  type AccountModuleRuntimeContribution,
  type AccountModuleUseCases,
} from './account.module';
