import { randomUUID } from 'node:crypto';
import type { Result } from '@memoflow/contracts/result';
import { fail, ok } from '@memoflow/contracts/result';
import type {
  CompleteKnowledgeRepositoryInstallationReq,
  CompleteKnowledgeRepositoryInstallationRes,
  ConfirmKnowledgeRepositoryHeadReq,
  CreateKnowledgeRepositoryConnectionReq,
  KnowledgeRepositoryConnectionClientDTO,
  KnowledgeRepositoryConnectionServerDTO,
  KnowledgeRepositoryContentState,
  KnowledgeRepositoryInstallationClientKind,
  KnowledgeRepositoryInstallationIntentStatusResponse,
  KnowledgeRepositoryFirstReconciliationAction,
  KnowledgeRepositoryReconciliationPreview,
  ListKnowledgeRepositoryConnectionsRes,
  PreviewKnowledgeRepositoryReconciliationReq,
  StartKnowledgeRepositoryInstallationReq,
  StartKnowledgeRepositoryInstallationRes,
} from '@memoflow/contracts/repository';
import { KnowledgeRepositoryLifecycleErrorCodes } from '@memoflow/contracts/repository';
import type {
  GitHubAppInstallationInventory,
  IGitHubAppClient,
} from '../ports/github-app-client.port';
import { GitHubAppClientFailureError } from '../ports/github-app-client.port';
import type { IKnowledgeRepositoryConnectionRepository } from '../ports/knowledge-repository-connection.repository';
import type { IKnowledgeRepositoryConnectionWriteTransactionRunner } from '../ports/knowledge-repository-connection-write-transaction.runner';
import type { IKnowledgeRepositoryCloudDataPurger } from '../ports/knowledge-repository-cloud-data-purger.port';
import type {
  IKnowledgeRepositoryInstallationIntentRepository,
  KnowledgeRepositoryInstallationIntentRecord,
} from '../ports/knowledge-repository-installation-intent.repository';
import type {
  KnowledgeRepositoryInstallationSetupRequest,
  KnowledgeRepositoryInstallationSetupResolution,
} from '../ports/knowledge-repository-connection.service.port';
import {
  createKnowledgeRepositoryInstallationState,
  hashKnowledgeRepositoryInstallationState,
  parseKnowledgeRepositoryInstallationStateRouteKey,
} from './knowledge-repository-installation-state';

function firstReconciliationAction(
  localState: KnowledgeRepositoryContentState,
  remoteState: KnowledgeRepositoryContentState,
): KnowledgeRepositoryFirstReconciliationAction {
  if (localState === 'NonEmpty' && remoteState === 'Empty') {
    return 'InitializeRemoteFromLocal';
  }
  if (localState === 'Empty' && remoteState === 'NonEmpty') {
    return 'CloneRemoteIntoLocal';
  }
  if (localState === 'Empty' && remoteState === 'Empty') {
    return 'InitializeBoth';
  }
  return 'ManualResolutionRequired';
}

const DEFAULT_INSTALLATION_RETURN_PATH = '/settings?tab=repository';
const INSTALLATION_INTENT_TTL_MS = 10 * 60 * 1000;
const VERIFIED_INSTALLATION_RETRY_WINDOW_MS = 24 * 60 * 60 * 1000;
const INSTALLATION_SETUP_PATH = '/api/v1/repositories/knowledge-connections/installations/setup';

export interface KnowledgeRepositoryInstallationRoutingConfig {
  routeKey: string;
  webOrigin: string;
  routeTargets?: Readonly<Record<string, string>>;
}

function normalizeOrigin(value: string): string {
  return new URL(value).origin;
}

function normalizeReturnPath(returnUrl: string | undefined, webOrigin: string): string | null {
  if (!returnUrl) return DEFAULT_INSTALLATION_RETURN_PATH;
  try {
    const url = new URL(returnUrl);
    if (url.origin !== normalizeOrigin(webOrigin)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function buildWebReturnUrl(webOrigin: string, returnPath: string, intentId: string): string {
  const url = new URL(returnPath, `${normalizeOrigin(webOrigin)}/`);
  url.searchParams.set('installation_intent', intentId);
  return url.toString();
}

class KnowledgeRepositoryConnectionCommitError extends Error {
  constructor(
    readonly code: 'FORBIDDEN' | 'CONFLICT',
    message: string,
  ) {
    super(message);
    this.name = 'KnowledgeRepositoryConnectionCommitError';
  }
}

function buildSetupRouteUrl(
  apiBaseUrl: string,
  request: KnowledgeRepositoryInstallationSetupRequest,
): string {
  const url = new URL(INSTALLATION_SETUP_PATH, `${normalizeOrigin(apiBaseUrl)}/`);
  url.searchParams.set('state', request.state);
  url.searchParams.set('installation_id', request.installationId);
  if (request.setupAction) url.searchParams.set('setup_action', request.setupAction);
  return url.toString();
}

export interface KnowledgeRepositoryConnectionServiceOptions {
  appSlug: string;
  connectionRepository: IKnowledgeRepositoryConnectionRepository;
  connectionWriteTransactionRunner: IKnowledgeRepositoryConnectionWriteTransactionRunner;
  cloudDataPurger?: IKnowledgeRepositoryCloudDataPurger;
  githubAppClient: IGitHubAppClient;
  installationIntentRepository: IKnowledgeRepositoryInstallationIntentRepository;
  installationRouting: KnowledgeRepositoryInstallationRoutingConfig;
  now?: () => number;
}

export class KnowledgeRepositoryConnectionService {
  private readonly now: () => number;

  constructor(private readonly options: KnowledgeRepositoryConnectionServiceOptions) {
    this.now = options.now ?? Date.now;
  }

  async startInstallation(
    identityId: string,
    request: StartKnowledgeRepositoryInstallationReq,
  ): Promise<Result<StartKnowledgeRepositoryInstallationRes>> {
    const returnPath = normalizeReturnPath(
      request.returnUrl,
      this.options.installationRouting.webOrigin,
    );
    if (!returnPath) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'GitHub installation return URL must use the configured MemoFlow Web origin',
      });
    }

    try {
      const now = this.now();
      const expiresAt = now + INSTALLATION_INTENT_TTL_MS;
      const clientKind: KnowledgeRepositoryInstallationClientKind = request.clientKind ?? 'web';

      if (clientKind === 'desktop') {
        const recovered = await this.tryRecoverVerifiedDesktopIntent(identityId, now, expiresAt);
        if (!recovered.ok) return recovered;
        if (recovered.data) {
          return ok({
            intentId: recovered.data.id,
            installationUrl: `https://github.com/apps/${encodeURIComponent(this.options.appSlug)}/installations/new`,
            expiresAt: recovered.data.expiresAt,
            requiresExternalBrowser: false,
          });
        }
      }

      const intentId = `knowledge-install-intent-${randomUUID()}`;
      const state = createKnowledgeRepositoryInstallationState(
        this.options.installationRouting.routeKey,
      );
      await this.options.installationIntentRepository.create({
        id: intentId,
        identityId,
        stateHash: state.stateHash,
        routeKey: state.routeKey,
        clientKind,
        returnPath,
        expiresAt,
        createdAt: now,
      });
      const search = new URLSearchParams({ state: state.state });
      return ok({
        intentId,
        installationUrl: `https://github.com/apps/${encodeURIComponent(this.options.appSlug)}/installations/new?${search.toString()}`,
        expiresAt,
        requiresExternalBrowser: true,
      });
    } catch (error) {
      return fail({
        code: 'SERVICE_UNAVAILABLE',
        message: error instanceof Error ? error.message : 'GitHub installation start failed',
      });
    }
  }

  async receiveInstallationSetup(
    request: KnowledgeRepositoryInstallationSetupRequest,
  ): Promise<Result<KnowledgeRepositoryInstallationSetupResolution>> {
    const routeKey = parseKnowledgeRepositoryInstallationStateRouteKey(request.state);
    if (!routeKey) {
      return fail({ code: 'VALIDATION_ERROR', message: 'GitHub installation state is invalid' });
    }

    if (routeKey !== this.options.installationRouting.routeKey) {
      const target = this.options.installationRouting.routeTargets?.[routeKey];
      if (!target) {
        return fail({
          code: 'FORBIDDEN',
          message: 'GitHub installation state targets an unconfigured environment',
        });
      }
      return ok({ kind: 'redirect', location: buildSetupRouteUrl(target, request) });
    }

    const stateHash = hashKnowledgeRepositoryInstallationState(request.state);
    const intent = await this.options.installationIntentRepository.findByStateHash(stateHash);
    if (!intent || intent.routeKey !== routeKey) {
      return fail({ code: 'VALIDATION_ERROR', message: 'GitHub installation state is invalid' });
    }
    if (intent.expiresAt <= this.now()) {
      return fail({ code: 'VALIDATION_ERROR', message: 'GitHub installation state has expired' });
    }

    const inventoryResult = await this.getValidInstallationInventory(request.installationId);
    if (!inventoryResult.ok) return inventoryResult;
    const callback = await this.options.installationIntentRepository.recordCallback({
      stateHash,
      installationId: request.installationId,
      providerAccountId: inventoryResult.data.accountId,
      setupAction: request.setupAction ?? 'install',
      now: this.now(),
    });
    if (callback.kind === 'not_found' || callback.kind === 'expired') {
      return fail({ code: 'VALIDATION_ERROR', message: 'GitHub installation state is invalid' });
    }
    if (callback.kind === 'conflict') {
      return fail({
        code: 'CONFLICT',
        message: 'GitHub installation state was already used by another installation',
      });
    }

    const resolvedIntent = callback.intent;
    if (resolvedIntent.clientKind === 'desktop') {
      return ok({
        kind: 'desktop',
        intentId: resolvedIntent.id,
        expiresAt: resolvedIntent.expiresAt,
      });
    }
    return ok({
      kind: 'web',
      intentId: resolvedIntent.id,
      location: buildWebReturnUrl(
        this.options.installationRouting.webOrigin,
        resolvedIntent.returnPath,
        resolvedIntent.id,
      ),
    });
  }

  async getInstallationIntentStatus(
    identityId: string,
    intentId: string,
  ): Promise<Result<KnowledgeRepositoryInstallationIntentStatusResponse>> {
    const intent = await this.options.installationIntentRepository.findByIdForIdentity(
      identityId,
      intentId,
    );
    if (!intent) {
      return fail({ code: 'NOT_FOUND', message: 'GitHub installation intent was not found' });
    }
    return ok({
      intentId: intent.id,
      status:
        intent.expiresAt <= this.now() && intent.status !== 'Consumed' ? 'Expired' : intent.status,
      clientKind: intent.clientKind,
      expiresAt: intent.expiresAt,
      installationId: intent.installationId,
    });
  }

  async finalizeInstallationIntent(
    identityId: string,
    intentId: string,
  ): Promise<Result<CompleteKnowledgeRepositoryInstallationRes>> {
    const intent = await this.options.installationIntentRepository.findByIdForIdentity(
      identityId,
      intentId,
    );
    if (!intent) {
      return fail({ code: 'NOT_FOUND', message: 'GitHub installation intent was not found' });
    }
    if (intent.expiresAt <= this.now()) {
      return fail({ code: 'VALIDATION_ERROR', message: 'GitHub installation intent has expired' });
    }
    if (!intent.installationId || !intent.providerAccountId) {
      return fail({
        code: 'CONFLICT',
        message: 'GitHub installation callback has not been received yet',
      });
    }
    if (intent.status !== 'CallbackReceived' && intent.status !== 'Finalized') {
      return fail({
        code: 'CONFLICT',
        message: 'GitHub installation intent cannot be finalized from its current state',
      });
    }

    const inventoryResult = await this.getValidInstallationInventory(intent.installationId);
    if (!inventoryResult.ok) return inventoryResult;
    if (inventoryResult.data.accountId !== intent.providerAccountId) {
      return fail({
        code: 'CONFLICT',
        message: 'GitHub installation account changed before finalization',
      });
    }
    const finalized = await this.options.installationIntentRepository.markFinalized({
      identityId,
      intentId,
      installationId: intent.installationId,
      providerAccountId: inventoryResult.data.accountId,
      now: this.now(),
    });
    if (!finalized) {
      return fail({
        code: 'CONFLICT',
        message: 'GitHub installation intent could not be finalized',
      });
    }
    return ok({
      installationId: intent.installationId,
      githubAccountId: inventoryResult.data.accountId,
      repositories: inventoryResult.data.repositories,
      returnUrl: new URL(
        finalized.returnPath,
        `${normalizeOrigin(this.options.installationRouting.webOrigin)}/`,
      ).toString(),
    });
  }

  async completeInstallation(
    identityId: string,
    request: CompleteKnowledgeRepositoryInstallationReq,
  ): Promise<Result<CompleteKnowledgeRepositoryInstallationRes>> {
    const routeKey = parseKnowledgeRepositoryInstallationStateRouteKey(request.state);
    if (!routeKey || routeKey !== this.options.installationRouting.routeKey) {
      return fail({ code: 'VALIDATION_ERROR', message: 'GitHub installation state is invalid' });
    }
    const stateHash = hashKnowledgeRepositoryInstallationState(request.state);
    const intent = await this.options.installationIntentRepository.findByStateHash(stateHash);
    if (!intent || intent.identityId !== identityId || intent.expiresAt <= this.now()) {
      return fail({ code: 'VALIDATION_ERROR', message: 'GitHub installation state is invalid' });
    }

    const inventoryResult = await this.getValidInstallationInventory(request.installationId);
    if (!inventoryResult.ok) return inventoryResult;
    const callback = await this.options.installationIntentRepository.recordCallback({
      stateHash,
      installationId: request.installationId,
      providerAccountId: inventoryResult.data.accountId,
      setupAction: request.setupAction ?? 'install',
      now: this.now(),
    });
    if (callback.kind === 'not_found' || callback.kind === 'expired') {
      return fail({ code: 'VALIDATION_ERROR', message: 'GitHub installation state is invalid' });
    }
    if (callback.kind === 'conflict') {
      return fail({ code: 'CONFLICT', message: 'GitHub installation state is already bound' });
    }
    return this.finalizeInstallationIntent(identityId, intent.id);
  }

  async connect(
    identityId: string,
    request: CreateKnowledgeRepositoryConnectionReq,
  ): Promise<Result<KnowledgeRepositoryConnectionClientDTO>> {
    const finalizedIntent = await this.options.installationIntentRepository.findUsableFinalized(
      identityId,
      request.installationId,
      this.now(),
    );
    if (!finalizedIntent) {
      return fail({
        code: 'FORBIDDEN',
        message: 'Finalize the GitHub App installation before connecting a repository',
      });
    }

    try {
      const inventory = await this.options.githubAppClient.getInstallationInventory(
        request.installationId,
      );
      if (inventory.suspended) {
        return fail({ code: 'FORBIDDEN', message: 'GitHub App installation is suspended' });
      }
      const repository = inventory.repositories.find(
        (candidate) => candidate.id === request.githubRepositoryId,
      );
      if (!repository) {
        return fail({ code: 'NOT_FOUND', message: 'Repository is not part of this installation' });
      }
      if (!repository.private) {
        return fail({ code: 'FORBIDDEN', message: 'Knowledge repositories must be private' });
      }
      if (repository.archived || repository.disabled) {
        return fail({
          code: 'FORBIDDEN',
          message: 'Archived or disabled repositories cannot connect',
        });
      }
      if (!repository.permissions.push) {
        return fail({
          code: 'FORBIDDEN',
          message: 'Repository push (contents write) permission is required',
        });
      }
      if (inventory.contentsPermission !== 'write') {
        return fail({ code: 'FORBIDDEN', message: 'Contents write permission is required' });
      }

      const timestamp = this.now();
      const connection = await this.options.connectionWriteTransactionRunner.run(
        async ({ connectionRepository, installationIntentRepository }) => {
          const transactionalIntent = await installationIntentRepository.findUsableFinalized(
            identityId,
            request.installationId,
            timestamp,
          );
          if (!transactionalIntent || transactionalIntent.id !== finalizedIntent.id) {
            throw new KnowledgeRepositoryConnectionCommitError(
              'FORBIDDEN',
              'GitHub installation intent is no longer available for connection',
            );
          }

          const existing = await connectionRepository.findByGithubRepositoryId(repository.id);
          if (existing && existing.identityId !== identityId) {
            throw new KnowledgeRepositoryConnectionCommitError(
              'CONFLICT',
              'Repository is already associated with another account',
            );
          }

          const next: KnowledgeRepositoryConnectionServerDTO = {
            id: existing?.id ?? `knowledge-connection-${randomUUID()}`,
            identityId: identityId as KnowledgeRepositoryConnectionServerDTO['identityId'],
            githubUserId: inventory.accountId,
            githubRepositoryId: repository.id,
            githubRepositoryFullName: repository.fullName,
            installationId: request.installationId,
            defaultBranch: repository.defaultBranch,
            status: 'Active',
            lastSyncedCommitSha: existing?.lastSyncedCommitSha ?? null,
            lastProjectedCommitSha: existing?.lastProjectedCommitSha ?? null,
            lastErrorCode: null,
            lastErrorMessage: null,
            version: (existing?.version ?? 0) + 1,
            createdAt:
              existing?.createdAt ??
              (timestamp as KnowledgeRepositoryConnectionServerDTO['createdAt']),
            updatedAt: timestamp as KnowledgeRepositoryConnectionServerDTO['updatedAt'],
            deletedAt: null,
          };
          await connectionRepository.save(next);
          const consumed = await installationIntentRepository.markConsumed({
            identityId,
            intentId: transactionalIntent.id,
            now: timestamp,
          });
          if (!consumed) {
            throw new KnowledgeRepositoryConnectionCommitError(
              'CONFLICT',
              'GitHub installation intent was consumed concurrently',
            );
          }
          return next;
        },
      );
      return ok(this.toClient(connection));
    } catch (error) {
      if (error instanceof KnowledgeRepositoryConnectionCommitError) {
        return fail({ code: error.code, message: error.message });
      }
      return fail({
        code: 'SERVICE_UNAVAILABLE',
        message: error instanceof Error ? error.message : 'GitHub repository connection failed',
      });
    }
  }

  async list(identityId: string): Promise<Result<ListKnowledgeRepositoryConnectionsRes>> {
    const connections = await this.options.connectionRepository.findByIdentityId(identityId);
    const visibleConnections = connections.filter((connection) => connection.deletedAt === null);
    const inventoryLookups = new Map<
      string,
      Promise<{ ok: true; data: GitHubAppInstallationInventory } | { ok: false; error: unknown }>
    >();
    for (const connection of visibleConnections) {
      if (!inventoryLookups.has(connection.installationId)) {
        inventoryLookups.set(
          connection.installationId,
          this.options.githubAppClient
            .getInstallationInventory(connection.installationId)
            .then((data) => ({ ok: true as const, data }))
            .catch((error: unknown) => ({ ok: false as const, error })),
        );
      }
    }
    const refreshed = await Promise.all(
      visibleConnections.map((connection) =>
        this.refreshLifecycle(connection, inventoryLookups.get(connection.installationId)!),
      ),
    );
    return ok({
      connections: refreshed.map((connection) => this.toClient(connection)),
    });
  }

  async disconnect(
    identityId: string,
    connectionId: string,
    purgeCloudData = false,
  ): Promise<Result<null>> {
    const connection = await this.options.connectionRepository.findByIdForIdentity(
      identityId,
      connectionId,
    );
    if (!connection || connection.deletedAt !== null) {
      return fail({ code: 'NOT_FOUND', message: 'Knowledge repository connection was not found' });
    }
    if (purgeCloudData) {
      if (!this.options.cloudDataPurger) {
        return fail({
          code: 'SERVICE_UNAVAILABLE',
          message: 'Cloud data purge is not configured for this runtime',
        });
      }
      const purged = await this.options.cloudDataPurger.purge(identityId, connectionId);
      if (!purged) {
        return fail({
          code: 'NOT_FOUND',
          message: 'Knowledge repository connection was not found',
        });
      }
    } else {
      await this.options.connectionRepository.updateStatus(
        identityId,
        connectionId,
        'Revoked',
        null,
      );
    }
    return ok(null);
  }

  async issueInstallationToken(
    identityId: string,
    connectionId: string,
  ): Promise<Result<{ token: string; expiresAt: number; repositoryId: string }>> {
    const connection = await this.options.connectionRepository.findByIdForIdentity(
      identityId,
      connectionId,
    );
    if (!connection || connection.status !== 'Active' || connection.deletedAt !== null) {
      return fail({
        code: 'NOT_FOUND',
        message: 'Active knowledge repository connection was not found',
      });
    }
    try {
      const refreshed = await this.refreshLifecycle(
        connection,
        this.options.githubAppClient
          .getInstallationInventory(connection.installationId)
          .then((data) => ({ ok: true as const, data }))
          .catch((error: unknown) => ({ ok: false as const, error })),
      );
      if (refreshed.status !== 'Active') {
        return fail({
          code: 'FORBIDDEN',
          message: 'Knowledge repository authorization requires attention before synchronization',
          context: { lifecycleErrorCode: refreshed.lastErrorCode },
        });
      }
      const token = await this.options.githubAppClient.createInstallationAccessToken(
        refreshed.installationId,
        refreshed.githubRepositoryId,
      );
      return ok({
        token: token.token,
        expiresAt: token.expiresAt,
        repositoryId: refreshed.githubRepositoryId,
      });
    } catch (error) {
      return fail({
        code: 'SERVICE_UNAVAILABLE',
        message:
          error instanceof Error ? error.message : 'GitHub installation token issuance failed',
      });
    }
  }

  async previewFirstReconciliation(
    identityId: string,
    connectionId: string,
    request: PreviewKnowledgeRepositoryReconciliationReq,
  ): Promise<Result<KnowledgeRepositoryReconciliationPreview>> {
    const connection = await this.options.connectionRepository.findByIdForIdentity(
      identityId,
      connectionId,
    );
    if (!connection || connection.status !== 'Active' || connection.deletedAt !== null) {
      return fail({
        code: 'NOT_FOUND',
        message: 'Active knowledge repository connection was not found',
      });
    }

    try {
      const inventory = await this.options.githubAppClient.getInstallationInventory(
        connection.installationId,
      );
      if (inventory.suspended) {
        return fail({ code: 'FORBIDDEN', message: 'GitHub App installation is suspended' });
      }
      if (inventory.contentsPermission !== 'write') {
        return fail({ code: 'FORBIDDEN', message: 'Contents write permission is required' });
      }
      const repository = inventory.repositories.find(
        (candidate) => candidate.id === connection.githubRepositoryId,
      );
      if (!repository) {
        return fail({ code: 'NOT_FOUND', message: 'Repository is not part of this installation' });
      }
      if (
        !repository.private ||
        repository.archived ||
        repository.disabled ||
        !repository.permissions.push
      ) {
        return fail({
          code: 'FORBIDDEN',
          message: 'Repository no longer satisfies knowledge repository requirements',
        });
      }

      const snapshot = await this.options.githubAppClient.getRepositorySnapshot(
        connection.installationId,
        repository,
      );
      const remoteState: KnowledgeRepositoryContentState = snapshot.empty ? 'Empty' : 'NonEmpty';
      return ok({
        connectionId,
        localState: request.localState,
        remoteState,
        action: firstReconciliationAction(request.localState, remoteState),
        defaultBranch: snapshot.defaultBranch,
        remoteHeadSha: snapshot.headSha,
      });
    } catch (error) {
      return fail({
        code: 'SERVICE_UNAVAILABLE',
        message:
          error instanceof Error ? error.message : 'GitHub repository reconciliation check failed',
      });
    }
  }

  async confirmHead(
    identityId: string,
    connectionId: string,
    request: ConfirmKnowledgeRepositoryHeadReq,
  ): Promise<Result<KnowledgeRepositoryConnectionClientDTO>> {
    const connection = await this.options.connectionRepository.findByIdForIdentity(
      identityId,
      connectionId,
    );
    if (!connection || connection.status !== 'Active' || connection.deletedAt !== null) {
      return fail({
        code: 'NOT_FOUND',
        message: 'Active knowledge repository connection was not found',
      });
    }

    try {
      const inventory = await this.options.githubAppClient.getInstallationInventory(
        connection.installationId,
      );
      if (inventory.suspended || inventory.contentsPermission !== 'write') {
        return fail({
          code: 'FORBIDDEN',
          message: 'GitHub App installation is unavailable or lacks Contents write permission',
        });
      }
      const repository = inventory.repositories.find(
        (candidate) => candidate.id === connection.githubRepositoryId,
      );
      if (
        !repository ||
        !repository.private ||
        repository.archived ||
        repository.disabled ||
        !repository.permissions.push
      ) {
        return fail({
          code: 'FORBIDDEN',
          message: 'Repository no longer satisfies knowledge repository requirements',
        });
      }

      const snapshot = await this.options.githubAppClient.getRepositorySnapshot(
        connection.installationId,
        repository,
      );
      if (snapshot.headSha !== request.headSha) {
        return fail({
          code: 'CONFLICT',
          message: 'GitHub default branch changed before reconciliation was confirmed',
        });
      }

      const timestamp = this.now();
      const updated: KnowledgeRepositoryConnectionServerDTO = {
        ...connection,
        defaultBranch: snapshot.defaultBranch,
        status: 'Active',
        lastSyncedCommitSha: request.headSha,
        lastErrorCode: null,
        lastErrorMessage: null,
        version: connection.version + 1,
        updatedAt: timestamp as KnowledgeRepositoryConnectionServerDTO['updatedAt'],
      };
      await this.options.connectionRepository.save(updated);
      return ok(this.toClient(updated));
    } catch (error) {
      return fail({
        code: 'SERVICE_UNAVAILABLE',
        message:
          error instanceof Error ? error.message : 'GitHub repository HEAD confirmation failed',
      });
    }
  }

  private async tryRecoverVerifiedDesktopIntent(
    identityId: string,
    now: number,
    expiresAt: number,
  ): Promise<Result<KnowledgeRepositoryInstallationIntentRecord | null>> {
    const notBefore = now - VERIFIED_INSTALLATION_RETRY_WINDOW_MS;
    const candidate = await this.options.installationIntentRepository.findLatestRecoverableVerified(
      identityId,
      this.options.installationRouting.routeKey,
      notBefore,
    );
    if (!candidate?.installationId || !candidate.providerAccountId) return ok(null);

    let inventory: GitHubAppInstallationInventory;
    try {
      inventory = await this.options.githubAppClient.getInstallationInventory(
        candidate.installationId,
      );
    } catch (error) {
      if (error instanceof GitHubAppClientFailureError && error.failure.kind === 'not_found') {
        return ok(null);
      }
      return fail({
        code: 'SERVICE_UNAVAILABLE',
        message: error instanceof Error ? error.message : 'GitHub installation lookup failed',
      });
    }
    if (
      inventory.suspended ||
      inventory.contentsPermission !== 'write' ||
      inventory.accountId !== candidate.providerAccountId
    ) {
      return ok(null);
    }

    return ok(
      await this.options.installationIntentRepository.renewVerifiedForRetry({
        identityId,
        intentId: candidate.id,
        installationId: candidate.installationId,
        providerAccountId: candidate.providerAccountId,
        notBefore,
        expiresAt,
        now,
      }),
    );
  }

  private async getValidInstallationInventory(
    installationId: string,
  ): Promise<Result<GitHubAppInstallationInventory>> {
    try {
      const inventory = await this.options.githubAppClient.getInstallationInventory(installationId);
      if (inventory.suspended) {
        return fail({ code: 'FORBIDDEN', message: 'GitHub App installation is suspended' });
      }
      if (inventory.contentsPermission !== 'write') {
        return fail({
          code: 'FORBIDDEN',
          message: 'GitHub App installation requires Contents write permission',
        });
      }
      return ok(inventory);
    } catch (error) {
      return fail({
        code: 'SERVICE_UNAVAILABLE',
        message: error instanceof Error ? error.message : 'GitHub installation lookup failed',
      });
    }
  }

  private toClient(
    connection: KnowledgeRepositoryConnectionServerDTO,
  ): KnowledgeRepositoryConnectionClientDTO {
    return {
      id: connection.id,
      identityId: connection.identityId,
      githubUserId: connection.githubUserId,
      githubRepositoryId: connection.githubRepositoryId,
      githubRepositoryFullName: connection.githubRepositoryFullName,
      installationId: connection.installationId,
      defaultBranch: connection.defaultBranch,
      status: connection.status,
      lastSyncedCommitSha: connection.lastSyncedCommitSha,
      lastErrorCode: connection.lastErrorCode,
      canSync: connection.status === 'Active',
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  }

  private async refreshLifecycle(
    connection: KnowledgeRepositoryConnectionServerDTO,
    inventoryLookup: Promise<
      { ok: true; data: GitHubAppInstallationInventory } | { ok: false; error: unknown }
    >,
  ): Promise<KnowledgeRepositoryConnectionServerDTO> {
    const inventory = await inventoryLookup;
    if (!inventory.ok) {
      if (
        inventory.error instanceof GitHubAppClientFailureError &&
        inventory.error.failure.kind === 'not_found'
      ) {
        return this.persistLifecycle(connection, {
          status: 'Revoked',
          lastErrorCode: KnowledgeRepositoryLifecycleErrorCodes.InstallationNotFound,
          lastErrorMessage: 'GitHub App installation no longer exists',
        });
      }
      if (connection.status !== 'Active') return connection;
      return this.persistLifecycle(connection, {
        lastErrorCode: KnowledgeRepositoryLifecycleErrorCodes.CheckUnavailable,
        lastErrorMessage: 'GitHub repository lifecycle check is temporarily unavailable',
      });
    }

    if (inventory.data.suspended) {
      return this.persistLifecycle(connection, {
        status: 'Suspended',
        lastErrorCode: KnowledgeRepositoryLifecycleErrorCodes.InstallationSuspended,
        lastErrorMessage: 'GitHub App installation is suspended',
      });
    }
    if (inventory.data.contentsPermission !== 'write') {
      return this.persistLifecycle(connection, {
        status: 'Suspended',
        lastErrorCode: KnowledgeRepositoryLifecycleErrorCodes.ContentsPermissionRequired,
        lastErrorMessage: 'GitHub App Contents write permission is required',
      });
    }

    const repository = inventory.data.repositories.find(
      (candidate) => candidate.id === connection.githubRepositoryId,
    );
    if (!repository) {
      return this.persistLifecycle(connection, {
        status: 'Revoked',
        lastErrorCode: KnowledgeRepositoryLifecycleErrorCodes.RepositoryAccessLost,
        lastErrorMessage: 'Repository was deleted or removed from the GitHub App installation',
      });
    }
    if (!repository.private) {
      return this.persistLifecycle(connection, {
        status: 'Suspended',
        lastErrorCode: KnowledgeRepositoryLifecycleErrorCodes.RepositoryPublic,
        lastErrorMessage: 'Knowledge repository is public; synchronization is paused',
      });
    }
    if (repository.archived) {
      return this.persistLifecycle(connection, {
        status: 'Suspended',
        lastErrorCode: KnowledgeRepositoryLifecycleErrorCodes.RepositoryArchived,
        lastErrorMessage: 'Knowledge repository is archived',
      });
    }
    if (repository.disabled) {
      return this.persistLifecycle(connection, {
        status: 'Suspended',
        lastErrorCode: KnowledgeRepositoryLifecycleErrorCodes.RepositoryDisabled,
        lastErrorMessage: 'Knowledge repository is disabled',
      });
    }
    if (!repository.permissions.push) {
      return this.persistLifecycle(connection, {
        status: 'Suspended',
        lastErrorCode: KnowledgeRepositoryLifecycleErrorCodes.RepositoryAdminRequired,
        lastErrorMessage: 'Repository push (contents write) permission is required',
      });
    }
    if (connection.lastSyncedCommitSha && repository.defaultBranch !== connection.defaultBranch) {
      return this.persistLifecycle(connection, {
        status: 'Suspended',
        githubRepositoryFullName: repository.fullName,
        githubUserId: inventory.data.accountId,
        lastErrorCode: KnowledgeRepositoryLifecycleErrorCodes.DefaultBranchChanged,
        lastErrorMessage: 'GitHub default branch changed; repository reconciliation is required',
      });
    }

    return this.persistLifecycle(connection, {
      status: 'Active',
      githubRepositoryFullName: repository.fullName,
      githubUserId: inventory.data.accountId,
      defaultBranch: repository.defaultBranch,
      lastErrorCode: null,
      lastErrorMessage: null,
    });
  }

  private async persistLifecycle(
    connection: KnowledgeRepositoryConnectionServerDTO,
    patch: Partial<
      Pick<
        KnowledgeRepositoryConnectionServerDTO,
        | 'githubUserId'
        | 'githubRepositoryFullName'
        | 'defaultBranch'
        | 'status'
        | 'lastErrorCode'
        | 'lastErrorMessage'
      >
    >,
  ): Promise<KnowledgeRepositoryConnectionServerDTO> {
    const changed = Object.entries(patch).some(
      ([key, value]) => connection[key as keyof typeof connection] !== value,
    );
    if (!changed) return connection;
    const updated: KnowledgeRepositoryConnectionServerDTO = {
      ...connection,
      ...patch,
      version: connection.version + 1,
      updatedAt: this.now() as KnowledgeRepositoryConnectionServerDTO['updatedAt'],
    };
    await this.options.connectionRepository.save(updated);
    return updated;
  }
}
