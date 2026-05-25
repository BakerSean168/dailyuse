import { beforeEach, describe, expect, it } from 'vitest';
import { createTestPinia } from '@dailyuse/test-utils';
import { useEditorWorkspaceUiStore } from './editor-workspace-ui-store';

describe('useEditorWorkspaceUiStore', () => {
  beforeEach(() => {
    createTestPinia();
  });

  it('switches sidebar mode and toggles collapsed state', () => {
    const store = useEditorWorkspaceUiStore();

    expect(store.sidebarMode).toBe('files');
    expect(store.sidebarCollapsed).toBe(false);

    store.setSidebarMode('search');
    store.setSidebarCollapsed(true);
    expect(store.sidebarMode).toBe('search');
    expect(store.sidebarCollapsed).toBe(true);

    store.toggleSidebar();
    expect(store.sidebarCollapsed).toBe(false);
  });
});
