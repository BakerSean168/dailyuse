import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { MAX_BUSINESS_TABS, useAppShellStore } from './useAppShellStore';

describe('useAppShellStore (V2 shell tabs)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts in STATE A (chat only, no tabs)', () => {
    const store = useAppShellStore();
    expect(store.tabs).toHaveLength(0);
    expect(store.isChatOnly).toBe(true);
    expect(store.activeTab).toBeUndefined();
  });

  it('capsule intent reuses the existing module tab and updates its route', () => {
    const store = useAppShellStore();
    const first = store.openTab({ module: 'goal', route: '/goals', title: 'Goals', intent: 'capsule' });
    const second = store.openTab({
      module: 'goal',
      route: '/goals/g-1',
      title: 'Goals',
      intent: 'capsule',
    });

    expect(second.tabId).toBe(first.tabId);
    expect(store.tabs).toHaveLength(1);
    expect(store.tabs[0]!.route).toBe('/goals/g-1');
  });

  it('deeplink intent opens a new tab per route without preempting others', () => {
    const store = useAppShellStore();
    store.openTab({ module: 'note', route: '/note/a', title: 'Notes', intent: 'deeplink' });
    store.openTab({ module: 'note', route: '/note/b', title: 'Notes', intent: 'deeplink' });

    expect(store.tabs).toHaveLength(2);
    expect(store.activeTab?.route).toBe('/note/b');

    // Same-route deeplink activates the existing tab instead of duplicating it.
    const again = store.openTab({ module: 'note', route: '/note/a', title: 'Notes', intent: 'deeplink' });
    expect(store.tabs).toHaveLength(2);
    expect(store.activeTabId).toBe(again.tabId);
    expect(store.activeTab?.route).toBe('/note/a');
  });

  it('reports the LRU eviction candidate beyond the tab limit without auto-closing', () => {
    const store = useAppShellStore();
    let firstId = '';
    for (let i = 0; i < MAX_BUSINESS_TABS; i += 1) {
      const result = store.openTab({
        module: 'note',
        route: `/note/${i}`,
        title: `N${i}`,
        intent: 'deeplink',
      });
      if (i === 0) firstId = result.tabId;
    }

    const overflow = store.openTab({
      module: 'goal',
      route: '/goals',
      title: 'Goals',
      intent: 'deeplink',
    });

    expect(store.tabs).toHaveLength(MAX_BUSINESS_TABS + 1);
    expect(overflow.evictionCandidateId).toBe(firstId);
  });

  it('closing the active tab activates a neighbor; closing the last returns to STATE A', () => {
    const store = useAppShellStore();
    const a = store.openTab({ module: 'goal', route: '/goals', title: 'G', intent: 'deeplink' });
    const b = store.openTab({ module: 'task', route: '/tasks', title: 'T', intent: 'deeplink' });

    const nextRoute = store.closeTab(b.tabId);
    expect(nextRoute).toBe('/goals');
    expect(store.activeTabId).toBe(a.tabId);

    expect(store.closeTab(a.tabId)).toBeNull();
    expect(store.isChatOnly).toBe(true);
  });

  it('keepAliveInclude mirrors the open tab ids', () => {
    const store = useAppShellStore();
    const a = store.openTab({ module: 'goal', route: '/goals', title: 'G', intent: 'deeplink' });
    const b = store.openTab({ module: 'task', route: '/tasks', title: 'T', intent: 'deeplink' });
    expect(store.keepAliveInclude).toEqual([a.tabId, b.tabId]);
  });
});
