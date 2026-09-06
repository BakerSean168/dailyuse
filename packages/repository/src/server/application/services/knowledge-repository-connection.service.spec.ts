import { describe, expect, it, vi } from 'vitest';
import {
  KnowledgeRepositoryLifecycleErrorCodes,
  type GitHubInstallationRepositoryDTO,
  type KnowledgeRepositoryConnectionServerDTO,
} from '@memoflow/contracts/repository';
import type { IKnowledgeRepositoryConnectionRepository } from '../ports/knowledge-repository-connection.repository';
import type { IKnowledgeRepositoryCloudDataPurger } from '../ports/knowledge-repository-cloud-data-purger.port';
import {
  GitHubAppClientFailureError,
  type GitHubAppInstallationInventory,
  type IGitHubAppClient,
} from '../ports/github-app-client.port';
import { InMemoryKnowledgeRepositoryInstallationIntentRepository } from '../../infrastructure/services/in-memory-knowledge-repository-installation-intent.repository';
import { KnowledgeRepositoryConnectionService } from './knowledge-repository-connection.service';

const SERVICE_NOW = 1_750_000_000_000;

class MemoryConnectionRepository implements IKnowledgeRepositoryConnectionRepository {
  readonly rows = new Map<string, KnowledgeRepositoryConnectionServerDTO>();

  async findById(id: string) {
    return this.rows.get(id) ?? null;
  }

  async findByIdForIdentity(identityId: string, id: string) {
    const row = this.rows.get(id);
    return row && row.identityId === identityId ? row : null;
  }

  async findByIdentityId(identityId: string) {
    return [...this.rows.values()].filter((row) => row.identityId === identityId);
  }

  async findByGithubRepositoryId(githubRepositoryId: string) {
    return (
      [...this.rows.values()].find((row) => row.githubRepositoryId === githubRepositoryId) ?? null
    );
  }

  async listProjectionCandidates(limit: number) {
    return [...this.rows.values()].slice(0, limit);
  }

  async save(connection: KnowledgeRepositoryConnectionServerDTO) {
    const existing = this.rows.get(connection.id);
    if (existing && existing.identityId !== connection.identityId) {
      throw new Error('Knowledge repository connection not found for the current identity.');
    }
    this.rows.set(connection.id, connection);
  }

  async updateStatus(
    identityId: string,
    id: string,
    status: KnowledgeRepositoryConnectionServerDTO['status'],
  ) {
    const row = this.rows.get(id);
    if (!row || row.identityId !== identityId) return;
    this.rows.set(id, {
      ...row,
      status,
      deletedAt: status === 'Revoked' ? (1_750_000_000_000 as never) : null,
    });
  }
}

function createGithubClient(overrides: Partial<IGitHubAppClient> = {}): IGitHubAppClient {
  return {
    getInstallationInventory: vi.fn(async () => installationInventory()),
    createInstallationAccessToken: vi.fn(async () => ({
      token: 'short-lived-token',
      expiresAt: 1_750_000_300_000,
    })),
    getRepositorySnapshot: vi.fn(async () => ({
      repositoryId: 'repository-1',
      defaultBranch: 'main',
      empty: false,
      headSha: 'remote-head-sha',
    })),
    getMarkdownChanges: vi.fn(),
    getFullMarkdownSnapshot: vi.fn(),
    getBlob: vi.fn(),
    createFileCommit: vi.fn(),
    ...overrides,
  };
}

function installationInventory(
  repositoryPatch: Partial<GitHubInstallationRepositoryDTO> = {},
  inventoryPatch: Partial<GitHubAppInstallationInventory> = {},
): GitHubAppInstallationInventory {
  return {
    installationId: 'installation-1',
    accountId: 'github-account-1',
    contentsPermission: 'write',
    suspended: false,
    repositories: [
      {
        id: 'repository-1',
        nodeId: 'R_1',
        fullName: 'owner/knowledge',
        ownerId: 'github-account-1',
        private: true,
        archived: false,
        disabled: false,
        defaultBranch: 'main',
        permissions: { admin: true, push: true, pull: true },
        ...repositoryPatch,
      },
    ],
    ...inventoryPatch,
  };
}

function createService(
  github = createGithubClient(),
  cloudDataPurger?: IKnowledgeRepositoryCloudDataPurger,
  now: () => number = () => SERVICE_NOW,
) {
  const repository = new MemoryConnectionRepository();
  const installationIntentRepository =
    new InMemoryKnowledgeRepositoryInstallationIntentRepository();
  return {
    repository,
    installationIntentRepository,
    github,
    service: new KnowledgeRepositoryConnectionService({
      appSlug: 'memoflow-test',
      connectionRepository: repository,
      connectionWriteTransactionRunner: {
        run: (work) =>
          work({
            connectionRepository: repository,
            installationIntentRepository,
          }),
      },
      githubAppClient: github,
      installationIntentRepository,
      installationRouting: {
        routeKey: 'dev',
        webOrigin: 'https://app.example.test',
        routeTargets: { staging: 'https://staging-api.example.test' },
      },
      cloudDataPurger,
      now,
    }),
  };
}

async function completeInstallation(
  service: KnowledgeRepositoryConnectionService,
  identityId = 'identity-1',
) {
  const started = await service.startInstallation(identityId, {
    returnUrl: 'https://app.example.test/settings/repository',
  });
  if (!started.ok) throw new Error('expected installation URL');
  const state = new URL(started.data.installationUrl).searchParams.get('state')!;
  return service.completeInstallation(identityId, {
    state,
    installationId: 'installation-1',
    setupAction: 'install',
  });
}

describe('KnowledgeRepositoryConnectionService', () => {
  it('issues a durable identity-bound installation state without letting another identity consume it', async () => {
    const { service } = createService();
    const started = await service.startInstallation('identity-1', {
      returnUrl: 'https://app.example.test/settings/repository',
    });
    if (!started.ok) throw new Error('expected ok');
    expect(started.data.intentId).toMatch(/^knowledge-install-intent-/);
    expect(started.data.installationUrl).toContain(
      'https://github.com/apps/memoflow-test/installations/new?state=mfi1.dev.',
    );
    const state = new URL(started.data.installationUrl).searchParams.get('state')!;

    await expect(
      service.completeInstallation('identity-2', {
        state,
        installationId: 'installation-1',
      }),
    ).resolves.toMatchObject({ ok: false, error: { code: 'VALIDATION_ERROR' } });
    await expect(
      service.completeInstallation('identity-1', {
        state,
        installationId: 'installation-1',
      }),
    ).resolves.toMatchObject({ ok: true, data: { installationId: 'installation-1' } });
  });

  it('records a public setup callback but refuses connect until the original identity finalizes', async () => {
    const { service } = createService();
    const started = await service.startInstallation('identity-1', {
      clientKind: 'web',
      returnUrl: 'https://app.example.test/settings?tab=repository',
    });
    if (!started.ok) throw new Error('expected ok');
    const state = new URL(started.data.installationUrl).searchParams.get('state')!;

    const setup = await service.receiveInstallationSetup({
      state,
      installationId: 'installation-1',
      setupAction: 'install',
    });
    expect(setup).toMatchObject({
      ok: true,
      data: {
        kind: 'web',
        intentId: started.data.intentId,
        location: expect.stringContaining(`installation_intent=${started.data.intentId}`),
      },
    });

    await expect(
      service.connect('identity-1', {
        installationId: 'installation-1',
        githubRepositoryId: 'repository-1',
      }),
    ).resolves.toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });

    await expect(
      service.finalizeInstallationIntent('identity-2', started.data.intentId),
    ).resolves.toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
    await expect(
      service.finalizeInstallationIntent('identity-1', started.data.intentId),
    ).resolves.toMatchObject({ ok: true, data: { installationId: 'installation-1' } });
    await expect(
      service.connect('identity-1', {
        installationId: 'installation-1',
        githubRepositoryId: 'repository-1',
      }),
    ).resolves.toMatchObject({ ok: true });
  });

  it('resumes a recent verified Desktop callback after TTL without requiring another GitHub update', async () => {
    let now = SERVICE_NOW;
    const github = createGithubClient();
    const { service } = createService(github, undefined, () => now);
    const started = await service.startInstallation('identity-1', { clientKind: 'desktop' });
    if (!started.ok) throw new Error('expected ok');
    const state = new URL(started.data.installationUrl).searchParams.get('state')!;

    now += 1_000;
    await expect(
      service.receiveInstallationSetup({
        state,
        installationId: 'installation-1',
        setupAction: 'update',
      }),
    ).resolves.toMatchObject({
      ok: true,
      data: { kind: 'desktop', intentId: started.data.intentId },
    });

    now = SERVICE_NOW + 2 * 60 * 60 * 1_000;
    await expect(
      service.getInstallationIntentStatus('identity-1', started.data.intentId),
    ).resolves.toMatchObject({ ok: true, data: { status: 'Expired' } });

    const retried = await service.startInstallation('identity-1', { clientKind: 'desktop' });
    expect(retried).toMatchObject({
      ok: true,
      data: {
        intentId: started.data.intentId,
        requiresExternalBrowser: false,
        expiresAt: now + 10 * 60 * 1_000,
      },
    });
    if (!retried.ok) throw new Error('expected retry');
    expect(new URL(retried.data.installationUrl).searchParams.has('state')).toBe(false);
    expect(github.getInstallationInventory).toHaveBeenCalledWith('installation-1');

    await expect(
      service.getInstallationIntentStatus('identity-1', started.data.intentId),
    ).resolves.toMatchObject({ ok: true, data: { status: 'CallbackReceived' } });
    await expect(
      service.finalizeInstallationIntent('identity-1', started.data.intentId),
    ).resolves.toMatchObject({
      ok: true,
      data: { installationId: 'installation-1', githubAccountId: 'github-account-1' },
    });
  });

  it('does not recover a verified callback outside the bounded retry window', async () => {
    let now = SERVICE_NOW;
    const { service } = createService(createGithubClient(), undefined, () => now);
    const started = await service.startInstallation('identity-1', { clientKind: 'desktop' });
    if (!started.ok) throw new Error('expected ok');
    const state = new URL(started.data.installationUrl).searchParams.get('state')!;
    now += 1_000;
    await service.receiveInstallationSetup({
      state,
      installationId: 'installation-1',
      setupAction: 'install',
    });

    now = SERVICE_NOW + 24 * 60 * 60 * 1_000 + 2_000;
    const retried = await service.startInstallation('identity-1', { clientKind: 'desktop' });
    expect(retried).toMatchObject({
      ok: true,
      data: { requiresExternalBrowser: true },
    });
    if (!retried.ok) throw new Error('expected retry');
    expect(retried.data.intentId).not.toBe(started.data.intentId);
    expect(new URL(retried.data.installationUrl).searchParams.has('state')).toBe(true);
  });

  it('refuses verified retry when the GitHub installation account has drifted', async () => {
    let now = SERVICE_NOW;
    const github = createGithubClient();
    const { service } = createService(github, undefined, () => now);
    const started = await service.startInstallation('identity-1', { clientKind: 'desktop' });
    if (!started.ok) throw new Error('expected ok');
    const state = new URL(started.data.installationUrl).searchParams.get('state')!;
    now += 1_000;
    await service.receiveInstallationSetup({
      state,
      installationId: 'installation-1',
      setupAction: 'install',
    });

    vi.mocked(github.getInstallationInventory).mockResolvedValue(
      installationInventory({}, { accountId: 'github-account-other' }),
    );
    now = SERVICE_NOW + 2 * 60 * 60 * 1_000;
    const retried = await service.startInstallation('identity-1', { clientKind: 'desktop' });
    expect(retried).toMatchObject({ ok: true, data: { requiresExternalBrowser: true } });
    if (!retried.ok) throw new Error('expected retry');
    expect(retried.data.intentId).not.toBe(started.data.intentId);
  });

  it('falls back to a fresh browser flow when the previously verified installation was removed', async () => {
    let now = SERVICE_NOW;
    const github = createGithubClient();
    const { service } = createService(github, undefined, () => now);
    const started = await service.startInstallation('identity-1', { clientKind: 'desktop' });
    if (!started.ok) throw new Error('expected ok');
    const state = new URL(started.data.installationUrl).searchParams.get('state')!;
    now += 1_000;
    await service.receiveInstallationSetup({
      state,
      installationId: 'installation-1',
      setupAction: 'install',
    });

    vi.mocked(github.getInstallationInventory).mockRejectedValue(
      new GitHubAppClientFailureError({ kind: 'not_found' }, 'installation removed'),
    );
    now = SERVICE_NOW + 2 * 60 * 60 * 1_000;
    const retried = await service.startInstallation('identity-1', { clientKind: 'desktop' });
    expect(retried).toMatchObject({ ok: true, data: { requiresExternalBrowser: true } });
    if (!retried.ok) throw new Error('expected fresh flow');
    expect(retried.data.intentId).not.toBe(started.data.intentId);
  });

  it('fails closed when verified-installation revalidation is temporarily unavailable', async () => {
    let now = SERVICE_NOW;
    const github = createGithubClient();
    const { service } = createService(github, undefined, () => now);
    const started = await service.startInstallation('identity-1', { clientKind: 'desktop' });
    if (!started.ok) throw new Error('expected ok');
    const state = new URL(started.data.installationUrl).searchParams.get('state')!;
    now += 1_000;
    await service.receiveInstallationSetup({
      state,
      installationId: 'installation-1',
      setupAction: 'install',
    });

    vi.mocked(github.getInstallationInventory).mockRejectedValue(
      new GitHubAppClientFailureError({ kind: 'unavailable' }, 'GitHub unavailable'),
    );
    now = SERVICE_NOW + 2 * 60 * 60 * 1_000;
    await expect(
      service.startInstallation('identity-1', { clientKind: 'desktop' }),
    ).resolves.toMatchObject({ ok: false, error: { code: 'SERVICE_UNAVAILABLE' } });
  });

  it('routes a foreign environment setup only through the configured API allowlist', async () => {
    const github = createGithubClient();
    const { service } = createService(github);
    const foreignState =
      'mfi1.staging.abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';

    await expect(
      service.receiveInstallationSetup({
        state: foreignState,
        installationId: 'installation-9',
        setupAction: 'update',
      }),
    ).resolves.toMatchObject({
      ok: true,
      data: {
        kind: 'redirect',
        location: expect.stringContaining(
          'https://staging-api.example.test/api/v1/repositories/knowledge-connections/installations/setup?',
        ),
      },
    });
    expect(github.getInstallationInventory).not.toHaveBeenCalled();

    const unknownState = foreignState.replace('mfi1.staging.', 'mfi1.preview.');
    await expect(
      service.receiveInstallationSetup({ state: unknownState, installationId: 'installation-9' }),
    ).resolves.toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
  });

  it('rejects an installation return URL outside the configured MemoFlow Web origin', async () => {
    const { service } = createService();
    await expect(
      service.startInstallation('identity-1', {
        returnUrl: 'https://evil.example/settings?tab=repository',
      }),
    ).resolves.toMatchObject({ ok: false, error: { code: 'VALIDATION_ERROR' } });
  });

  it('returns only the inventory revalidated through the GitHub App', async () => {
    const { service, github } = createService();
    const completed = await completeInstallation(service);

    expect(completed).toMatchObject({
      ok: true,
      data: {
        installationId: 'installation-1',
        githubAccountId: 'github-account-1',
        returnUrl: 'https://app.example.test/settings/repository',
        repositories: [{ id: 'repository-1', private: true }],
      },
    });
    expect(github.getInstallationInventory).toHaveBeenCalledWith('installation-1');
  });

  it('connects a verified private repository and does not expose an installation token', async () => {
    const { service, repository } = createService();
    await completeInstallation(service);

    const connected = await service.connect('identity-1', {
      installationId: 'installation-1',
      githubRepositoryId: 'repository-1',
    });

    expect(connected).toMatchObject({
      ok: true,
      data: {
        githubRepositoryFullName: 'owner/knowledge',
        defaultBranch: 'main',
        status: 'Active',
        canSync: true,
      },
    });
    expect(JSON.stringify(connected)).not.toContain('short-lived-token');
    expect(repository.rows.size).toBe(1);
  });

  it('refuses connection save when identityId does not match', async () => {
    const repository = new MemoryConnectionRepository();
    repository.rows.set('connection-1', {
      id: 'connection-1',
      identityId: 'identity-1',
      githubUserId: 'github-user-1',
      githubRepositoryId: 'repository-1',
      githubRepositoryFullName: 'acme/notes',
      installationId: 'installation-1',
      defaultBranch: 'main',
      status: 'Active',
      lastSyncedCommitSha: null,
      lastProjectedCommitSha: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      version: 1,
      createdAt: 1_750_000_000_000 as never,
      updatedAt: 1_750_000_000_000 as never,
      deletedAt: null,
    });

    await expect(
      repository.save({
        ...repository.rows.get('connection-1')!,
        identityId: 'identity-other' as never,
        status: 'Error',
      }),
    ).rejects.toThrow(/current identity/);
    expect(repository.rows.get('connection-1')).toMatchObject({
      identityId: 'identity-1',
      status: 'Active',
    });
  });

  it('returns null from findByIdForIdentity when identity does not own the connection', async () => {
    const repository = new MemoryConnectionRepository();
    repository.rows.set('connection-1', {
      id: 'connection-1',
      identityId: 'identity-1',
      githubUserId: 'github-user-1',
      githubRepositoryId: 'repository-1',
      githubRepositoryFullName: 'acme/notes',
      installationId: 'installation-1',
      defaultBranch: 'main',
      status: 'Active',
      lastSyncedCommitSha: null,
      lastProjectedCommitSha: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      version: 1,
      createdAt: 1_750_000_000_000 as never,
      updatedAt: 1_750_000_000_000 as never,
      deletedAt: null,
    });

    await expect(
      repository.findByIdForIdentity('identity-other', 'connection-1'),
    ).resolves.toBeNull();
    await expect(
      repository.findByIdForIdentity('identity-1', 'connection-1'),
    ).resolves.toMatchObject({
      id: 'connection-1',
      identityId: 'identity-1',
    });
  });

  it('refuses connection status updates when identityId does not match', async () => {
    const repository = new MemoryConnectionRepository();
    repository.rows.set('connection-1', {
      id: 'connection-1',
      identityId: 'identity-1',
      githubUserId: 'github-user-1',
      githubRepositoryId: 'repository-1',
      githubRepositoryFullName: 'acme/notes',
      installationId: 'installation-1',
      defaultBranch: 'main',
      status: 'Active',
      lastSyncedCommitSha: null,
      lastProjectedCommitSha: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      version: 1,
      createdAt: 1_750_000_000_000 as never,
      updatedAt: 1_750_000_000_000 as never,
      deletedAt: null,
    });

    await repository.updateStatus('identity-other', 'connection-1', 'Revoked');
    expect(repository.rows.get('connection-1')).toMatchObject({
      status: 'Active',
      deletedAt: null,
    });

    await repository.updateStatus('identity-1', 'connection-1', 'Revoked');
    expect(repository.rows.get('connection-1')).toMatchObject({
      status: 'Revoked',
    });
    expect(repository.rows.get('connection-1')?.deletedAt).not.toBeNull();
  });

  it('keeps derived cloud data for the default reversible disconnect', async () => {
    const cloudDataPurger = { purge: vi.fn(async () => true) };
    const { service, repository } = createService(createGithubClient(), cloudDataPurger);
    await completeInstallation(service);
    const connected = await service.connect('identity-1', {
      installationId: 'installation-1',
      githubRepositoryId: 'repository-1',
    });
    if (!connected.ok) throw new Error('expected connection');

    await expect(service.disconnect('identity-1', connected.data.id)).resolves.toEqual({
      ok: true,
      data: null,
    });
    expect(cloudDataPurger.purge).not.toHaveBeenCalled();
    expect(repository.rows.get(connected.data.id)).toMatchObject({
      status: 'Revoked',
      deletedAt: 1_750_000_000_000,
    });
  });

  it('purges only the identity-owned connection when explicitly requested', async () => {
    const cloudDataPurger = { purge: vi.fn(async () => true) };
    const { service } = createService(createGithubClient(), cloudDataPurger);
    await completeInstallation(service);
    const connected = await service.connect('identity-1', {
      installationId: 'installation-1',
      githubRepositoryId: 'repository-1',
    });
    if (!connected.ok) throw new Error('expected connection');

    await expect(service.disconnect('identity-1', connected.data.id, true)).resolves.toEqual({
      ok: true,
      data: null,
    });
    expect(cloudDataPurger.purge).toHaveBeenCalledWith('identity-1', connected.data.id);
  });

  it('does not invoke cloud purge for another identity', async () => {
    const cloudDataPurger = { purge: vi.fn(async () => true) };
    const { service } = createService(createGithubClient(), cloudDataPurger);
    await completeInstallation(service);
    const connected = await service.connect('identity-1', {
      installationId: 'installation-1',
      githubRepositoryId: 'repository-1',
    });
    if (!connected.ok) throw new Error('expected connection');

    await expect(service.disconnect('identity-2', connected.data.id, true)).resolves.toMatchObject({
      ok: false,
      error: { code: 'NOT_FOUND' },
    });
    expect(cloudDataPurger.purge).not.toHaveBeenCalled();
  });

  it.each([
    ['public', { private: false }, 'FORBIDDEN'],
    ['archived', { archived: true }, 'FORBIDDEN'],
    ['non-push', { permissions: { admin: false, push: false, pull: true } }, 'FORBIDDEN'],
  ])('rejects %s repositories', async (_label, repositoryPatch, expectedCode) => {
    const github = createGithubClient();
    vi.mocked(github.getInstallationInventory).mockImplementation(async () => ({
      installationId: 'installation-1',
      accountId: 'github-account-1',
      contentsPermission: 'write',
      suspended: false,
      repositories: [
        {
          id: 'repository-1',
          nodeId: 'R_1',
          fullName: 'owner/knowledge',
          ownerId: 'github-account-1',
          private: true,
          archived: false,
          disabled: false,
          defaultBranch: 'main',
          permissions: { admin: true, push: true, pull: true },
          ...repositoryPatch,
        },
      ],
    }));
    const { service } = createService(github);
    await completeInstallation(service);

    const result = await service.connect('identity-1', {
      installationId: 'installation-1',
      githubRepositoryId: 'repository-1',
    });
    expect(result).toMatchObject({ ok: false, error: { code: expectedCode } });
  });

  it('revalidates installation suspension before connecting the repository', async () => {
    const github = createGithubClient();
    const { service } = createService(github);
    await completeInstallation(service);
    vi.mocked(github.getInstallationInventory).mockResolvedValueOnce({
      installationId: 'installation-1',
      accountId: 'github-account-1',
      contentsPermission: 'write',
      suspended: true,
      repositories: [],
    });

    await expect(
      service.connect('identity-1', {
        installationId: 'installation-1',
        githubRepositoryId: 'repository-1',
      }),
    ).resolves.toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
  });

  it('issues a short-lived installation token only for the owning active identity', async () => {
    const { service, github } = createService();
    await completeInstallation(service);
    const connected = await service.connect('identity-1', {
      installationId: 'installation-1',
      githubRepositoryId: 'repository-1',
    });
    if (!connected.ok) throw new Error('expected connection');

    await expect(
      service.issueInstallationToken('identity-2', connected.data.id),
    ).resolves.toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
    await expect(service.issueInstallationToken('identity-1', connected.data.id)).resolves.toEqual({
      ok: true,
      data: {
        token: 'short-lived-token',
        expiresAt: 1_750_000_300_000,
        repositoryId: 'repository-1',
      },
    });
    expect(github.createInstallationAccessToken).toHaveBeenCalledWith(
      'installation-1',
      'repository-1',
    );
  });

  it('refreshes repository rename metadata while keeping synchronization active', async () => {
    const { service, github, repository } = createService();
    await completeInstallation(service);
    const connected = await service.connect('identity-1', {
      installationId: 'installation-1',
      githubRepositoryId: 'repository-1',
    });
    if (!connected.ok) throw new Error('expected connection');
    vi.mocked(github.getInstallationInventory).mockResolvedValueOnce(
      installationInventory({ fullName: 'owner/renamed-knowledge' }),
    );

    await expect(service.list('identity-1')).resolves.toMatchObject({
      ok: true,
      data: {
        connections: [
          {
            id: connected.data.id,
            githubRepositoryFullName: 'owner/renamed-knowledge',
            status: 'Active',
            lastErrorCode: null,
            canSync: true,
          },
        ],
      },
    });
    expect(repository.rows.get(connected.data.id)).toMatchObject({
      githubRepositoryFullName: 'owner/renamed-knowledge',
      version: 2,
    });
  });

  it.each([
    [
      'suspended installation',
      installationInventory({}, { suspended: true }),
      'Suspended',
      KnowledgeRepositoryLifecycleErrorCodes.InstallationSuspended,
    ],
    [
      'permission reduction',
      installationInventory({}, { contentsPermission: 'read' }),
      'Suspended',
      KnowledgeRepositoryLifecycleErrorCodes.ContentsPermissionRequired,
    ],
    [
      'public repository',
      installationInventory({ private: false }),
      'Suspended',
      KnowledgeRepositoryLifecycleErrorCodes.RepositoryPublic,
    ],
    [
      'archived repository',
      installationInventory({ archived: true }),
      'Suspended',
      KnowledgeRepositoryLifecycleErrorCodes.RepositoryArchived,
    ],
    [
      'repository removed from installation',
      installationInventory({}, { repositories: [] }),
      'Revoked',
      KnowledgeRepositoryLifecycleErrorCodes.RepositoryAccessLost,
    ],
  ] as const)(
    'pauses synchronization when lifecycle diagnosis detects %s',
    async (_label, inventory, expectedStatus, expectedErrorCode) => {
      const { service, github } = createService();
      await completeInstallation(service);
      const connected = await service.connect('identity-1', {
        installationId: 'installation-1',
        githubRepositoryId: 'repository-1',
      });
      if (!connected.ok) throw new Error('expected connection');
      vi.mocked(github.getInstallationInventory).mockResolvedValueOnce(inventory);

      await expect(service.list('identity-1')).resolves.toMatchObject({
        ok: true,
        data: {
          connections: [
            {
              id: connected.data.id,
              status: expectedStatus,
              lastErrorCode: expectedErrorCode,
              canSync: false,
            },
          ],
        },
      });
    },
  );

  it('pauses a reconciled connection when the GitHub default branch changes', async () => {
    const { service, github, repository } = createService();
    await completeInstallation(service);
    const connected = await service.connect('identity-1', {
      installationId: 'installation-1',
      githubRepositoryId: 'repository-1',
    });
    if (!connected.ok) throw new Error('expected connection');
    repository.rows.set(connected.data.id, {
      ...repository.rows.get(connected.data.id)!,
      lastSyncedCommitSha: 'a'.repeat(40),
    });
    vi.mocked(github.getInstallationInventory).mockResolvedValueOnce(
      installationInventory({ defaultBranch: 'trunk' }),
    );

    await expect(service.list('identity-1')).resolves.toMatchObject({
      ok: true,
      data: {
        connections: [
          {
            defaultBranch: 'main',
            status: 'Suspended',
            lastErrorCode: KnowledgeRepositoryLifecycleErrorCodes.DefaultBranchChanged,
            canSync: false,
          },
        ],
      },
    });
  });

  it('keeps the local connection visible when GitHub is unavailable and clears the warning later', async () => {
    const { service, github } = createService();
    await completeInstallation(service);
    const connected = await service.connect('identity-1', {
      installationId: 'installation-1',
      githubRepositoryId: 'repository-1',
    });
    if (!connected.ok) throw new Error('expected connection');
    vi.mocked(github.getInstallationInventory).mockRejectedValueOnce(new Error('offline'));

    await expect(service.list('identity-1')).resolves.toMatchObject({
      ok: true,
      data: {
        connections: [
          {
            status: 'Active',
            lastErrorCode: KnowledgeRepositoryLifecycleErrorCodes.CheckUnavailable,
            canSync: true,
          },
        ],
      },
    });
    await expect(service.list('identity-1')).resolves.toMatchObject({
      ok: true,
      data: { connections: [{ status: 'Active', lastErrorCode: null, canSync: true }] },
    });
  });

  it('marks an uninstalled GitHub App connection as revoked without deleting local metadata', async () => {
    const { service, github, repository } = createService();
    await completeInstallation(service);
    const connected = await service.connect('identity-1', {
      installationId: 'installation-1',
      githubRepositoryId: 'repository-1',
    });
    if (!connected.ok) throw new Error('expected connection');
    vi.mocked(github.getInstallationInventory).mockRejectedValueOnce(
      new GitHubAppClientFailureError({ kind: 'not_found' }, 'installation not found'),
    );

    await expect(service.list('identity-1')).resolves.toMatchObject({
      ok: true,
      data: {
        connections: [
          {
            status: 'Revoked',
            lastErrorCode: KnowledgeRepositoryLifecycleErrorCodes.InstallationNotFound,
            canSync: false,
          },
        ],
      },
    });
    expect(repository.rows.get(connected.data.id)?.deletedAt).toBeNull();
  });

  it('revalidates lifecycle state before issuing a Desktop write token', async () => {
    const { service, github } = createService();
    await completeInstallation(service);
    const connected = await service.connect('identity-1', {
      installationId: 'installation-1',
      githubRepositoryId: 'repository-1',
    });
    if (!connected.ok) throw new Error('expected connection');
    vi.mocked(github.getInstallationInventory).mockResolvedValueOnce(
      installationInventory({ archived: true }),
    );

    await expect(
      service.issueInstallationToken('identity-1', connected.data.id),
    ).resolves.toMatchObject({
      ok: false,
      error: {
        code: 'FORBIDDEN',
        context: {
          lifecycleErrorCode: KnowledgeRepositoryLifecycleErrorCodes.RepositoryArchived,
        },
      },
    });
    expect(github.createInstallationAccessToken).not.toHaveBeenCalled();
  });

  it.each([
    ['Empty', true, 'InitializeBoth'],
    ['NonEmpty', true, 'InitializeRemoteFromLocal'],
    ['Empty', false, 'CloneRemoteIntoLocal'],
    ['NonEmpty', false, 'ManualResolutionRequired'],
  ] as const)(
    'previews first reconciliation for local %s and remote empty=%s',
    async (localState, remoteEmpty, action) => {
      const { service, github } = createService();
      await completeInstallation(service);
      const connected = await service.connect('identity-1', {
        installationId: 'installation-1',
        githubRepositoryId: 'repository-1',
      });
      if (!connected.ok) throw new Error('expected connection');
      vi.mocked(github.getRepositorySnapshot).mockResolvedValueOnce({
        repositoryId: 'repository-1',
        defaultBranch: 'main',
        empty: remoteEmpty,
        headSha: remoteEmpty ? null : 'remote-head-sha',
      });

      await expect(
        service.previewFirstReconciliation('identity-1', connected.data.id, { localState }),
      ).resolves.toEqual({
        ok: true,
        data: {
          connectionId: connected.data.id,
          localState,
          remoteState: remoteEmpty ? 'Empty' : 'NonEmpty',
          action,
          defaultBranch: 'main',
          remoteHeadSha: remoteEmpty ? null : 'remote-head-sha',
        },
      });
    },
  );

  it('does not preview reconciliation for another identity', async () => {
    const { service, github } = createService();
    await completeInstallation(service);
    const connected = await service.connect('identity-1', {
      installationId: 'installation-1',
      githubRepositoryId: 'repository-1',
    });
    if (!connected.ok) throw new Error('expected connection');

    await expect(
      service.previewFirstReconciliation('identity-2', connected.data.id, {
        localState: 'Empty',
      }),
    ).resolves.toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
    expect(github.getRepositorySnapshot).not.toHaveBeenCalled();
  });

  it('advances the server sync cursor only after GitHub confirms the Desktop HEAD', async () => {
    const { service, github, repository } = createService();
    await completeInstallation(service);
    const connected = await service.connect('identity-1', {
      installationId: 'installation-1',
      githubRepositoryId: 'repository-1',
    });
    if (!connected.ok) throw new Error('expected connection');
    vi.mocked(github.getRepositorySnapshot).mockResolvedValueOnce({
      repositoryId: 'repository-1',
      defaultBranch: 'trunk',
      empty: false,
      headSha: 'a'.repeat(40),
    });

    await expect(
      service.confirmHead('identity-1', connected.data.id, {
        headSha: 'a'.repeat(40),
      }),
    ).resolves.toMatchObject({
      ok: true,
      data: {
        defaultBranch: 'trunk',
        lastSyncedCommitSha: 'a'.repeat(40),
      },
    });
    expect(repository.rows.get(connected.data.id)).toMatchObject({
      defaultBranch: 'trunk',
      lastSyncedCommitSha: 'a'.repeat(40),
      version: 2,
    });
  });

  it('rejects reconciliation confirmation when GitHub HEAD changed', async () => {
    const { service, github, repository } = createService();
    await completeInstallation(service);
    const connected = await service.connect('identity-1', {
      installationId: 'installation-1',
      githubRepositoryId: 'repository-1',
    });
    if (!connected.ok) throw new Error('expected connection');
    vi.mocked(github.getRepositorySnapshot).mockResolvedValueOnce({
      repositoryId: 'repository-1',
      defaultBranch: 'main',
      empty: false,
      headSha: 'b'.repeat(40),
    });

    await expect(
      service.confirmHead('identity-1', connected.data.id, {
        headSha: 'a'.repeat(40),
      }),
    ).resolves.toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
    expect(repository.rows.get(connected.data.id)?.lastSyncedCommitSha).toBeNull();
  });
});
