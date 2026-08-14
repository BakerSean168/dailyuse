/**
 * Repository Module - Infrastructure Server
 * 知识仓储模块 - 基础设施服务端层
 *
 * Public seam: ingredient factories, set types, module factory, runtime
 * contribution factories and port types. Concrete Prisma / GitHub / Fs adapter
 * classes stay implementation-private — the R1 lesson applied to the goal/task
 * migration.
 *
 * 公共 seam：仅导出原料工厂、集合类型、模块工厂、运行时贡献工厂与 Port 类型。
 * 具体 Prisma / GitHub / Fs 适配器类保持实现私有——目标/任务迁移的 R1 教训。
 */

// Composition Root
export {
  createRepositoryModule,
  type RepositoryModuleDependencies,
  type RepositoryModuleInstance,
  type RepositoryModuleRuntimeContribution,
  type RepositoryRuntimeContributionsInput,
} from './repository.module';
export type { RepositoryApplicationPort } from '../application';

// Convenience factories
export {
  createRepositoryPrismaModule,
  createRepositoryPrismaRepositories,
  createRepositoryPrismaRuntimeContributions,
  createFsStorageAdapter,
  type CreateRepositoryPrismaModuleOptions,
  type CreateRepositoryPrismaRuntimeContributionsInput,
  type RepositoryPrismaRepositorySet,
  type RepositoryPrismaRuntimeContributions,
  type GithubAppConfig,
} from './prisma';
export {
  DEFAULT_REPOSITORY_STORAGE_BASE_DIR,
  resolveRepositoryStorageBaseDir,
  type ResolveRepositoryStorageBaseDirOptions,
} from './storage-config';
export { createRepositoryRuntimeContribution } from './runtime';

// Repository / service ports referenced by the set and module dependencies
export type { IKnowledgeRepositoryConnectionRepository } from '../application/ports/knowledge-repository-connection.repository';
export type {
  IGithubWebhookDeliveryRepository,
  IKnowledgeNoteProjectionRepository,
  IKnowledgeWriteRequestRepository,
} from '../application/ports/knowledge-note-projection.repository';
export type { IKnowledgeAttachmentProjectionRepository } from '../application/ports/knowledge-attachment-projection.repository';
export type { IKnowledgeAttachmentContentCache } from '../application/ports/knowledge-attachment-content-cache.port';
export type { IKnowledgeRepositoryLeaseRepository } from '../application/ports/knowledge-repository-lease.repository';
export type { IKnowledgeRepositoryCloudDataPurger } from '../application/ports/knowledge-repository-cloud-data-purger.port';
export type {
  IGitHubAppClient,
  IKnowledgeRepositoryInstallationStateStore,
} from '../application/ports/github-app-client.port';
export type { IKnowledgeRepositoryConnectionService } from '../application/ports/knowledge-repository-connection.service.port';
export type { IKnowledgeRepositoryProjectionService } from '../application/ports/knowledge-repository-projection.service.port';
export type { IKnowledgeNoteCommitService } from '../application/ports/knowledge-note-commit.service.port';

// Consumers
/** @internal 仍被 apps/api 直接消费的具体 consumer 类 — Step E 移除。 */
export { RepositoryAccountClosedConsumer } from './consumers/repository-account-closed.consumer';
