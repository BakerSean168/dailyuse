/**
 * @memoflow/account
 *
 * Account module runtime root.
 *
 * Public account contracts are centralized in `@memoflow/contracts/account`.
 * Root exports are limited to the canonical server composition root:
 * ingredient factories, set types, module factory, runtime contribution
 * factories and port types. Client / API / Electron seams use dedicated
 * subpaths.
 *
 * 账户模块运行时根。
 * 公开契约集中在 `@memoflow/contracts/account`。
 * 根导出仅限于规范化的服务端组合根：原料工厂、集合类型、模块工厂、
 * 运行时贡献工厂与 Port 类型。Client / API / Electron 使用独立 subpath。
 */

export {
  createAccountModule,
  createAccountPowerSyncModule,
  createAccountPowerSyncRepositories,
  createAccountPrismaModule,
  createAccountPrismaRepositories,
  createAccountPrismaRepository,
  createCloudAccountProvisioner,
  createAccountRuntimeContributions,
  AccountClosedWorker,
  PrismaAccountClosureOperationRepository,
  type AccountModuleDependencies,
  type AccountModuleInstance,
  type AccountModuleRuntimeContribution,
  type CreateAccountPowerSyncModuleOptions,
  type CreateAccountPrismaModuleOptions,
  type AccountPrismaRepositorySet,
  type AccountPowerSyncRepositorySet,
  type CloudAuthLike,
  type CloudAccountProvisioningInput,
  type AccountRuntimeContributionsInput,
  type IAccountRepository,
} from './server';
export type { AccountApplicationPort } from './server';
