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
  IKnowledgeRepositoryInstallationStateStore,
} from '../ports/github-app-client.port';
import { GitHubAppClientError } from '../ports/github-app-client.port';
import type { IKnowledgeRepositoryConnectionRepository } from '../ports/knowledge-repository-connection.repository';
import type { IKnowledgeRepositoryCloudDataPurger } from '../ports/knowledge-repository-cloud-data-purger.port';

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

export interface KnowledgeRepositoryConnectionServiceOptions {
  appSlug: string;
  connectionRepository: IKnowledgeRepositoryConnectionRepository;
  cloudDataPurger?: IKnowledgeRepositoryCloudDataPurger;
  githubAppClient: IGitHubAppClient;
  stateStore: IKnowledgeRepositoryInstallationStateStore;
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
    const issued = this.options.stateStore.issue(identityId, request.returnUrl);
    const search = new URLSearchParams({ state: issued.state });
    return ok({
      installationUrl: `https://github.com/apps/${encodeURIComponent(this.options.appSlug)}/installations/new?${search.toString()}`,
      expiresAt: issued.expiresAt,
    });
  }

  async completeInstallation(
    identityId: string,
    request: CompleteKnowledgeRepositoryInstallationReq,
  ): Promise<Result<CompleteKnowledgeRepositoryInstallationRes>> {
    const state = this.options.stateStore.consume(request.state);
    if (!state || state.identityId !== identityId || state.expiresAt <= this.now()) {
      return fail({ code: 'VALIDATION_ERROR', message: 'GitHub installation state is invalid' });
    }

    try {
      const inventory = await this.options.githubAppClient.getInstallationInventory(
        request.installationId,
      );
      if (inventory.suspended) {
        return fail({ code: 'FORBIDDEN', message: 'GitHub App installation is suspended' });
      }
      if (inventory.contentsPermission !== 'write') {
        return fail({
          code: 'FORBIDDEN',
          message: 'GitHub App installation requires Contents write permission',
        });
      }
      this.options.stateStore.claimInstallation(identityId, request.installationId);
      return ok({
        installationId: request.installationId,
        githubAccountId: inventory.accountId,
        repositories: inventory.repositories,
        returnUrl: state.returnUrl,
      });
    } catch (error) {
      return fail({
        code: 'SERVICE_UNAVAILABLE',
        message: error instanceof Error ? error.message : 'GitHub installation lookup failed',
      });
    }
  }

  async connect(
    identityId: string,
    request: CreateKnowledgeRepositoryConnectionReq,
  ): Promise<Result<KnowledgeRepositoryConnectionClientDTO>> {
    if (!this.options.stateStore.hasInstallationClaim(identityId, request.installationId)) {
      return fail({
        code: 'FORBIDDEN',
        message: 'Complete the GitHub App installation flow before connecting a repository',
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

      const existing = await this.options.connectionRepository.findByGithubRepositoryId(
        repository.id,
      );
      if (existing && existing.identityId !== identityId && existing.deletedAt === null) {
        return fail({
          code: 'CONFLICT',
          message: 'Repository is already connected to another account',
        });
      }

      const timestamp = this.now();
      const connection: KnowledgeRepositoryConnectionServerDTO = {
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
          existing?.createdAt ?? (timestamp as KnowledgeRepositoryConnectionServerDTO['createdAt']),
        updatedAt: timestamp as KnowledgeRepositoryConnectionServerDTO['updatedAt'],
        deletedAt: null,
      };
      await this.options.connectionRepository.save(connection);
      this.options.stateStore.releaseInstallationClaim(identityId, request.installationId);
      return ok(this.toClient(connection));
    } catch (error) {
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
      await this.options.connectionRepository.updateStatus(identityId, connectionId, 'Revoked', null);
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
      if (inventory.error instanceof GitHubAppClientError && inventory.error.status === 404) {
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
