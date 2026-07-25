/**
 * Repository Prisma composition helpers.
 */

import type { PrismaClient } from '@dailyuse/database';
import { FsStorageAdapter } from './adapters/fs/fs-storage.adapter';
import {
  createRepositoryModule,
  type RepositoryModuleInstance,
  type RepositoryModuleRuntimeContribution,
} from './repository.module';
import { resolveRepositoryStorageBaseDir } from './storage-config';
import { KnowledgeRepositoryConnectionService } from '../application/services/knowledge-repository-connection.service';
import type {
  IGitHubAppClient,
  IKnowledgeRepositoryInstallationStateStore,
} from '../application/ports/github-app-client.port';
import type { IKnowledgeRepositoryCloudDataPurger } from '../application/ports/knowledge-repository-cloud-data-purger.port';
import { GitHubAppClient } from './services/github-app-client';
import { InMemoryKnowledgeRepositoryInstallationStateStore } from './services/in-memory-knowledge-repository-installation-state-store';
import { KnowledgeRepositoryConnectionPrismaRepository } from './adapters/prisma/knowledge-repository-connection-prisma.repository';
import { GithubWebhookDeliveryPrismaRepository } from './adapters/prisma/github-webhook-delivery-prisma.repository';
import { KnowledgeNoteProjectionPrismaRepository } from './adapters/prisma/knowledge-note-projection-prisma.repository';
import { KnowledgeAttachmentProjectionPrismaRepository } from './adapters/prisma/knowledge-attachment-projection-prisma.repository';
import { KnowledgeAttachmentContentCachePrismaRepository } from './adapters/prisma/knowledge-attachment-content-cache-prisma.repository';
import { KnowledgeWriteRequestPrismaRepository } from './adapters/prisma/knowledge-write-request-prisma.repository';
import { KnowledgeRepositoryLeasePrismaRepository } from './adapters/prisma/knowledge-repository-lease-prisma.repository';
import { KnowledgeRepositoryProjectionService } from '../application/services/knowledge-repository-projection.service';
import { KnowledgeNoteCommitService } from '../application/services/knowledge-note-commit.service';

export interface CreateRepositoryPrismaModuleOptions {
  readonly storageBaseDir?: string;
  readonly runtimeContributions?:
    RepositoryModuleRuntimeContribution | readonly RepositoryModuleRuntimeContribution[];
  readonly githubApp?: {
    readonly appId: string;
    readonly appSlug: string;
    readonly privateKey: string;
    readonly webhookSecret: string;
    readonly apiBaseUrl?: string;
    readonly client?: IGitHubAppClient;
    readonly stateStore?: IKnowledgeRepositoryInstallationStateStore;
  };
  readonly knowledgeRepositoryCloudDataPurger?: IKnowledgeRepositoryCloudDataPurger;
}


export function createFsStorageAdapter(baseDir?: string): FsStorageAdapter {
  const resolvedBaseDir = resolveRepositoryStorageBaseDir({ storageBaseDir: baseDir });
  return new FsStorageAdapter(resolvedBaseDir);
}


export function createRepositoryPrismaModule(
  db: PrismaClient,
  options: CreateRepositoryPrismaModuleOptions = {},
): RepositoryModuleInstance {
  const connectionRepository = options.githubApp
    ? new KnowledgeRepositoryConnectionPrismaRepository(db)
    : null;
  const githubAppClient = options.githubApp
    ? (options.githubApp.client ??
      new GitHubAppClient({
        appId: options.githubApp.appId,
        privateKey: options.githubApp.privateKey,
        apiBaseUrl: options.githubApp.apiBaseUrl,
      }))
    : null;
  const projectionRepository = options.githubApp
    ? new KnowledgeNoteProjectionPrismaRepository(db)
    : null;
  const attachmentRepository = options.githubApp
    ? new KnowledgeAttachmentProjectionPrismaRepository(db)
    : null;
  const attachmentContentCache = options.githubApp
    ? new KnowledgeAttachmentContentCachePrismaRepository(db)
    : null;
  const leaseRepository = options.githubApp
    ? new KnowledgeRepositoryLeasePrismaRepository(db)
    : null;
  const knowledgeRepositoryConnectionService =
    options.githubApp && connectionRepository && githubAppClient
      ? new KnowledgeRepositoryConnectionService({
          appSlug: options.githubApp.appSlug,
          connectionRepository,
          githubAppClient,
          stateStore:
            options.githubApp.stateStore ?? new InMemoryKnowledgeRepositoryInstallationStateStore(),
          cloudDataPurger: options.knowledgeRepositoryCloudDataPurger,
        })
      : null;
  const knowledgeRepositoryProjectionService =
    options.githubApp &&
    connectionRepository &&
    githubAppClient &&
    projectionRepository &&
    attachmentRepository
      ? new KnowledgeRepositoryProjectionService({
          webhookSecret: options.githubApp.webhookSecret,
          connectionRepository,
          deliveryRepository: new GithubWebhookDeliveryPrismaRepository(db),
          projectionRepository,
          attachmentRepository,
          attachmentContentCache: attachmentContentCache ?? undefined,
          leaseRepository: leaseRepository ?? undefined,
          githubAppClient,
        })
      : null;
  const knowledgeNoteCommitService =
    options.githubApp && connectionRepository && githubAppClient && projectionRepository
      ? new KnowledgeNoteCommitService({
          connectionRepository,
          projectionRepository,
          writeRequestRepository: new KnowledgeWriteRequestPrismaRepository(db),
          leaseRepository: leaseRepository ?? undefined,
          githubAppClient,
        })
      : null;

  const configuredRuntimeContributions = Array.isArray(options.runtimeContributions)
    ? options.runtimeContributions
    : options.runtimeContributions
      ? [options.runtimeContributions]
      : [];

  return createRepositoryModule({
    knowledgeRepositoryConnectionService,
    knowledgeRepositoryProjectionService,
    knowledgeNoteCommitService,
    runtimeContributions: [
      ...configuredRuntimeContributions,
      ...(knowledgeRepositoryProjectionService ? [knowledgeRepositoryProjectionService] : []),
    ],
  });
}
