import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EditorSessionClientDTO, EditorTabClientDTO } from '@dailyuse/contracts/editor';

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

vi.mock('../services/editorDesktop.service', () => ({
  ensureEditorWorkspace,
  listEditorSessions,
  createEditorSession,
  createEditorTab,
  activateEditorTab,
  deleteEditorTab,
  updateEditorTab,
  firstGroup,
}));

import { useEditorWorkspaceStore } from './editorWorkspaceStore';

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
    setActivePinia(createPinia());
    vi.clearAllMocks();
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
    expect(activateEditorTab).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      groupId: 'group-1',
      tabId: createdTab.id,
    });
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
});
