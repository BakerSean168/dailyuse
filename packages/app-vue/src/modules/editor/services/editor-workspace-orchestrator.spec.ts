import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  orchestrateOpenResource,
  orchestrateSetWorkspace,
  type EditorWorkspaceStoreView,
} from './editor-workspace-orchestrator';

const gateway = vi.hoisted(() => ({
  ensureEditorWorkspace: vi.fn(),
  listEditorSessions: vi.fn(),
  createEditorSession: vi.fn(),
  createEditorTab: vi.fn(),
  activateEditorTab: vi.fn(),
  deleteEditorTab: vi.fn(),
  updateEditorTab: vi.fn(),
}));

vi.mock('./editor-client-gateway', () => ({
  ...gateway,
  firstGroup: vi.fn(() => null),
}));

function createStore(): EditorWorkspaceStoreView {
  const store = {
    workspaceId: null,
    workspaceLookupId: null,
    sessions: [],
    activeSessionId: null,
    isHydrated: false,
    activeSession: null,
    openTabs: [],
    activeTab: null,
    activeTabId: null,
    activeResourceId: null,
    $patch(partial: Record<string, unknown>) {
      Object.assign(this, partial);
    },
    setSessions(sessions: never[]) {
      this.sessions = sessions;
      this.isHydrated = true;
    },
    upsertSession: vi.fn(),
  };
  return store as unknown as EditorWorkspaceStoreView;
}

describe('editor workspace orchestration concurrency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gateway.ensureEditorWorkspace.mockResolvedValue(null);
  });

  it('coalesces concurrent initialization for the same repository', async () => {
    let releaseWorkspace!: () => void;
    gateway.ensureEditorWorkspace.mockImplementationOnce(
      () =>
        new Promise<null>((resolve) => {
          releaseWorkspace = () => resolve(null);
        }),
    );
    const store = createStore();

    const bootstrap = orchestrateSetWorkspace(store, 'repository-1');
    const openResource = orchestrateOpenResource(store, {
      workspaceId: 'repository-1',
      resourceId: 'resource-1',
      title: 'Note',
    });

    await vi.waitFor(() => expect(gateway.ensureEditorWorkspace).toHaveBeenCalledTimes(1));
    releaseWorkspace();
    await Promise.all([bootstrap, openResource]);
    expect(gateway.ensureEditorWorkspace).toHaveBeenCalledTimes(1);
  });

  it('serializes initialization when the requested repository changes', async () => {
    const order: string[] = [];
    let releaseFirst!: () => void;
    gateway.ensureEditorWorkspace
      .mockImplementationOnce(
        (workspaceId: string) =>
          new Promise<null>((resolve) => {
            order.push(`start:${workspaceId}`);
            releaseFirst = () => {
              order.push(`finish:${workspaceId}`);
              resolve(null);
            };
          }),
      )
      .mockImplementationOnce(async (workspaceId: string) => {
        order.push(`start:${workspaceId}`);
        return null;
      });
    const store = createStore();

    const first = orchestrateSetWorkspace(store, 'repository-1');
    const second = orchestrateSetWorkspace(store, 'repository-2');

    await vi.waitFor(() => expect(order).toEqual(['start:repository-1']));
    releaseFirst();
    await Promise.all([first, second]);
    expect(order).toEqual([
      'start:repository-1',
      'finish:repository-1',
      'start:repository-2',
    ]);
  });
});
