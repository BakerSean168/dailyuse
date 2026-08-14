/**
 * Account Infrastructure Server Layer
 * 账户基础设施服务端层 — 仓储实现与组合根
 *
 * Public seam: ingredient factories, set types, module factory, runtime
 * contribution factories and port types. Concrete Prisma / PowerSync adapter
 * classes do not leak through this barrel — the R1 lesson applied to the
 * goal/task migration.
 *
 * 公共 seam：仅导出原料工厂、集合类型、模块工厂、运行时贡献工厂与 Port 类型。
 * 具体 Prisma / PowerSync 适配器类不通过该 barrel 泄漏——目标/任务迁移的 R1 教训。
 *
 * @internal 标记的条目是仍被 transport/apps 直接消费的具体类，将在
 * Step E 消费者注入完成后移除。
 */

/** @internal 仍被 apps/api 与 apps/desktop 直接消费的具体类，Step E 移除。 */
export { PrismaAccountClosureOperationRepository } from './adapters/prisma/account-closure-operation-prisma.repository';
/** @internal 仍被 apps/api 直接消费的具体 worker 类，Step E 移除。 */
export { AccountClosedWorker } from './workers/account-closed.worker';

/** @internal 仍被 electron 模块直接消费的具体 PowerSync 实现 — 使用 IAccountRepository 接口代替。 */
export {
  PowerSyncAccountRepository,
  type Transactional,
} from './adapters/powersync/account-powersync.repository';

export {
  createAccountModule,
  createAccountUseCases,
  type AccountModuleDependencies,
  type AccountModuleInstance,
  type AccountModuleRuntimeContribution,
  type AccountModuleUseCases,
} from './account.module';
export type { AccountApplicationPort, AccountListOptions, AccountListResult } from '../application';
export type { IAccountRepository, IAccountClosureOperationRepository } from '../domain';
export type {
  CloudAuthRevocationPort,
  AccountClosureEventPublisher,
} from '../application/ports';
export type { OperationAuditRepository } from '@memoflow/patterns/operations';
export {
  createAccountPrismaModule,
  createAccountPrismaRepositories,
  createAccountPrismaRepository,
  type CreateAccountPrismaModuleOptions,
  type AccountPrismaRepositorySet,
  type CloudAuthLike,
} from './prisma';
export {
  createAccountPowerSyncModule,
  createAccountPowerSyncRepositories,
  type CreateAccountPowerSyncModuleOptions,
  type AccountPowerSyncRepositorySet,
} from './powersync';
export {
  createAccountRuntimeContributions,
  type AccountRuntimeContributionsInput,
} from './runtime';
export {
  createCloudAccountProvisioner,
  type CloudAccountProvisioningInput,
} from './cloud-account-provisioner';
