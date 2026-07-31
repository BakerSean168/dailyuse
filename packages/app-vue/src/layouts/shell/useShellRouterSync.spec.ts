/** @vitest-environment happy-dom */

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import { defineComponent, h } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  moduleForPath,
  MODULE_TITLE_KEYS,
  isStandaloneSettingsPath,
  resolveEntryLayout,
  AUTO_FOCUS_VIEWPORT,
} from './useShellRouterSync';
import { useShellRouterSync } from './useShellRouterSync';
import { useAppShellStore } from './useAppShellStore';

const originalInnerWidth = window.innerWidth;

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: originalInnerWidth,
  });
});

describe('moduleForPath (V2 §3 module matrix + settings scene D)', () => {
  it('maps every business route family to its shell module', () => {
    expect(moduleForPath('/goals')).toBe('goal');
    expect(moduleForPath('/goals/g-1')).toBe('goal');
    expect(moduleForPath('/goals/g-1/key-results/kr-1')).toBe('goal');
    expect(moduleForPath('/tasks')).toBe('task');
    expect(moduleForPath('/tasks/t-1')).toBe('task');
    expect(moduleForPath('/repository')).toBe('note');
    // retired /note/:id editor route no longer maps into the shell
    expect(moduleForPath('/note/n-1')).toBeNull();
    expect(moduleForPath('/governance')).toBe('note');
    expect(moduleForPath('/governance/r-1/history')).toBe('note');
    expect(moduleForPath('/reminders')).toBe('reminder');
    expect(moduleForPath('/notifications')).toBe('notification');
    expect(moduleForPath('/sse-monitor')).toBe('notification');
    expect(moduleForPath('/schedule')).toBe('schedule');
    expect(moduleForPath('/schedule/calendar')).toBe('schedule');
  });

  it('does not map settings/account into BusinessTab modules', () => {
    expect(moduleForPath('/settings')).toBeNull();
    expect(moduleForPath('/settings/')).toBeNull();
    expect(moduleForPath('/account')).toBeNull();
    expect(moduleForPath('/account/center')).toBeNull();
    expect(isStandaloneSettingsPath('/settings')).toBe(true);
    expect(isStandaloneSettingsPath('/settings/anything')).toBe(true);
    expect(isStandaloneSettingsPath('/account/center')).toBe(true);
    expect(isStandaloneSettingsPath('/tasks')).toBe(false);
  });

  it('returns null for shell-external and unknown paths', () => {
    expect(moduleForPath('/')).toBeNull();
    expect(moduleForPath('/auth')).toBeNull();
    expect(moduleForPath('/custom-notification')).toBeNull();
    expect(moduleForPath('/notes-typo')).toBeNull();
  });

  it('does not treat prefix-similar paths as module routes', () => {
    // '/notes' is not '/note' nor '/notifications'
    expect(moduleForPath('/notes')).toBeNull();
    expect(moduleForPath('/goalsmith')).toBeNull();
  });

  it('has a tab title key for every shell module', () => {
    for (const key of Object.values(MODULE_TITLE_KEYS)) {
      expect(key).toMatch(/^nav\./);
    }
    expect(MODULE_TITLE_KEYS).not.toHaveProperty('setting');
  });
});

describe('resolveEntryLayout (schedule/settings no longer force focus)', () => {
  it('auto-focuses only when the viewport cannot host a safe split', () => {
    expect(resolveEntryLayout(900, 'split', 'default')).toEqual({
      layout: 'focus',
      reason: 'viewport',
    });
    expect(resolveEntryLayout(AUTO_FOCUS_VIEWPORT, 'split', 'default')).toBeNull();
    expect(resolveEntryLayout(1200, 'split', 'default')).toBeNull();
  });

  it('auto-focuses when geometry reports canSplit=false even on wide viewports', () => {
    expect(resolveEntryLayout(1024, 'split', 'default', false)).toEqual({
      layout: 'focus',
      reason: 'viewport',
    });
    expect(resolveEntryLayout(1200, 'split', 'default', true)).toBeNull();
  });

  it('preserves explicit user focus when re-entering a module on a wide viewport', () => {
    expect(resolveEntryLayout(1400, 'focus', 'user')).toBeNull();
  });

  it('can restore split when previous focus was viewport-driven and space returns', () => {
    expect(resolveEntryLayout(1400, 'focus', 'viewport')).toEqual({
      layout: 'split',
      reason: 'default',
    });
  });
});

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      nav: { capsule: { goal: 'Goals' } },
      shell: {
        panel: {
          dirtyTransitionConfirm: 'Continue with unsaved changes?',
          busyTransitionHint: 'Please wait',
        },
      },
    },
  },
});

async function mountRouterSync(initialPath: string) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/goals', component: { template: '<div />' } },
    ],
  });
  await router.push(initialPath);
  await router.isReady();

  let actions: ReturnType<typeof useShellRouterSync> | null = null;
  const Host = defineComponent({
    setup() {
      actions = useShellRouterSync();
      return () => h('div');
    },
  });

  return {
    pinia,
    router,
    store: useAppShellStore(),
    actions: () => actions!,
    mount: () => mount(Host, { global: { plugins: [pinia, router, i18n] } }),
  };
}

describe('useShellRouterSync startup restoration', () => {
  it('preserves a user-hidden Home panel across startup and reopens it on explicit navigation', async () => {
    const fixture = await mountRouterSync('/');
    fixture.store.closeRightPanel();

    const wrapper = fixture.mount();
    expect(fixture.store.rightPanelOpen).toBe(false);

    await fixture.router.push('/goals');
    expect(fixture.store.rightPanelOpen).toBe(true);
    expect(fixture.store.panelSurface).toBe('business');
    wrapper.unmount();
  });

  it('preserves a hidden persisted business tab when startup restores its existing URL', async () => {
    const fixture = await mountRouterSync('/goals');
    fixture.store.openTab({
      module: 'goal',
      route: '/goals',
      title: 'Goals',
      intent: 'deeplink',
    });
    fixture.store.closeRightPanel();

    const wrapper = fixture.mount();

    expect(fixture.store.rightPanelOpen).toBe(false);
    expect(fixture.store.activeTab?.route).toBe('/goals');
    wrapper.unmount();
  });

  it('keeps the Home surface visible by using viewport focus when a narrow layout cannot split', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 900 });
    const fixture = await mountRouterSync('/goals');
    fixture.store.openTab({
      module: 'goal',
      route: '/goals',
      title: 'Goals',
      intent: 'deeplink',
    });
    const wrapper = fixture.mount();

    await fixture.router.push('/');

    expect(fixture.store.panelSurface).toBe('home');
    expect(fixture.store.layout).toBe('focus');
    expect(fixture.store.layoutReason).toBe('viewport');
    wrapper.unmount();
  });

  it('preserves the form-owned dirty status after the user confirms hiding the panel', async () => {
    const fixture = await mountRouterSync('/goals');
    fixture.store.openTab({
      module: 'goal',
      route: '/goals',
      title: 'Goals',
      intent: 'deeplink',
    });
    const wrapper = fixture.mount();
    fixture.store.setSurfaceStatus('dirty');
    const confirm = vi.fn(() => true);
    Object.defineProperty(window, 'confirm', { configurable: true, value: confirm });

    await fixture.actions().closePanel();

    expect(confirm).toHaveBeenCalledOnce();
    expect(fixture.store.rightPanelOpen).toBe(false);
    expect(fixture.store.surfaceStatus).toBe('dirty');
    wrapper.unmount();
  });
});
