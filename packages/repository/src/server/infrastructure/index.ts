/**
 * Repository Module - Infrastructure Server
 * 仓库模块 - 服务端基础设施
 *
 * Repository implementations and composition root for Repository domain.
 * Supports Prisma (API) and PowerSync (Desktop) data sources.
 *
 * 仓库领域的仓储实现和组合根。
 * 支持 Prisma (API) 和 PowerSync (桌面端) 数据源。
 */

// Composition Root (canonical pattern — 规范组合根模式)
export {
  createRepositoryModule,
  createRepositoryUseCases,
  type RepositoryModuleDependencies,
  type RepositoryModuleInstance,
  type RepositoryModuleUseCases,
  type RepositoryModuleRuntimeContribution,
  type RepositoryRuntimeContributionsInput,
} from './repository.module';
export type { RepositoryApplicationPort } from '../application';

// PowerSync convenience factory (Electron — PowerSync 便捷工厂)
export {
  createRepositoryPowerSyncModule,
  type CreateRepositoryPowerSyncModuleOptions,
} from './powersync';
export {
  createRepositoryPrismaModule,
  createFsStorageAdapter,
  type CreateRepositoryPrismaModuleOptions,
} from './prisma';
export {
  DEFAULT_REPOSITORY_STORAGE_BASE_DIR,
  resolveRepositoryStorageBaseDir,
  type ResolveRepositoryStorageBaseDirOptions,
} from './storage-config';
export { createRepositoryRuntimeContribution, type RepositoryRuntimeContribution } from './runtime';

// Repository Factory (adapter builder — 适配器构建器)
export { RepositoryRepositoryFactory } from './di/repository-repository.factory';

// Ports (Interfaces — 端口接口)
export {
  type IFolderRepository,
  type IRepositoryRepository,
  type IResourceRepository,
} from '../domain';

// Prisma Adapters (API — Prisma 适配器)
export { FolderPrismaRepository } from './adapters/prisma/folder-prisma.repository';
export { RepositoryPrismaRepository } from './adapters/prisma/repository-prisma.repository';
export { ResourcePrismaRepository } from './adapters/prisma/resource-prisma.repository';
export { ResourceBookmarkPrismaRepository } from './adapters/prisma/resource-bookmark-prisma.repository';
export { FsStorageAdapter } from './adapters/fs/fs-storage.adapter';
export { KnowledgeRepositoryConnectionPrismaRepository } from './adapters/prisma/knowledge-repository-connection-prisma.repository';
export { GitHubAppClient } from './services/github-app-client';
export { InMemoryKnowledgeRepositoryInstallationStateStore } from './services/in-memory-knowledge-repository-installation-state-store';
export { GithubWebhookDeliveryPrismaRepository } from './adapters/prisma/github-webhook-delivery-prisma.repository';
export { KnowledgeNoteProjectionPrismaRepository } from './adapters/prisma/knowledge-note-projection-prisma.repository';
export { KnowledgeAttachmentProjectionPrismaRepository } from './adapters/prisma/knowledge-attachment-projection-prisma.repository';
export { KnowledgeAttachmentContentCachePrismaRepository } from './adapters/prisma/knowledge-attachment-content-cache-prisma.repository';
export { KnowledgeWriteRequestPrismaRepository } from './adapters/prisma/knowledge-write-request-prisma.repository';
export { KnowledgeRepositoryLeasePrismaRepository } from './adapters/prisma/knowledge-repository-lease-prisma.repository';

// PowerSync Adapters (Desktop — PowerSync 适配器)
export { PowerSyncRepositoryRepository } from './adapters/powersync/repository-powersync.repository';
export { PowerSyncFolderRepository } from './adapters/powersync/folder-powersync.repository';
export { PowerSyncResourceRepository } from './adapters/powersync/resource-powersync.repository';
export { ResourceBookmarkPowerSyncRepository } from './adapters/powersync/resource-bookmark-powersync.repository';

// Memory Adapters (Testing — 内存适配器，用于测试)
export { FolderMemoryRepository } from './adapters/memory/folder-memory.repository';
export { RepositoryMemoryRepository } from './adapters/memory/repository-memory.repository';
export { ResourceMemoryRepository } from './adapters/memory/resource-memory.repository';
export { ResourceBookmarkMemoryRepository } from './adapters/memory/resource-bookmark-memory.repository';
