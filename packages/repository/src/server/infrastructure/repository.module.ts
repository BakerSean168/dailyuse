/**
 * Repository Module Composition Root
 *
 * Knowledge-repository runtime only: GitHub App connection, projection,
 * confirmed note create, and webhook ingest. Legacy database Repository /
 * Folder / Resource / Bookmark CRUD is no longer assembled here.
 */

import { fail, ok, type Result } from '@memoflow/contracts/result';
import type { RepositoryApplicationPort } from '../application';
import { KnowledgeRepositoryConnectionService } from '../application/services/knowledge-repository-connection.service';
import { KnowledgeRepositoryProjectionService } from '../application/services/knowledge-repository-projection.service';
import { KnowledgeNoteCommitService } from '../application/services/knowledge-note-commit.service';

export type RepositoryRuntimeContributionsInput =
  | RepositoryModuleRuntimeContribution
  | readonly RepositoryModuleRuntimeContribution[];

export interface RepositoryModuleDependencies {
  readonly runtimeContributions?: RepositoryRuntimeContributionsInput;
  readonly knowledgeRepositoryConnectionService?: KnowledgeRepositoryConnectionService | null;
  readonly knowledgeRepositoryProjectionService?: KnowledgeRepositoryProjectionService | null;
  readonly knowledgeNoteCommitService?: KnowledgeNoteCommitService | null;
}

export interface RepositoryModuleRuntimeContribution {
  start(): void;
  stop(): void;
}

export interface RepositoryModuleInstance {
  readonly knowledgeRepositoryConnectionService: KnowledgeRepositoryConnectionService | null;
  readonly knowledgeRepositoryProjectionService: KnowledgeRepositoryProjectionService | null;
  readonly knowledgeNoteCommitService: KnowledgeNoteCommitService | null;
  readonly api: RepositoryApplicationPort;
  start(): void;
  dispose(): void;
}

function normalizeRuntimeContributions(
  runtimeContributions?: RepositoryRuntimeContributionsInput,
): readonly RepositoryModuleRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }
  if (Array.isArray(runtimeContributions)) {
    return Array.from(runtimeContributions);
  }
  return [runtimeContributions as RepositoryModuleRuntimeContribution];
}

function buildApplicationPort(deps: RepositoryModuleDependencies): RepositoryApplicationPort {
  const connectionService = deps.knowledgeRepositoryConnectionService ?? null;
  const projectionService = deps.knowledgeRepositoryProjectionService ?? null;
  const noteCommitService = deps.knowledgeNoteCommitService ?? null;
  const unavailable = <T>(): Promise<Result<T>> =>
    Promise.resolve(
      fail({
        code: 'SERVICE_UNAVAILABLE',
        message: 'GitHub App knowledge repository connections are not configured',
      }),
    );

  return {
    startKnowledgeRepositoryInstallation: async (ctx, request) =>
      connectionService
        ? connectionService.startInstallation(ctx.identityId, request)
        : unavailable(),
    completeKnowledgeRepositoryInstallation: async (ctx, request) =>
      connectionService
        ? connectionService.completeInstallation(ctx.identityId, request)
        : unavailable(),
    listKnowledgeRepositoryConnections: async (ctx) =>
      connectionService ? connectionService.list(ctx.identityId) : unavailable(),
    connectKnowledgeRepository: async (ctx, request) =>
      connectionService ? connectionService.connect(ctx.identityId, request) : unavailable(),
    disconnectKnowledgeRepository: async (ctx, connectionId, purgeCloudData) =>
      connectionService
        ? connectionService.disconnect(ctx.identityId, connectionId, purgeCloudData)
        : unavailable(),
    issueDesktopKnowledgeRepositoryToken: async (ctx, connectionId) => {
      const deviceType = ctx.device?.deviceType?.toLowerCase();
      if (deviceType !== 'desktop') {
        return fail({
          code: 'FORBIDDEN',
          message: 'GitHub installation tokens are available only to Desktop clients',
        });
      }
      return connectionService
        ? connectionService.issueInstallationToken(ctx.identityId, connectionId)
        : unavailable();
    },
    previewKnowledgeRepositoryReconciliation: async (ctx, connectionId, request) => {
      const deviceType = ctx.device?.deviceType?.toLowerCase();
      if (deviceType !== 'desktop') {
        return fail({
          code: 'FORBIDDEN',
          message: 'Knowledge repository reconciliation is available only to Desktop clients',
        });
      }
      return connectionService
        ? connectionService.previewFirstReconciliation(ctx.identityId, connectionId, request)
        : unavailable();
    },
    confirmKnowledgeRepositoryHead: async (ctx, connectionId, request) => {
      const deviceType = ctx.device?.deviceType?.toLowerCase();
      if (deviceType !== 'desktop') {
        return fail({
          code: 'FORBIDDEN',
          message: 'Knowledge repository head confirmation is available only to Desktop clients',
        });
      }
      return connectionService
        ? connectionService.confirmHead(ctx.identityId, connectionId, request)
        : unavailable();
    },
    listKnowledgeNoteProjections: async (ctx, request) =>
      projectionService
        ? projectionService.listNotes(ctx.identityId, request)
        : Promise.resolve(ok({ notes: [] })),
    getKnowledgeNoteProjection: async (ctx, projectionId) =>
      projectionService
        ? projectionService.getNote(ctx.identityId, projectionId)
        : unavailable(),
    getKnowledgeNoteLinkGraph: async (ctx, projectionId, request) =>
      projectionService
        ? projectionService.getLinkGraph(ctx.identityId, projectionId, request)
        : unavailable(),
    listKnowledgeAttachmentProjections: async (ctx, request) =>
      projectionService
        ? projectionService.listAttachments(ctx.identityId, request)
        : unavailable(),
    getKnowledgeAttachmentContent: async (ctx, projectionId) =>
      projectionService
        ? projectionService.getAttachmentContent(ctx.identityId, projectionId)
        : unavailable(),
    createConfirmedKnowledgeNote: async (ctx, request) =>
      noteCommitService
        ? noteCommitService.create(ctx.identityId, request)
        : unavailable(),
    updateKnowledgeNoteProjectionIndexStatus: async (ctx, request) =>
      projectionService
        ? projectionService.updateIndexStatus(ctx.identityId, request)
        : unavailable(),
    ingestGithubWebhook: async (request) =>
      projectionService ? projectionService.ingest(request) : unavailable(),
  };
}

export function createRepositoryModule(
  dependencies: RepositoryModuleDependencies,
): RepositoryModuleInstance {
  const runtimeContributions = normalizeRuntimeContributions(dependencies.runtimeContributions);
  let started = false;
  const api = buildApplicationPort(dependencies);

  return {
    knowledgeRepositoryConnectionService: dependencies.knowledgeRepositoryConnectionService ?? null,
    knowledgeRepositoryProjectionService: dependencies.knowledgeRepositoryProjectionService ?? null,
    knowledgeNoteCommitService: dependencies.knowledgeNoteCommitService ?? null,
    api,
    start() {
      if (started) return;
      for (const contribution of runtimeContributions) {
        contribution.start();
      }
      started = true;
    },
    dispose() {
      if (!started) return;
      for (const contribution of [...runtimeContributions].reverse()) {
        contribution.stop();
      }
      started = false;
    },
  };
}
