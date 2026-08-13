/**
 * Repository Module - Infrastructure Server
 *
 * Knowledge-repository composition roots and adapters. Legacy database
 * Folder/Resource/Bookmark repository adapters were removed with the Obsidian
 * vault migration; portable backup remains in data-portability.
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
  createFsStorageAdapter,
  type CreateRepositoryPrismaModuleOptions,
} from './prisma';
export {
  DEFAULT_REPOSITORY_STORAGE_BASE_DIR,
  resolveRepositoryStorageBaseDir,
  type ResolveRepositoryStorageBaseDirOptions,
} from './storage-config';
export { createRepositoryRuntimeContribution } from './runtime';

// Storage
export { FsStorageAdapter } from './adapters/fs/fs-storage.adapter';

// Knowledge Prisma adapters
export { KnowledgeRepositoryConnectionPrismaRepository } from './adapters/prisma/knowledge-repository-connection-prisma.repository';
export { GithubWebhookDeliveryPrismaRepository } from './adapters/prisma/github-webhook-delivery-prisma.repository';
export { KnowledgeNoteProjectionPrismaRepository } from './adapters/prisma/knowledge-note-projection-prisma.repository';
export { KnowledgeAttachmentProjectionPrismaRepository } from './adapters/prisma/knowledge-attachment-projection-prisma.repository';
export { KnowledgeAttachmentContentCachePrismaRepository } from './adapters/prisma/knowledge-attachment-content-cache-prisma.repository';
export { KnowledgeWriteRequestPrismaRepository } from './adapters/prisma/knowledge-write-request-prisma.repository';
export { KnowledgeRepositoryLeasePrismaRepository } from './adapters/prisma/knowledge-repository-lease-prisma.repository';

// GitHub App client
export { GitHubAppClient } from './services/github-app-client';
export { InMemoryKnowledgeRepositoryInstallationStateStore } from './services/in-memory-knowledge-repository-installation-state-store';

// Consumers
export { RepositoryAccountClosedConsumer } from './consumers/repository-account-closed.consumer';
