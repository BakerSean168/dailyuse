import { defineComponent, h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SystemChannels } from '@dailyuse/contracts/electron';
import { fail, ok } from '@dailyuse/contracts/result';
import { DESKTOP_BRIDGE_KEY, REPOSITORY_SERVICE_KEY } from '../../../di/keys';
import type { IRepositoryService } from '../../../di/types';
import KnowledgeRepositorySettings from './KnowledgeRepositorySettings.vue';

const routerMocks = vi.hoisted(() => ({
  query: {} as Record<string, string>,
  replace: vi.fn(async () => undefined),
  resolve: vi.fn(() => ({ href: '/settings?tab=repository' })),
}));
const confirmMock = vi.hoisted(() => vi.fn(async () => true));

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: routerMocks.query }),
  useRouter: () => ({ replace: routerMocks.replace, resolve: routerMocks.resolve }),
}));

vi.mock('@dailyuse/ui-vue-shadcn', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@dailyuse/ui-vue-shadcn')>()),
  useConfirm: confirmMock,
}));

const messages = {
  common: { cancel: 'Cancel', refresh: 'Refresh' },
  setting: {
    knowledgeRepository: {
      localTitle: 'Local Vault',
      localDescription: 'Local description',
      localDesktopOnly: 'Desktop only',
      githubTitle: 'GitHub Knowledge Repository',
      githubDescription: 'GitHub description',
      errorTitle: 'Error',
      permissionTitle: 'Least privilege',
      permissionDescription: 'Only selected repositories',
      chooseTitle: 'Choose repository',
      chooseDescription: 'Choose a private repository',
      private: 'Private',
      public: 'Public',
      connect: 'Connect',
      disconnect: 'Disconnect',
      connectAnother: 'Connect another',
      startConnect: 'Start connect',
      createPrivate: 'Create private repository',
      createOpenFailed: 'Create repository page failed',
      notConnected: 'Not connected',
      webConnectHint: 'Web connect hint',
      desktopConnectHint: 'Desktop connect hint',
      defaultBranch: 'Default branch: {branch}',
      lastSyncedCommit: 'Last synchronized commit: {sha}',
      loadFailed: 'Load failed',
      completeFailed: 'Complete failed',
      connectFailed: 'Connect failed',
      disconnectFailed: 'Disconnect failed',
      disconnectTitle: 'Disconnect?',
      disconnectDescription: 'Disconnect {repository}',
      purgeCloudData: 'Delete cloud projections',
      purgeCloudDataDescription: 'Deletes projected data and the AI index.',
      purgeLocalAndGithubPreserved: 'Local Vault and GitHub are preserved.',
      retainCloudDataDescription: 'Cloud projections are retained for reconnecting.',
      startFailed: 'Start failed',
      reconciliation: {
        preview: 'Check first sync',
        previewFailed: 'Preflight failed',
        execute: 'Run first sync',
        executeTitle: 'Run first sync?',
        executeDescription: '{action}',
        executeFailed: 'Execution failed',
        completed: 'Completed at {sha}',
        action: {
          InitializeRemoteFromLocal: 'Push local safely',
          CloneRemoteIntoLocal: 'Clone remote safely',
          InitializeBoth: 'Initialize both safely',
          ManualResolutionRequired: 'Manual resolution required',
        },
      },
      sync: {
        execute: 'Sync now',
        retry: 'Recheck sync',
        failed: 'Sync failed',
        conflictTitle: 'Conflict needs attention',
        conflictDescription: 'Resolve externally and recheck.',
        conflictLocalHead: 'Local HEAD: {sha}',
        conflictRemoteHead: 'Remote HEAD: {sha}',
        openInObsidian: 'Open conflict in Obsidian',
        openInObsidianFailed: 'Open conflict failed',
        pendingTitle: 'Local commit saved',
        pendingDescription: 'Pending upload at {sha}',
        outcome: {
          UpToDate: 'Up to date at {sha}',
          Pushed: 'Pushed at {sha}',
          Pulled: 'Pulled at {sha}',
          RebasedAndPushed: 'Rebased and pushed at {sha}',
        },
      },
      lifecycle: {
        GITHUB_REPOSITORY_PUBLIC: 'Repository became public; sync paused.',
        unknown: 'Connection needs attention.',
      },
      status: { Active: 'Connected', Suspended: 'Suspended', Revoked: 'Revoked', Error: 'Error' },
    },
  },
};

const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': messages } });

const PassthroughStub = defineComponent({
  setup(_, { attrs, slots }) {
    return () => h('div', attrs, slots.default?.());
  },
});

const ButtonStub = defineComponent({
  props: ['disabled'],
  emits: ['click'],
  setup(props, { attrs, emit, slots }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          disabled: props.disabled,
          onClick: () => emit('click'),
        },
        slots.default?.(),
      );
  },
});

const CheckboxStub = defineComponent({
  props: { checked: { type: Boolean, default: false } },
  emits: ['update:checked'],
  setup(props, { attrs, emit }) {
    return () =>
      h('button', {
        ...attrs,
        type: 'button',
        'aria-pressed': props.checked,
        onClick: () => emit('update:checked', !props.checked),
      });
  },
});

function createService(overrides: Partial<IRepositoryService> = {}): IRepositoryService {
  return {
    listKnowledgeRepositoryConnections: vi.fn(async () => ok({ connections: [] })),
    completeKnowledgeRepositoryInstallation: vi.fn(),
    connectKnowledgeRepository: vi.fn(),
    disconnectKnowledgeRepository: vi.fn(),
    previewKnowledgeRepositoryReconciliation: vi.fn(),
    executeKnowledgeRepositoryReconciliation: vi.fn(),
    syncKnowledgeRepository: vi.fn(),
    openLocalVaultInObsidian: vi.fn(),
    startKnowledgeRepositoryInstallation: vi.fn(),
    getLocalVaultBinding: vi.fn(),
    selectLocalVault: vi.fn(),
    detachLocalVault: vi.fn(),
    ...overrides,
  } as unknown as IRepositoryService;
}

function mountSettings(
  service: IRepositoryService,
  desktopBridge?: { invoke: ReturnType<typeof vi.fn> },
) {
  return mount(KnowledgeRepositorySettings, {
    global: {
      plugins: [i18n],
      provide: {
        [REPOSITORY_SERVICE_KEY as symbol]: service,
        ...(desktopBridge ? { [DESKTOP_BRIDGE_KEY as symbol]: desktopBridge } : {}),
      },
      stubs: {
        Alert: PassthroughStub,
        AlertDescription: PassthroughStub,
        AlertTitle: PassthroughStub,
        Badge: PassthroughStub,
        Button: ButtonStub,
        Card: PassthroughStub,
        CardContent: PassthroughStub,
        CardDescription: PassthroughStub,
        CardHeader: PassthroughStub,
        CardTitle: PassthroughStub,
        Checkbox: CheckboxStub,
        Dialog: PassthroughStub,
        DialogContent: PassthroughStub,
        DialogDescription: PassthroughStub,
        DialogFooter: PassthroughStub,
        DialogHeader: PassthroughStub,
        DialogTitle: PassthroughStub,
        Label: PassthroughStub,
        AlertCircle: true,
        ExternalLink: true,
        FolderOpen: true,
        GitBranch: true,
        HardDrive: true,
        Link2: true,
        Loader2: true,
        Plus: true,
        RefreshCw: true,
        ShieldCheck: true,
        Unplug: true,
      },
    },
  });
}

describe('KnowledgeRepositorySettings', () => {
  beforeEach(() => {
    routerMocks.query = {};
    routerMocks.replace.mockClear();
    confirmMock.mockClear();
    confirmMock.mockResolvedValue(true);
  });

  it('opens GitHub-hosted private repository creation without requesting broader OAuth access', async () => {
    const invoke = vi.fn(async () => ({ opened: true }));
    const service = createService({
      getLocalVaultBinding: vi.fn(async () => ok(null)),
    });
    const wrapper = mountSettings(service, { invoke });
    await flushPromises();

    await wrapper.get('[data-testid="github-repository-create"]').trigger('click');
    await flushPromises();

    expect(invoke).toHaveBeenCalledWith(SystemChannels.OPEN_EXTERNAL_URL, {
      url: 'https://github.com/new?name=memory-flow-notes&visibility=private',
    });
    expect(service.startKnowledgeRepositoryInstallation).not.toHaveBeenCalled();
  });

  it('opens GitHub-hosted private repository creation in a separate Web tab', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue({} as Window);
    const service = createService();
    const wrapper = mountSettings(service);
    await flushPromises();

    await wrapper.get('[data-testid="github-repository-create"]').trigger('click');
    await flushPromises();

    expect(open).toHaveBeenCalledWith(
      'https://github.com/new?name=memory-flow-notes&visibility=private',
      '_blank',
      'noopener,noreferrer',
    );
    expect(service.startKnowledgeRepositoryInstallation).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it('loads existing identity-scoped repository connections', async () => {
    const listKnowledgeRepositoryConnections = vi.fn(async () =>
      ok({
        connections: [
          {
            id: 'connection-1',
            identityId: 'IdentityId_11111111-1111-4111-8111-111111111111' as never,
            githubUserId: '42',
            githubRepositoryId: 'repository-1',
            githubRepositoryFullName: 'owner/knowledge',
            installationId: 'installation-1',
            defaultBranch: 'main',
            status: 'Active' as const,
            lastSyncedCommitSha: null,
            lastErrorCode: null,
            canSync: true,
            createdAt: 1 as never,
            updatedAt: 1 as never,
          },
        ],
      }),
    );
    const wrapper = mountSettings(createService({ listKnowledgeRepositoryConnections }));
    await flushPromises();

    expect(listKnowledgeRepositoryConnections).toHaveBeenCalledOnce();
    expect(wrapper.text()).toContain('owner/knowledge');
    expect(wrapper.text()).toContain('Connected');
  });

  it.each([
    ['retains rebuildable cloud data by default', false],
    ['purges cloud projections only after the user selects the option', true],
  ])('%s when disconnecting', async (_label, purgeCloudData) => {
    const connection = {
      id: 'connection-1',
      identityId: 'IdentityId_11111111-1111-4111-8111-111111111111' as never,
      githubUserId: '42',
      githubRepositoryId: 'repository-1',
      githubRepositoryFullName: 'owner/knowledge',
      installationId: 'installation-1',
      defaultBranch: 'main',
      status: 'Active' as const,
      lastSyncedCommitSha: null,
      lastErrorCode: null,
      canSync: true,
      createdAt: 1 as never,
      updatedAt: 1 as never,
    };
    const listKnowledgeRepositoryConnections = vi
      .fn()
      .mockResolvedValueOnce(ok({ connections: [connection] }))
      .mockResolvedValue(ok({ connections: [] }));
    const disconnectKnowledgeRepository = vi.fn(async () => ok({ disconnected: true as const }));
    const wrapper = mountSettings(
      createService({ listKnowledgeRepositoryConnections, disconnectKnowledgeRepository }),
    );
    await flushPromises();

    const disconnectButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Disconnect');
    expect(disconnectButton).toBeDefined();
    await disconnectButton!.trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-testid="knowledge-repository-disconnect-dialog"]').text()).toContain(
      'owner/knowledge',
    );
    if (purgeCloudData) {
      await wrapper.get('[data-testid="knowledge-repository-purge-cloud-data"]').trigger('click');
      await flushPromises();
      expect(wrapper.text()).toContain('Local Vault and GitHub are preserved.');
    } else {
      expect(wrapper.text()).toContain('Cloud projections are retained for reconnecting.');
    }

    await wrapper.get('[data-testid="knowledge-repository-confirm-disconnect"]').trigger('click');
    await flushPromises();

    expect(disconnectKnowledgeRepository).toHaveBeenCalledWith('connection-1', purgeCloudData);
    expect(confirmMock).not.toHaveBeenCalled();
  });

  it('completes the GitHub callback and connects only the selected verified repository', async () => {
    routerMocks.query = {
      tab: 'repository',
      state: 'state-state-state-state',
      installation_id: 'installation-1',
      setup_action: 'install',
    };
    const completeKnowledgeRepositoryInstallation = vi.fn(async () =>
      ok({
        installationId: 'installation-1',
        githubAccountId: '42',
        returnUrl: 'https://app.example.test/settings?tab=repository',
        repositories: [
          {
            id: 'repository-1',
            nodeId: 'R_1',
            fullName: 'owner/knowledge',
            ownerId: '42',
            private: true,
            archived: false,
            disabled: false,
            defaultBranch: 'main',
            permissions: { admin: true, push: true, pull: true },
          },
        ],
      }),
    );
    const connectKnowledgeRepository = vi.fn(async () =>
      ok({
        id: 'connection-1',
        identityId: 'IdentityId_11111111-1111-4111-8111-111111111111' as never,
        githubUserId: '42',
        githubRepositoryId: 'repository-1',
        githubRepositoryFullName: 'owner/knowledge',
        installationId: 'installation-1',
        defaultBranch: 'main',
        status: 'Active' as const,
        lastSyncedCommitSha: null,
        lastErrorCode: null,
        canSync: true,
        createdAt: 1 as never,
        updatedAt: 1 as never,
      }),
    );
    const wrapper = mountSettings(
      createService({
        completeKnowledgeRepositoryInstallation,
        connectKnowledgeRepository,
      }),
    );
    await flushPromises();

    expect(completeKnowledgeRepositoryInstallation).toHaveBeenCalledWith({
      state: 'state-state-state-state',
      installationId: 'installation-1',
      setupAction: 'install',
    });
    expect(routerMocks.replace).toHaveBeenCalled();
    expect(wrapper.text()).toContain('owner/knowledge');

    const connectButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Connect'));
    expect(connectButton).toBeDefined();
    await connectButton!.trigger('click');
    await flushPromises();

    expect(connectKnowledgeRepository).toHaveBeenCalledWith({
      installationId: 'installation-1',
      githubRepositoryId: 'repository-1',
    });
  });

  it('previews the four-way first reconciliation only when Desktop has an active Vault', async () => {
    const connection = {
      id: 'connection-1',
      identityId: 'IdentityId_11111111-1111-4111-8111-111111111111' as never,
      githubUserId: '42',
      githubRepositoryId: 'repository-1',
      githubRepositoryFullName: 'owner/knowledge',
      installationId: 'installation-1',
      defaultBranch: 'main',
      status: 'Active' as const,
      lastSyncedCommitSha: null,
      lastErrorCode: null,
      canSync: true,
      createdAt: 1 as never,
      updatedAt: 1 as never,
    };
    const previewKnowledgeRepositoryReconciliation = vi.fn(async () =>
      ok({
        connectionId: 'connection-1',
        localState: 'NonEmpty' as const,
        remoteState: 'NonEmpty' as const,
        action: 'ManualResolutionRequired' as const,
        defaultBranch: 'main',
        remoteHeadSha: 'remote-head-sha',
      }),
    );
    const wrapper = mountSettings(
      createService({
        listKnowledgeRepositoryConnections: vi.fn(async () => ok({ connections: [connection] })),
        getLocalVaultBinding: vi.fn(async () =>
          ok({
            id: 'vault-1',
            identityId: connection.identityId,
            rootPath: '/vault',
            displayName: 'Vault',
            status: 'Active' as const,
            obsidianVaultId: null,
            lastScannedAt: null,
            createdAt: 1 as never,
            updatedAt: 1 as never,
          }),
        ),
        previewKnowledgeRepositoryReconciliation,
      }),
      { invoke: vi.fn() },
    );
    await flushPromises();

    const previewButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Check first sync'));
    expect(previewButton).toBeDefined();
    await previewButton!.trigger('click');
    await flushPromises();

    expect(previewKnowledgeRepositoryReconciliation).toHaveBeenCalledWith('connection-1');
    expect(wrapper.get('[data-testid="reconciliation-preview"]').text()).toContain(
      'Manual resolution required',
    );
  });

  it('executes only the immutable safe preview after explicit confirmation', async () => {
    const connection = {
      id: 'connection-1',
      identityId: 'IdentityId_11111111-1111-4111-8111-111111111111' as never,
      githubUserId: '42',
      githubRepositoryId: 'repository-1',
      githubRepositoryFullName: 'owner/knowledge',
      installationId: 'installation-1',
      defaultBranch: 'main',
      status: 'Active' as const,
      lastSyncedCommitSha: null,
      lastErrorCode: null,
      canSync: true,
      createdAt: 1 as never,
      updatedAt: 1 as never,
    };
    const previewKnowledgeRepositoryReconciliation = vi.fn(async () =>
      ok({
        connectionId: 'connection-1',
        localState: 'NonEmpty' as const,
        remoteState: 'Empty' as const,
        action: 'InitializeRemoteFromLocal' as const,
        defaultBranch: 'main',
        remoteHeadSha: null,
      }),
    );
    const headSha = 'c'.repeat(40);
    const executeKnowledgeRepositoryReconciliation = vi.fn(async () =>
      ok({
        connection: { ...connection, lastSyncedCommitSha: headSha, updatedAt: 2 as never },
        action: 'InitializeRemoteFromLocal' as const,
        headSha,
        reusedExistingSynchronization: false,
      }),
    );
    const wrapper = mountSettings(
      createService({
        listKnowledgeRepositoryConnections: vi.fn(async () => ok({ connections: [connection] })),
        getLocalVaultBinding: vi.fn(async () =>
          ok({
            id: 'vault-1',
            identityId: connection.identityId,
            rootPath: '/vault',
            displayName: 'Vault',
            status: 'Active' as const,
            obsidianVaultId: null,
            lastScannedAt: null,
            createdAt: 1 as never,
            updatedAt: 1 as never,
          }),
        ),
        previewKnowledgeRepositoryReconciliation,
        executeKnowledgeRepositoryReconciliation,
      }),
      { invoke: vi.fn() },
    );
    await flushPromises();

    const previewButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Check first sync'))!;
    await previewButton.trigger('click');
    await flushPromises();
    const executeButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Run first sync'))!;
    await executeButton.trigger('click');
    await flushPromises();

    expect(confirmMock).toHaveBeenCalledOnce();
    expect(executeKnowledgeRepositoryReconciliation).toHaveBeenCalledWith({
      connectionId: 'connection-1',
      expectedAction: 'InitializeRemoteFromLocal',
      expectedDefaultBranch: 'main',
      expectedRemoteHeadSha: null,
    });
    expect(wrapper.get('[data-testid="reconciliation-completed"]').text()).toContain(
      headSha.slice(0, 8),
    );
  });

  it('runs continuous sync only for a reconciled Desktop connection', async () => {
    const previousHead = 'a'.repeat(40);
    const nextHead = 'b'.repeat(40);
    const connection = {
      id: 'connection-1',
      identityId: 'IdentityId_11111111-1111-4111-8111-111111111111' as never,
      githubUserId: '42',
      githubRepositoryId: 'repository-1',
      githubRepositoryFullName: 'owner/knowledge',
      installationId: 'installation-1',
      defaultBranch: 'main',
      status: 'Active' as const,
      lastSyncedCommitSha: previousHead,
      lastErrorCode: null,
      canSync: true,
      createdAt: 1 as never,
      updatedAt: 1 as never,
    };
    const syncKnowledgeRepository = vi.fn(async () =>
      ok({
        connection: { ...connection, lastSyncedCommitSha: nextHead, updatedAt: 2 as never },
        outcome: 'Pushed' as const,
        headSha: nextHead,
        localCommitCreated: true,
        remoteChangesApplied: false,
        pushed: true,
      }),
    );
    const wrapper = mountSettings(
      createService({
        listKnowledgeRepositoryConnections: vi.fn(async () => ok({ connections: [connection] })),
        getLocalVaultBinding: vi.fn(async () =>
          ok({
            id: 'vault-1',
            identityId: connection.identityId,
            rootPath: '/vault',
            displayName: 'Vault',
            status: 'Active' as const,
            obsidianVaultId: null,
            lastScannedAt: null,
            createdAt: 1 as never,
            updatedAt: 1 as never,
          }),
        ),
        syncKnowledgeRepository,
      }),
      { invoke: vi.fn() },
    );
    await flushPromises();

    const syncButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Sync now'))!;
    await syncButton.trigger('click');
    await flushPromises();

    expect(syncKnowledgeRepository).toHaveBeenCalledWith({ connectionId: connection.id });
    expect(wrapper.get('[data-testid="knowledge-repository-sync-completed"]').text()).toContain(
      nextHead.slice(0, 8),
    );
    expect(wrapper.text()).not.toContain('Check first sync');

    syncKnowledgeRepository.mockResolvedValueOnce(
      fail({
        code: 'SERVICE_UNAVAILABLE',
        message: 'GitHub offline',
        context: {
          localHeadSha: nextHead,
          localCommitCreated: true,
          uploadPending: true,
        },
      }) as never,
    );
    await syncButton.trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="knowledge-repository-sync-pending"]').text()).toContain(
      nextHead.slice(0, 8),
    );
    expect(wrapper.text()).toContain('Recheck sync');
  });

  it('shows preserved rebase conflicts and offers a recheck action', async () => {
    const head = 'a'.repeat(40);
    const connection = {
      id: 'connection-1',
      identityId: 'IdentityId_11111111-1111-4111-8111-111111111111' as never,
      githubUserId: '42',
      githubRepositoryId: 'repository-1',
      githubRepositoryFullName: 'owner/knowledge',
      installationId: 'installation-1',
      defaultBranch: 'main',
      status: 'Active' as const,
      lastSyncedCommitSha: head,
      lastErrorCode: null,
      canSync: true,
      createdAt: 1 as never,
      updatedAt: 1 as never,
    };
    const openLocalVaultInObsidian = vi.fn(async () => ok(undefined));
    const wrapper = mountSettings(
      createService({
        listKnowledgeRepositoryConnections: vi.fn(async () => ok({ connections: [connection] })),
        getLocalVaultBinding: vi.fn(async () =>
          ok({
            id: 'vault-1',
            identityId: connection.identityId,
            rootPath: '/vault',
            displayName: 'Vault',
            status: 'Active' as const,
            obsidianVaultId: null,
            lastScannedAt: null,
            createdAt: 1 as never,
            updatedAt: 1 as never,
          }),
        ),
        syncKnowledgeRepository: vi.fn(async () =>
          fail({
            code: 'CONFLICT',
            message: 'Rebase conflict',
            context: {
              localHeadSha: head,
              remoteHeadSha: 'b'.repeat(40),
              conflictingPaths: ['notes/shared.md'],
              rebaseInProgress: true,
            },
          }),
        ),
        openLocalVaultInObsidian,
      }),
      { invoke: vi.fn() },
    );
    await flushPromises();

    const syncButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Sync now'))!;
    await syncButton.trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-testid="knowledge-repository-sync-conflict"]').text()).toContain(
      'notes/shared.md',
    );
    expect(wrapper.get('[data-testid="knowledge-repository-sync-conflict"]').text()).toContain(
      `Local HEAD: ${head.slice(0, 8)}`,
    );
    expect(wrapper.get('[data-testid="knowledge-repository-sync-conflict"]').text()).toContain(
      `Remote HEAD: ${'b'.repeat(8)}`,
    );
    expect(wrapper.text()).toContain('Recheck sync');
    await wrapper.get('[data-testid="knowledge-repository-open-conflict"]').trigger('click');
    await flushPromises();
    expect(openLocalVaultInObsidian).toHaveBeenCalledWith({
      relativePath: 'notes/shared.md',
    });
  });

  it('shows lifecycle diagnostics and disables sync for a suspended repository', async () => {
    const connection = {
      id: 'connection-1',
      identityId: 'IdentityId_11111111-1111-4111-8111-111111111111' as never,
      githubUserId: '42',
      githubRepositoryId: 'repository-1',
      githubRepositoryFullName: 'owner/knowledge',
      installationId: 'installation-1',
      defaultBranch: 'main',
      status: 'Suspended' as const,
      lastSyncedCommitSha: 'a'.repeat(40),
      lastErrorCode: 'GITHUB_REPOSITORY_PUBLIC',
      canSync: false,
      createdAt: 1 as never,
      updatedAt: 2 as never,
    };
    const wrapper = mountSettings(
      createService({
        listKnowledgeRepositoryConnections: vi.fn(async () => ok({ connections: [connection] })),
        getLocalVaultBinding: vi.fn(async () =>
          ok({
            id: 'vault-1',
            identityId: connection.identityId,
            rootPath: '/vault',
            displayName: 'Vault',
            status: 'Active' as const,
            obsidianVaultId: null,
            lastScannedAt: null,
            createdAt: 1 as never,
            updatedAt: 1 as never,
          }),
        ),
      }),
      { invoke: vi.fn() },
    );
    await flushPromises();

    expect(wrapper.get('[data-testid="knowledge-repository-lifecycle-diagnostic"]').text()).toBe(
      'Repository became public; sync paused.',
    );
    expect(wrapper.text()).not.toContain('Sync now');
  });
});
