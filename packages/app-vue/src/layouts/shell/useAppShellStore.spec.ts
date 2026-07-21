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
    expect(store.layoutReason).toBe('default');
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
    store.openTab({ module: 'note', route: '/repository?note=a', title: 'Notes', intent: 'deeplink' });
    store.openTab({ module: 'note', route: '/repository?note=b', title: 'Notes', intent: 'deeplink' });

    expect(store.tabs).toHaveLength(2);
    expect(store.activeTab?.route).toBe('/repository?note=b');

    // Same-route deeplink activates the existing tab instead of duplicating it.
    const again = store.openTab({ module: 'note', route: '/repository?note=a', title: 'Notes', intent: 'deeplink' });
    expect(store.tabs).toHaveLength(2);
    expect(store.activeTabId).toBe(again.tabId);
    expect(store.activeTab?.route).toBe('/repository?note=a');
  });

  it('reports the LRU eviction candidate beyond the tab limit without auto-closing', () => {
    const store = useAppShellStore();
    let firstId = '';
    for (let i = 0; i < MAX_BUSINESS_TABS; i += 1) {
      const result = store.openTab({
        module: 'note',
        route: `/repository?note=${i}`,
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
    expect(store.layout).toBe('split');
    expect(store.layoutReason).toBe('default');
  });

  it('toggleFocus records user layout reason', () => {
    const store = useAppShellStore();
    store.toggleFocus();
    expect(store.layout).toBe('focus');
    expect(store.layoutReason).toBe('user');
    store.toggleFocus();
    expect(store.layout).toBe('split');
    expect(store.layoutReason).toBe('user');
  });

  it('sanitizeLegacyTabs drops setting module tabs from persisted state', () => {
    const store = useAppShellStore();
    store.tabs = [
      {
        id: 'tab-setting-legacy',
        module: 'setting' as never,
        route: '/settings',
        title: 'Settings',
        lastActiveAt: Date.now(),
      },
      {
        id: 'tab-goal-1',
        module: 'goal',
        route: '/goals',
        title: 'Goals',
        lastActiveAt: Date.now(),
      },
    ];
    store.activeTabId = 'tab-setting-legacy';
    store.layout = 'focus';

    store.sanitizeLegacyTabs();

    expect(store.tabs).toHaveLength(1);
    expect(store.tabs[0]!.module).toBe('goal');
    expect(store.activeTabId).toBe('tab-goal-1');
  });

  it('sanitizeLegacyTabs drops retired /note editor routes from persisted tabs', () => {
    const store = useAppShellStore();
    store.tabs = [
      {
        id: 'tab-note-legacy',
        module: 'note',
        route: '/note/legacy-1',
        title: 'Legacy note',
        lastActiveAt: Date.now(),
      },
      {
        id: 'tab-repo',
        module: 'note',
        route: '/repository?note=keep-me',
        title: 'Repository',
        lastActiveAt: Date.now(),
      },
    ];
    store.activeTabId = 'tab-note-legacy';

    store.sanitizeLegacyTabs();

    expect(store.tabs).toHaveLength(1);
    expect(store.tabs[0]!.route).toBe('/repository?note=keep-me');
    expect(store.activeTabId).toBe('tab-repo');
  });

  it('keepAliveInclude mirrors the open tab ids', () => {
    const store = useAppShellStore();
    const a = store.openTab({ module: 'goal', route: '/goals', title: 'G', intent: 'deeplink' });
    const b = store.openTab({ module: 'task', route: '/tasks', title: 'T', intent: 'deeplink' });
    expect(store.keepAliveInclude).toEqual([a.tabId, b.tabId]);
  });

  it('resolvePanelWidth clamps for render without mutating preferred width', () => {
    const store = useAppShellStore();
    store.setPanelWidth(760);
    // 1200 viewport, 260 sidebar => max = min(760, 940-420)=520
    const effective = store.resolvePanelWidth(1200, 260);
    expect(effective).toBeLessThanOrEqual(520);
    expect(store.panelWidth).toBe(760);
  });

  it('clampPanelWidthToViewport alias also preserves preferred width', () => {
    const store = useAppShellStore();
    store.setPanelWidth(700);
    const effective = store.clampPanelWidthToViewport(1000, 260);
    expect(effective).toBeLessThanOrEqual(700);
    expect(store.panelWidth).toBe(700);
  });
});
