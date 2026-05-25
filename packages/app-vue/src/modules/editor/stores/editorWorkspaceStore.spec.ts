import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EditorSessionClientDTO, EditorTabClientDTO } from '@dailyuse/contracts/editor';
import { createTestPinia } from '@dailyuse/test-utils';

const {
  ensureEditorWorkspace,
  listEditorSessions,
  createEditorSession,
  createEditorTab,
  activateEditorTab,
  deleteEditorTab,
  updateEditorTab,
  firstGroup,
} = vi.hoisted(() => ({
  ensureEditorWorkspace: vi.fn(),
  listEditorSessions: vi.fn(),
  createEditorSession: vi.fn(),
  createEditorTab: vi.fn(),
  activateEditorTab: vi.fn(),
  deleteEditorTab: vi.fn(),
  updateEditorTab: vi.fn(),
  firstGroup: vi.fn(),
}));

vi.mock('../services/editor-client-gateway', () => ({
  ensureEditorWorkspace,
  listEditorSessions,
  createEditorSession,
  createEditorTab,
  activateEditorTab,
  deleteEditorTab,
  updateEditorTab,
  firstGroup,
}));

import { useEditorWorkspaceStore } from './editor-workspace-store';

function createSession(overrides: Record<string, unknown> = {}): EditorSessionClientDTO {
  return {
    id: 'session-1',
    name: 'Main',
    isActive: true,
    activeGroupIndex: 0,
    groups: [
      {
        id: 'group-1',
        sessionId: 'session-1',
        workspaceId: 'workspace-1',
        identityId: 'identity-1',
        groupIndex: 0,
        name: 'Group 1',
        activeTabIndex: 0,
        tabs: [],
        createdAt: 1741564800000,
        updatedAt: 1741564800000,
        formattedCreatedAt: '2026-03-10 10:00:00',
        formattedUpdatedAt: '2026-03-10 10:00:00',
      },
    ],
    ...overrides,
  } as unknown as EditorSessionClientDTO;
}

function createTab(overrides: Record<string, unknown> = {}): EditorTabClientDTO {
  return {
    id: 'tab-1' as EditorTabClientDTO['id'],
    sessionId: 'session-1',
    groupId: 'group-1',
    workspaceId: 'workspace-1',
    identityId: 'identity-1',
    resourceId: 'resource-1',
    tabIndex: 0,
    tabType: 'Resource',
    name: 'Untitled.md',
    viewState: {},
    isPinned: false,
    isActive: true,
    isDirty: false,
    lastAccessedAt: null,
    createdAt: 1741564800000,
    updatedAt: 1741564800000,
    formattedLastAccessed: null,
    formattedCreatedAt: '2026-03-10 10:00:00',
    formattedUpdatedAt: '2026-03-10 10:00:00',
    ...overrides,
  } as EditorTabClientDTO;
}

describe('useEditorWorkspaceStore', () => {
  beforeEach(() => {
    createTestPinia();
    ensureEditorWorkspace.mockReset();
    listEditorSessions.mockReset();
    createEditorSession.mockReset();
    createEditorTab.mockReset();
    activateEditorTab.mockReset();
    deleteEditorTab.mockReset();
    updateEditorTab.mockReset();
    firstGroup.mockReset();
    ensureEditorWorkspace.mockResolvedValue({ id: 'workspace-1' });
    listEditorSessions.mockResolvedValue([]);
    createEditorSession.mockResolvedValue(null);
    createEditorTab.mockResolvedValue(null);
    activateEditorTab.mockResolvedValue(undefined);
    deleteEditorTab.mockResolvedValue(undefined);
    updateEditorTab.mockResolvedValue(null);
    firstGroup.mockImplementation((session: EditorSessionClientDTO | null) => session?.groups[0] ?? null);
  });

  it('rehydrates sessions when the workspace is already hydrated but the session list is empty', async () => {
    const store = useEditorWorkspaceStore();
    store.workspaceId = 'workspace-1';
    store.isHydrated = true;
    store.sessions = [];
    store.activeSessionId = null;

    const session = createSession();
    listEditorSessions.mockResolvedValueOnce([session]);

    await store.setWorkspace('workspace-1');

    expect(listEditorSessions).toHaveBeenCalledTimes(1);
    expect(store.sessions).toHaveLength(1);
    expect(store.activeSessionId).toBe(session.id);
  });

  it('opens a resource by creating and activating a tab after hydration', async () => {
    const store = useEditorWorkspaceStore();
    store.workspaceId = 'workspace-1';
    store.isHydrated = true;
    store.sessions = [];
    store.activeSessionId = null;

    const sessionWithoutTab = createSession();
    const createdTab = createTab();
    const sessionWithTab = createSession({
      groups: [
        {
          id: 'group-1',
          name: 'Group 1',
          activeTabIndex: 0,
          tabs: [createdTab],
        },
      ],
    });

    listEditorSessions
      .mockResolvedValueOnce([sessionWithoutTab])
      .mockResolvedValueOnce([sessionWithTab])
      .mockResolvedValueOnce([sessionWithTab]);
    createEditorTab.mockResolvedValueOnce(createdTab);

    const opened = await store.openResource({
      resourceId: createdTab.resourceId ?? 'resource-1',
      title: createdTab.name,
      workspaceId: 'workspace-1',
    });

    expect(createEditorTab).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      groupId: 'group-1',
      resourceId: createdTab.resourceId ?? 'resource-1',
      title: createdTab.name,
    });
    expect(activateEditorTab).not.toHaveBeenCalled();
    expect(opened?.id).toBe(createdTab.id);
    expect(store.activeTabId).toBe(createdTab.id);
  });

  it('creates a default session even when workspace lookup is temporarily unavailable', async () => {
    const store = useEditorWorkspaceStore();
    store.workspaceId = 'workspace-1';
    store.isHydrated = true;
    store.sessions = [];
    store.activeSessionId = null;

    ensureEditorWorkspace.mockResolvedValueOnce({ id: 'workspace-1' });

    const createdSession = createSession();
    const createdTab = createTab();
    const sessionWithTab = createSession({
      groups: [
        {
          id: 'group-1',
          sessionId: 'session-1',
          workspaceId: 'workspace-1',
          identityId: 'identity-1',
          groupIndex: 0,
          name: 'Group 1',
          activeTabIndex: 0,
          tabs: [createdTab],
          createdAt: 1741564800000,
          updatedAt: 1741564800000,
          formattedCreatedAt: '2026-03-10 10:00:00',
          formattedUpdatedAt: '2026-03-10 10:00:00',
        },
      ],
    });

    listEditorSessions
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([sessionWithTab])
      .mockResolvedValueOnce([sessionWithTab]);
    createEditorSession.mockResolvedValueOnce(createdSession);
    createEditorTab.mockResolvedValueOnce(createdTab);

    const opened = await store.openResource({
      resourceId: createdTab.resourceId ?? 'resource-1',
      title: createdTab.name,
      workspaceId: 'workspace-1',
    });

    expect(createEditorSession).toHaveBeenCalledWith('workspace-1', 'Main');
    expect(opened?.id).toBe(createdTab.id);
    expect(store.activeTabId).toBe(createdTab.id);
  });

  it('uses the resolved editor workspace id when the requested repository id is only a lookup key', async () => {
    const store = useEditorWorkspaceStore();
    store.workspaceId = null;
    store.isHydrated = false;
    store.sessions = [];
    store.activeSessionId = null;

    const createdSession = createSession({
      id: 'session-2',
      workspaceId: 'editor-workspace-1',
      groups: [
        {
          id: 'group-2',
          sessionId: 'session-2',
          workspaceId: 'editor-workspace-1',
          identityId: 'identity-1',
          groupIndex: 0,
          name: 'Group 2',
          activeTabIndex: 0,
          tabs: [],
          createdAt: 1741564800000,
          updatedAt: 1741564800000,
          formattedCreatedAt: '2026-03-10 10:00:00',
          formattedUpdatedAt: '2026-03-10 10:00:00',
        },
      ],
    });
    const createdTab = createTab({
      id: 'tab-2',
      sessionId: 'session-2',
      groupId: 'group-2',
      workspaceId: 'editor-workspace-1',
      resourceId: 'resource-2',
      name: 'Lookup.md',
    });
    const sessionWithTab = createSession({
      id: 'session-2',
      workspaceId: 'editor-workspace-1',
      groups: [
        {
          id: 'group-2',
          sessionId: 'session-2',
          workspaceId: 'editor-workspace-1',
          identityId: 'identity-1',
          groupIndex: 0,
          name: 'Group 2',
          activeTabIndex: 0,
          tabs: [createdTab],
          createdAt: 1741564800000,
          updatedAt: 1741564800000,
          formattedCreatedAt: '2026-03-10 10:00:00',
          formattedUpdatedAt: '2026-03-10 10:00:00',
        },
      ],
    });

    ensureEditorWorkspace.mockResolvedValue({
      id: 'editor-workspace-1',
      projectPath: 'repository-1',
    });
    listEditorSessions
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([sessionWithTab])
      .mockResolvedValueOnce([sessionWithTab]);
    createEditorSession.mockResolvedValueOnce(createdSession);
    createEditorTab.mockResolvedValueOnce(createdTab);

    const opened = await store.openResource({
      resourceId: 'resource-2',
      title: 'Lookup.md',
      workspaceId: 'repository-1',
    });

    expect(listEditorSessions).toHaveBeenNthCalledWith(1, 'editor-workspace-1');
    expect(createEditorSession).toHaveBeenCalledWith('editor-workspace-1', 'Main');
    expect(createEditorTab).toHaveBeenCalledWith({
      workspaceId: 'editor-workspace-1',
      sessionId: 'session-2',
      groupId: 'group-2',
      resourceId: 'resource-2',
      title: 'Lookup.md',
    });
    expect(store.workspaceId).toBe('editor-workspace-1');
    expect(opened?.id).toBe('tab-2');
  });

  it('reuses the hydrated resolved workspace when reopening via repository lookup key', async () => {
    const store = useEditorWorkspaceStore();
    const session = createSession({
      id: 'session-3',
      workspaceId: 'editor-workspace-1',
    });

    store.workspaceId = 'editor-workspace-1';
    store.isHydrated = true;
    store.sessions = [session];
    store.activeSessionId = 'session-3';

    ensureEditorWorkspace.mockResolvedValueOnce({
      id: 'editor-workspace-1',
      projectPath: 'repository-1',
    });

    await store.setWorkspace('repository-1');

    expect(ensureEditorWorkspace).toHaveBeenCalledWith('repository-1');
    expect(listEditorSessions).not.toHaveBeenCalled();
    expect(store.workspaceId).toBe('editor-workspace-1');
    expect(store.activeSessionId).toBe('session-3');
  });

  it('refreshes the active tab after activating a different tab in the same workspace', async () => {
    const store = useEditorWorkspaceStore();
    const firstTab = createTab({
      id: 'tab-1',
      resourceId: 'resource-1',
      tabIndex: 0,
      isActive: true,
      name: 'First.md',
    });
    const secondTab = createTab({
      id: 'tab-2',
      resourceId: 'resource-2',
      tabIndex: 1,
      isActive: false,
      name: 'Second.md',
    });

    store.workspaceId = 'workspace-1';
    store.workspaceLookupId = 'repository-1';
    store.isHydrated = true;
    store.sessions = [
      createSession({
        groups: [
          {
            id: 'group-1',
            sessionId: 'session-1',
            workspaceId: 'workspace-1',
            identityId: 'identity-1',
            groupIndex: 0,
            name: 'Group 1',
            activeTabIndex: 0,
            tabs: [firstTab, secondTab],
            createdAt: 1741564800000,
            updatedAt: 1741564800000,
            formattedCreatedAt: '2026-03-10 10:00:00',
            formattedUpdatedAt: '2026-03-10 10:00:00',
          },
        ],
      }),
    ];
    store.activeSessionId = 'session-1';

    listEditorSessions.mockResolvedValueOnce([
      createSession({
        groups: [
          {
            id: 'group-1',
            sessionId: 'session-1',
            workspaceId: 'workspace-1',
            identityId: 'identity-1',
            groupIndex: 0,
            name: 'Group 1',
            activeTabIndex: 1,
            tabs: [
              { ...firstTab, isActive: false },
              { ...secondTab, isActive: true },
            ],
            createdAt: 1741564800000,
            updatedAt: 1741564800000,
            formattedCreatedAt: '2026-03-10 10:00:00',
            formattedUpdatedAt: '2026-03-10 10:00:00',
          },
        ],
      }),
    ]);

    await store.setActiveTab('tab-2');

    expect(activateEditorTab).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      groupId: 'group-1',
      tabId: 'tab-2',
    });
    expect(listEditorSessions).toHaveBeenCalledWith('workspace-1');
    expect(store.activeTabId).toBe('tab-2');
    expect(store.workspaceLookupId).toBe('repository-1');
  });

  it('refreshes tabs after closing a tab in the same workspace', async () => {
    const store = useEditorWorkspaceStore();
    const firstTab = createTab({
      id: 'tab-1',
      resourceId: 'resource-1',
      tabIndex: 0,
      isActive: false,
      name: 'First.md',
    });
    const secondTab = createTab({
      id: 'tab-2',
      resourceId: 'resource-2',
      tabIndex: 1,
      isActive: true,
      name: 'Second.md',
    });

    store.workspaceId = 'workspace-1';
    store.workspaceLookupId = 'repository-1';
    store.isHydrated = true;
    store.sessions = [
      createSession({
        groups: [
          {
            id: 'group-1',
            sessionId: 'session-1',
            workspaceId: 'workspace-1',
            identityId: 'identity-1',
            groupIndex: 0,
            name: 'Group 1',
            activeTabIndex: 1,
            tabs: [firstTab, secondTab],
            createdAt: 1741564800000,
            updatedAt: 1741564800000,
            formattedCreatedAt: '2026-03-10 10:00:00',
            formattedUpdatedAt: '2026-03-10 10:00:00',
          },
        ],
      }),
    ];
    store.activeSessionId = 'session-1';

    listEditorSessions.mockResolvedValueOnce([
      createSession({
        groups: [
          {
            id: 'group-1',
            sessionId: 'session-1',
            workspaceId: 'workspace-1',
            identityId: 'identity-1',
            groupIndex: 0,
            name: 'Group 1',
            activeTabIndex: 0,
            tabs: [{ ...firstTab, isActive: true }],
            createdAt: 1741564800000,
            updatedAt: 1741564800000,
            formattedCreatedAt: '2026-03-10 10:00:00',
            formattedUpdatedAt: '2026-03-10 10:00:00',
          },
        ],
      }),
    ]);

    await store.closeTab('tab-2');

    expect(deleteEditorTab).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      groupId: 'group-1',
      tabId: 'tab-2',
    });
    expect(listEditorSessions).toHaveBeenCalledWith('workspace-1');
    expect(store.openTabs).toHaveLength(1);
    expect(store.activeTabId).toBe('tab-1');
    expect(store.workspaceLookupId).toBe('repository-1');
  });

  it('short-circuits workspace hydration when an already hydrated lookup id is reopened', async () => {
    const store = useEditorWorkspaceStore();
    store.workspaceId = 'workspace-1';
    store.workspaceLookupId = 'repository-1';
    store.isHydrated = true;
    store.sessions = [createSession()];
    store.activeSessionId = 'session-1';

    await store.setWorkspace('repository-1');

    expect(ensureEditorWorkspace).not.toHaveBeenCalled();
    expect(listEditorSessions).not.toHaveBeenCalled();
  });

  it('resets state when the workspace lookup resolves to nothing', async () => {
    const store = useEditorWorkspaceStore();
    store.workspaceId = 'workspace-1';
    store.workspaceLookupId = 'repository-1';
    store.sessions = [createSession()];
    store.activeSessionId = 'session-1';
    store.isHydrated = true;
    ensureEditorWorkspace.mockResolvedValueOnce(null);

    await store.setWorkspace('missing-workspace');

    expect(store.workspaceId).toBeNull();
    expect(store.workspaceLookupId).toBeNull();
    expect(store.sessions).toEqual([]);
    expect(store.activeSessionId).toBeNull();
    expect(store.isHydrated).toBe(false);
  });

  it('returns null when opening a resource without any available workspace id', async () => {
    const store = useEditorWorkspaceStore();

    await expect(store.openResource({ resourceId: 'resource-1', title: 'Missing.md' })).resolves.toBeNull();

    expect(ensureEditorWorkspace).not.toHaveBeenCalled();
    expect(createEditorTab).not.toHaveBeenCalled();
  });

  it('activates an existing resource tab instead of creating a duplicate', async () => {
    const store = useEditorWorkspaceStore();
    const existingTab = createTab({
      id: 'tab-existing',
      resourceId: 'resource-existing',
      name: 'Existing.md',
      isActive: false,
    });

    store.workspaceId = 'workspace-1';
    store.workspaceLookupId = 'repository-1';
    store.isHydrated = true;
    store.activeSessionId = 'session-1';
    store.sessions = [
      createSession({
        groups: [
          {
            id: 'group-1',
            sessionId: 'session-1',
            workspaceId: 'workspace-1',
            identityId: 'identity-1',
            groupIndex: 0,
            name: 'Group 1',
            activeTabIndex: 0,
            tabs: [existingTab],
            createdAt: 1741564800000,
            updatedAt: 1741564800000,
            formattedCreatedAt: '2026-03-10 10:00:00',
            formattedUpdatedAt: '2026-03-10 10:00:00',
          },
        ],
      }),
    ];

    listEditorSessions.mockResolvedValueOnce([
      createSession({
        groups: [
          {
            id: 'group-1',
            sessionId: 'session-1',
            workspaceId: 'workspace-1',
            identityId: 'identity-1',
            groupIndex: 0,
            name: 'Group 1',
            activeTabIndex: 0,
            tabs: [{ ...existingTab, isActive: true }],
            createdAt: 1741564800000,
            updatedAt: 1741564800000,
            formattedCreatedAt: '2026-03-10 10:00:00',
            formattedUpdatedAt: '2026-03-10 10:00:00',
          },
        ],
      }),
    ]);

    const opened = await store.openResource({
      resourceId: 'resource-existing',
      title: 'Existing.md',
      workspaceId: 'repository-1',
    });

    expect(createEditorTab).not.toHaveBeenCalled();
    expect(activateEditorTab).not.toHaveBeenCalled();
    expect(opened?.id).toBe('tab-existing');
  });

  it('returns null when no session group is available for opening a resource', async () => {
    const store = useEditorWorkspaceStore();
    store.workspaceId = 'workspace-1';
    store.workspaceLookupId = 'workspace-1';
    store.isHydrated = true;
    store.sessions = [createSession({ groups: [] })];
    store.activeSessionId = 'session-1';
    firstGroup.mockReturnValueOnce(null);

    const opened = await store.openResource({
      resourceId: 'resource-2',
      title: 'NoGroup.md',
      workspaceId: 'workspace-1',
    });

    expect(opened).toBeNull();
    expect(createEditorTab).not.toHaveBeenCalled();
  });

  it('returns null when pinning or dirty-syncing tabs without a workspace or update result', async () => {
    const store = useEditorWorkspaceStore();
    const existingTab = createTab({
      id: 'tab-existing',
      resourceId: 'resource-existing',
      isPinned: false,
      isDirty: false,
    });

    store.sessions = [
      createSession({
        groups: [
          {
            id: 'group-1',
            sessionId: 'session-1',
            workspaceId: 'workspace-1',
            identityId: 'identity-1',
            groupIndex: 0,
            name: 'Group 1',
            activeTabIndex: 0,
            tabs: [existingTab],
            createdAt: 1741564800000,
            updatedAt: 1741564800000,
            formattedCreatedAt: '2026-03-10 10:00:00',
            formattedUpdatedAt: '2026-03-10 10:00:00',
          },
        ],
      }),
    ];
    store.activeSessionId = 'session-1';

    await expect(store.setTabPinned('tab-existing', true)).resolves.toBeNull();
    await expect(store.syncTabDirtyState('tab-existing', true)).resolves.toBeNull();

    store.workspaceId = 'workspace-1';

    await expect(store.setTabPinned('tab-existing', false)).resolves.toStrictEqual(existingTab);
    await expect(store.syncTabDirtyState('tab-existing', false)).resolves.toStrictEqual(existingTab);

    updateEditorTab.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    await expect(store.setTabPinned('tab-existing', true)).resolves.toBeNull();
    await expect(store.syncTabDirtyState('tab-existing', true)).resolves.toBeNull();
  });

  it('updates tab metadata when pinning and dirty-state sync succeed', async () => {
    const store = useEditorWorkspaceStore();
    const existingTab = createTab({
      id: 'tab-existing',
      resourceId: 'resource-existing',
      isPinned: false,
      isDirty: false,
    });

    store.workspaceId = 'workspace-1';
    store.sessions = [
      createSession({
        groups: [
          {
            id: 'group-1',
            sessionId: 'session-1',
            workspaceId: 'workspace-1',
            identityId: 'identity-1',
            groupIndex: 0,
            name: 'Group 1',
            activeTabIndex: 0,
            tabs: [existingTab],
            createdAt: 1741564800000,
            updatedAt: 1741564800000,
            formattedCreatedAt: '2026-03-10 10:00:00',
            formattedUpdatedAt: '2026-03-10 10:00:00',
          },
        ],
      }),
    ];
    store.activeSessionId = 'session-1';

    updateEditorTab
      .mockResolvedValueOnce({
        isPinned: true,
        updatedAt: 1741565800000,
        formattedUpdatedAt: '2026-03-10 10:16:40',
      })
      .mockResolvedValueOnce({
        isDirty: true,
        updatedAt: 1741566800000,
        formattedUpdatedAt: '2026-03-10 10:33:20',
      });

    const pinned = await store.setTabPinned('tab-existing', true);
    const dirty = await store.syncTabDirtyState('tab-existing', true);

    expect(pinned?.isPinned).toBe(true);
    expect(dirty?.isDirty).toBe(true);
    expect(store.findTabByResourceId('resource-existing')?.id).toBe('tab-existing');
  });

  it('closes tab collections relative to the active session ordering', async () => {
    const store = useEditorWorkspaceStore();
    const firstTab = createTab({ id: 'tab-1', resourceId: 'resource-1', tabIndex: 0, isActive: true });
    const secondTab = createTab({ id: 'tab-2', resourceId: 'resource-2', tabIndex: 1, isActive: false });
    const thirdTab = createTab({ id: 'tab-3', resourceId: 'resource-3', tabIndex: 2, isActive: false });

    store.workspaceId = 'workspace-1';
    store.isHydrated = true;
    store.activeSessionId = 'session-1';
    store.sessions = [
      createSession({
        groups: [
          {
            id: 'group-1',
            sessionId: 'session-1',
            workspaceId: 'workspace-1',
            identityId: 'identity-1',
            groupIndex: 0,
            name: 'Group 1',
            activeTabIndex: 0,
            tabs: [firstTab, secondTab, thirdTab],
            createdAt: 1741564800000,
            updatedAt: 1741564800000,
            formattedCreatedAt: '2026-03-10 10:00:00',
            formattedUpdatedAt: '2026-03-10 10:00:00',
          },
        ],
      }),
    ];

    const closeSpy = vi.spyOn(store, 'closeTab').mockResolvedValue(undefined);

    await store.closeTabsToRight('tab-1');
    expect(closeSpy.mock.calls.slice(0, 2)).toEqual([['tab-2'], ['tab-3']]);

    await store.closeOtherTabs('tab-2');
    expect(closeSpy.mock.calls.slice(2, 4)).toEqual([['tab-1'], ['tab-3']]);

    await store.closeAllTabs();
    expect(closeSpy.mock.calls.slice(4)).toEqual([['tab-1'], ['tab-2'], ['tab-3']]);

    closeSpy.mockRestore();
  });

  it('exposes active tab getters and no-ops when reactivating the current tab', async () => {
    const store = useEditorWorkspaceStore();
    const activeTab = createTab({
      id: 'tab-1',
      resourceId: 'resource-1',
      tabIndex: 0,
      isActive: true,
    });

    store.workspaceId = 'workspace-1';
    store.isHydrated = true;
    store.activeSessionId = 'session-1';
    store.sessions = [
      createSession({
        groups: [
          {
            id: 'group-1',
            sessionId: 'session-1',
            workspaceId: 'workspace-1',
            identityId: 'identity-1',
            groupIndex: 0,
            name: 'Group 1',
            activeTabIndex: 0,
            tabs: [activeTab],
            createdAt: 1741564800000,
            updatedAt: 1741564800000,
            formattedCreatedAt: '2026-03-10 10:00:00',
            formattedUpdatedAt: '2026-03-10 10:00:00',
          },
        ],
      }),
    ];

    expect(store.activeSession?.id).toBe('session-1');
    expect(store.openTabs.map((tab) => tab.id)).toEqual(['tab-1']);
    expect(store.activeTab?.id).toBe('tab-1');
    expect(store.activeTabId).toBe('tab-1');
    expect(store.activeResourceId).toBe('resource-1');

    await store.setActiveTab('tab-1');
    await store.setActiveTab('missing-tab');

    expect(activateEditorTab).not.toHaveBeenCalled();
  });
});
